import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Loader2, Send, X } from 'lucide-react';
import {
  CATEGORIES,
  getCategory,
  quoteSchema,
  REQUEST_TYPES,
  type Product,
  type QuoteData,
} from '@cn/shared';
import { sendQuote, wakeApi } from '@/lib/api';
import { getUtm } from '@/lib/utm';
import { track } from '@/lib/analytics';
import { SmartImage } from '@/components/ui/SmartImage';
import { productImages } from '@/lib/images';
import {
  QUOTE_MESSAGE_HINTS,
  QUOTE_MESSAGE_PLACEHOLDERS,
  QUOTE_MESSAGE_REQUIRED,
  SERVICE_REQUEST_TYPES,
} from '@/data/content';
import { ConsentField, HoneypotField, SelectField, TextAreaField, TextField } from './fields';
import { useLeadSubmit } from './useLeadSubmit';
import { FormError, FormSuccess, PhoneConfirmation, SlowNotice } from './FormFeedback';

export interface QuoteFormValues {
  name: string;
  phone: string;
  email: string;
  city: string;
  requestType: string;
  category: string;
  productSlug: string;
  message: string;
  consent: boolean;
  website: string;
}

const FIELDS = [
  'name',
  'phone',
  'email',
  'city',
  'requestType',
  'category',
  'productSlug',
  'message',
  'consent',
] as const;
const baseResolver = zodResolver(quoteSchema);

/** Campos opcionais vazios viram undefined antes do Zod (enum/regex não aceitam ""). */
const MESSAGE_MIN = 10;

const resolver: Resolver<QuoteFormValues> = async (values, ctx, opts) => {
  const v = values as QuoteFormValues;
  const prepared = {
    ...v,
    requestType: v.requestType || undefined,
    category: v.category || undefined,
    productSlug: v.productSlug || undefined,
    city: v.city || undefined,
  };
  const result = await (baseResolver as unknown as Resolver<QuoteFormValues>)(
    prepared as unknown as QuoteFormValues,
    ctx,
    opts,
  );
  // UX-28: em pedido de serviço, mensagem vazia/curta diz o que falta contar
  const required = QUOTE_MESSAGE_REQUIRED[v.requestType as keyof typeof QUOTE_MESSAGE_REQUIRED];
  const msgError = result.errors.message;
  const text = (v.message ?? '').trim();
  if (required && msgError && text.length < MESSAGE_MIN) {
    msgError.message = text
      ? `${required} Escreva pelo menos ${MESSAGE_MIN} caracteres.`
      : required;
  }
  return result;
};

interface Props {
  products: Product[];
  initialProductSlug?: string;
  initialCategory?: string;
  initialMessage?: string;
  initialRequestType?: string;
  /** Avisa a página do tipo de pedido atual (topo e "Como funciona", UX-30). */
  onRequestTypeChange?: (requestType: string) => void;
}

/** Sugere o tipo de solicitação a partir da categoria escolhida. */
function requestTypeForCategory(category?: string): string {
  if (!category) return '';
  if (category === 'motores-de-popa') return 'motor';
  if (category === 'estofamentos') return 'estofamento';
  return 'nova-embarcacao';
}

const RESPONSE_NOTE = 'Retornamos pelo telefone informado (ligação ou WhatsApp).';

