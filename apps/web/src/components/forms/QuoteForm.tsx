import { useEffect, useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Loader2, Send, X } from 'lucide-react';
import { CATEGORIES, getCategory, quoteSchema, type Product, type QuoteData } from '@cn/shared';
import { sendQuote } from '@/lib/api';
import { getUtm } from '@/lib/utm';
import { track } from '@/lib/analytics';
import { SmartImage } from '@/components/ui/SmartImage';
import { ConsentField, HoneypotField, SelectField, TextAreaField, TextField } from './fields';
import { useLeadSubmit } from './useLeadSubmit';
import { FormError, FormSuccess } from './FormFeedback';

export interface QuoteFormValues {
  name: string;
  phone: string;
  email: string;
  city: string;
  category: string;
  productSlug: string;
  message: string;
  consent: boolean;
  website: string;
}

const FIELDS = ['name', 'phone', 'email', 'city', 'category', 'productSlug', 'message', 'consent'] as const;
const baseResolver = zodResolver(quoteSchema);

/** Campos opcionais vazios viram undefined antes do Zod (enum/regex não aceitam ""). */
const resolver: Resolver<QuoteFormValues> = (values, ctx, opts) => {
  const v = values as QuoteFormValues;
  const prepared = {
    ...v,
    category: v.category || undefined,
    productSlug: v.productSlug || undefined,
    city: v.city || undefined,
  };
  return (baseResolver as unknown as Resolver<QuoteFormValues>)(prepared as unknown as QuoteFormValues, ctx, opts);
};

interface Props {
  products: Product[];
  initialProductSlug?: string;
  initialCategory?: string;
  initialMessage?: string;
}

export function QuoteForm({ products, initialProductSlug, initialCategory, initialMessage = '' }: Props) {
  const initialProduct = products.find((p) => p.slug === initialProductSlug);
  const startCategory =
    initialProduct?.category ?? (initialCategory && getCategory(initialCategory) ? initialCategory : '');

  const {
    register,
    handleSubmit,
    reset,
    setError,
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
      category: startCategory,
      productSlug: initialProduct?.slug ?? '',
      message: initialMessage,
      consent: false,
      website: '',
    },
  });

  // produtos podem chegar depois (API) — aplica a pré-seleção quando disponíveis
  useEffect(() => {
    if (initialProduct) {
      setValue('productSlug', initialProduct.slug);
      setValue('category', initialProduct.category);
    }
  }, [initialProduct, setValue]);

  const category = watch('category');
  const productSlug = watch('productSlug');
  const selected = products.find((p) => p.slug === productSlug);
  const options = useMemo(
    () => (category ? products.filter((p) => p.category === category) : products),
    [category, products],
  );

  const { status, setStatus, run } = useLeadSubmit(setError, FIELDS);

  const onSubmit = handleSubmit((values) => {
    const data = values as unknown as QuoteData;
    return run(
      () => sendQuote({ ...data, utm: getUtm() }),
      () =>
        track('generate_lead', {
          form: 'quote',
          category: data.category,
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
          reset({
            name: '',
            phone: '',
            email: '',
            city: '',
            category: '',
            productSlug: '',
            message: '',
            consent: false,
            website: '',
          });
          setStatus({ kind: 'idle' });
        }}
      >
        <p>
          Recebemos o seu pedido. Um vendedor da Ceará Náutica vai entrar em contato pelo telefone
          informado para entender o seu projeto.
        </p>
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
    <form noValidate onSubmit={onSubmit} aria-busy={loading} className="relative space-y-5" aria-label="Formulário de orçamento">
      {selected && (
        <div className="flex items-center gap-4 rounded-md border border-graphite/15 bg-white p-3">
          <div className="h-16 w-20 shrink-0 overflow-hidden rounded-sm bg-steel-light">
            <SmartImage src={selected.images[0]?.src ?? ''} alt="" className="h-full w-full object-cover" sizes="80px" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-orange-ink">Produto selecionado</p>
            <p className="truncate font-display text-xl font-semibold uppercase">{selected.name}</p>
          </div>
          <button
            type="button"
            onClick={() => setValue('productSlug', '')}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm text-steel hover:bg-steel-light/60 hover:text-graphite-deep"
          >
            <X aria-hidden="true" className="size-5" />
            <span className="sr-only">Remover produto selecionado</span>
          </button>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Nome" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <TextField
          label="Telefone / WhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(92) 90000-0000"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <TextField label="E-mail" type="email" autoComplete="email" optional error={errors.email?.message} {...register('email')} />
        <TextField label="Cidade" autoComplete="address-level2" optional placeholder="Ex.: Manaus" error={errors.city?.message} {...register('city')} />
        <SelectField
          label="Categoria"
          optional
          error={errors.category?.message}
          {...register('category', {
            onChange: () => {
              const current = products.find((p) => p.slug === productSlug);
              if (current) setValue('productSlug', '');
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
        <SelectField label="Modelo de referência" optional error={errors.productSlug?.message} {...register('productSlug')}>
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
        hint="Ex.: tipo de uso (lazer, pesca, trabalho), tamanho desejado, motorização, cor, prazo."
        error={errors.message?.message}
        {...register('message')}
      />
      <HoneypotField {...register('website')} />
      <ConsentField error={errors.consent?.message} {...register('consent')} />
      <FormError status={status} />
      <button type="submit" className="btn-primary w-full sm:w-auto" disabled={loading}>
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
    </form>
  );
}