export function QuoteForm({
  products,
  initialProductSlug,
  initialCategory,
  initialMessage = '',
  initialRequestType,
  onRequestTypeChange,
}: Props) {
  const initialProduct = products.find((p) => p.slug === initialProductSlug);
  const validInitialType =
    initialRequestType && REQUEST_TYPES.some((r) => r.value === initialRequestType)
      ? initialRequestType
      : undefined;
  const startCategory =
    initialProduct?.category ??
    (initialCategory && getCategory(initialCategory) ? initialCategory : '');

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuoteFormValues>({
    resolver,
    mode: 'onTouched',
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      city: '',
      requestType: validInitialType ?? requestTypeForCategory(startCategory),
      category: startCategory,
      productSlug: initialProduct?.slug ?? '',
      message: initialMessage,
      consent: false,
      website: '',
    },
  });

  /**
   * QA-02: o tipo de solicitação é "automático" (sugerido pela categoria) até a
   * pessoa escolher um tipo manualmente. Um tipo vindo da URL (?servico=) conta
   * como escolha e não é sobrescrito.
   */
  const typeIsAuto = useRef(!validInitialType);
  const suggestType = (cat: string) => {
    if (typeIsAuto.current) setValue('requestType', requestTypeForCategory(cat));
  };

  // produtos podem chegar depois (API) — aplica a pré-seleção quando disponíveis.
  // Depende do slug/categoria (não do objeto): trocar o catálogo local pelo da
  // API com o mesmo produto não desfaz o que a pessoa já escolheu.
  const initialSlug = initialProduct?.slug;
  const initialProductCategory = initialProduct?.category;
  useEffect(() => {
    if (initialSlug && initialProductCategory) {
      setValue('productSlug', initialSlug);
      setValue('category', initialProductCategory);
      if (typeIsAuto.current)
        setValue('requestType', requestTypeForCategory(initialProductCategory));
    }
  }, [initialSlug, initialProductCategory, setValue]);

  const category = watch('category');
  const productSlug = watch('productSlug');
  const requestType = watch('requestType');
  const selected = products.find((p) => p.slug === productSlug);
  const options = useMemo(
    () => (category ? products.filter((p) => p.category === category) : products),
    [category, products],
  );

  /**
   * UX-10: com o produto vindo do link (?produto=), mostra só o cartão do
   * produto; Categoria e Modelo ficam ocultos (os valores continuam no envio).
   * "Trocar" remove o produto e volta a mostrar os dois campos.
   */
  const [productRemoved, setProductRemoved] = useState(false);
  const compact = Boolean(initialProduct && selected && !productRemoved);
  const categoryName = selected ? getCategory(selected.category)?.name : undefined;

  /**
   * UX-24: para serviço (reparo, manutenção, motor com problema, estofamento)
   * escolhido pela pessoa ou pelo link, Categoria e Modelo não fazem sentido e
   * ficam ocultos. Se o tipo foi só sugerido pela categoria (ex.: escolheu
   * "Estofamentos"), os campos continuam visíveis para não sumirem sob o dedo.
   */
  const serviceType =
    !typeIsAuto.current && (SERVICE_REQUEST_TYPES as readonly string[]).includes(requestType);
  const hideProductFields = compact || serviceType;
  const messagePlaceholder =
    QUOTE_MESSAGE_PLACEHOLDERS[requestType as keyof typeof QUOTE_MESSAGE_PLACEHOLDERS] ??
    QUOTE_MESSAGE_PLACEHOLDERS.default;

  useEffect(() => {
    onRequestTypeChange?.(requestType);
  }, [requestType, onRequestTypeChange]);

  const messageHint =
    QUOTE_MESSAGE_HINTS[requestType as keyof typeof QUOTE_MESSAGE_HINTS] ??
    QUOTE_MESSAGE_HINTS.default;

  const { status, setStatus, run } = useLeadSubmit(setError, FIELDS);
  const [sentPhone, setSentPhone] = useState('');
  const [editPhone, setEditPhone] = useState(false);

  // "Corrigir o telefone" na tela de sucesso: volta ao formulário com o foco no telefone
  useEffect(() => {
    if (editPhone && status.kind === 'idle') {
      setFocus('phone', { shouldSelect: true });
      setEditPhone(false);
    }
  }, [editPhone, status.kind, setFocus]);

  const onSubmit = handleSubmit((values) => {
    const data = { ...(values as unknown as QuoteData) };
    // pedido de serviço sem produto do link: o "modelo de referência" (oculto) não vai junto
    if (serviceType && !compact) delete data.productSlug;
    setSentPhone(values.phone);
    return run(
      () => sendQuote({ ...data, utm: getUtm() }),
      () =>
        track('generate_lead', {
          form: 'quote',
          category: data.category,
          request_type: data.requestType,
          product_slug: data.productSlug,
        }),
    );
  });

  if (status.kind === 'success') {
    return (
      <FormSuccess
        title="Pedido de orçamento enviado"
        resetLabel="Fazer outro pedido"
        onReset={() => {
          typeIsAuto.current = true;
          setProductRemoved(true);
          reset({
            name: '',
            phone: '',
            email: '',
            city: '',
            requestType: '',
            category: '',
            productSlug: '',
            message: '',
            consent: false,
            website: '',
          });
          setStatus({ kind: 'idle' });
        }}
      >
        <p>Recebemos o seu pedido.</p>
        <PhoneConfirmation
          phone={sentPhone}
          onEdit={() => {
            setStatus({ kind: 'idle' });
            setEditPhone(true);
          }}
        />
        <div>
          <p className="font-semibold text-graphite-deep">O que acontece agora</p>
          <ol className="mt-1 list-decimal space-y-1 pl-5" data-testid="next-steps">
            <li>Um vendedor da Ceará Náutica confere o seu pedido.</li>
            <li>Ele entra em contato nesse número para entender os detalhes.</li>
            <li>Preço, prazo e condições são informados no orçamento, conforme o projeto.</li>
          </ol>
        </div>
        <p>
          Enquanto isso, veja mais{' '}
          <Link to="/produtos" className="link-underline font-medium text-graphite-deep">
            embarcações
          </Link>
          .
        </p>
      </FormSuccess>
    );
  }

  const loading = status.kind === 'loading';

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      // ao começar a preencher, acorda a API em segundo plano (limitado em wakeApi)
      onFocus={wakeApi}
      aria-busy={loading}
      className="relative space-y-5"
      aria-label="Formulário de orçamento"
    >
      {compact && selected && (
        <div
          className="flex items-center gap-4 rounded-md border border-graphite/15 bg-white p-3"
          data-testid="selected-product"
        >
          <div className="h-16 w-20 shrink-0 overflow-hidden rounded-sm bg-steel-light">
            <SmartImage
              src={productImages(selected)[0]?.src ?? ''}
              alt=""
              className="h-full w-full object-cover"
              sizes="80px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-orange-ink">Produto selecionado</p>
            <p className="font-display text-xl leading-tight font-semibold uppercase">
              {selected.name}
            </p>
            {categoryName && <p className="text-sm text-steel">{categoryName}</p>}
          </div>
          <button
            type="button"
            onClick={() => {
              setValue('productSlug', '');
              setProductRemoved(true);
            }}
            className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-sm px-2 text-sm font-medium text-steel hover:bg-steel-light/60 hover:text-graphite-deep"
          >
            <X aria-hidden="true" className="size-5" />
            Trocar<span className="sr-only"> produto (remover produto selecionado)</span>
          </button>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Nome"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <TextField
          label="Telefone / WhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(92) 90000-0000"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          optional
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Cidade"
          autoComplete="address-level2"
          optional
          placeholder="Ex.: Manaus"
          error={errors.city?.message}
          {...register('city')}
        />
      </div>
      {/* Tipo em linha própria: a grade de contato fica sempre 2×2, sem buraco (UX-24). */}
      <SelectField
        label="Tipo de solicitação"
        optional
        error={errors.requestType?.message}
        {...register('requestType', {
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
            // escolha manual: a categoria deixa de sugerir o tipo (vazio = volta a sugerir)
            typeIsAuto.current = !e.target.value;
          },
        })}
      >
        <option value="">Selecione (opcional)</option>
        {REQUEST_TYPES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </SelectField>
      {/*
        Categoria e Modelo ocultos com produto vindo do link (UX-10) ou em pedido
        de serviço (UX-24). Continuam no DOM: os valores válidos seguem no envio.
      */}
      <div
        className={hideProductFields ? 'hidden' : 'grid gap-5 sm:grid-cols-2'}
        hidden={hideProductFields}
        data-testid="product-fields"
      >
        <SelectField
          label="Categoria"
          optional
          error={errors.category?.message}
          {...register('category', {
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
              const current = products.find((p) => p.slug === productSlug);
              if (current && current.category !== e.target.value) setValue('productSlug', '');
              suggestType(e.target.value);
            },
          })}
        >
          <option value="">Selecione (opcional)</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Modelo de referência"
          optional
          error={errors.productSlug?.message}
          {...register('productSlug', {
            onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
              // escolher um modelo define a categoria dele (e o tipo sugerido)
              const p = products.find((x) => x.slug === e.target.value);
              if (p && p.category !== category) {
                setValue('category', p.category);
                suggestType(p.category);
              }
            },
          })}
        >
          <option value="">Nenhum / projeto sob medida</option>
          {options.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </SelectField>
      </div>
      <TextAreaField
        label="Conte o que você precisa"
        hint={messageHint}
        placeholder={messagePlaceholder}
        error={errors.message?.message}
        {...register('message')}
      />
      <HoneypotField {...register('website')} />
      <ConsentField error={errors.consent?.message} {...register('consent')} />
      <FormError status={status} />
      <SlowNotice status={status} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <button type="submit" className="btn-primary w-full shrink-0 sm:w-auto" disabled={loading}>
          {loading ? (
            <>
              <Loader2 aria-hidden="true" className="size-5 animate-spin" /> Enviando…
            </>
          ) : (
            <>
              <Send aria-hidden="true" className="size-5" /> Solicitar orçamento
            </>
          )}
        </button>
        <p className="text-sm text-steel" data-testid="response-note">
          {RESPONSE_NOTE}
        </p>
      </div>
    </form>
  );
}
