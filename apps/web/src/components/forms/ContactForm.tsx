import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Send } from 'lucide-react';
import { contactSchema, type ContactData } from '@cn/shared';
import { sendContact, wakeApi } from '@/lib/api';
import { getUtm } from '@/lib/utm';
import { track } from '@/lib/analytics';
import { ConsentField, HoneypotField, TextAreaField, TextField } from './fields';
import { useLeadSubmit } from './useLeadSubmit';
import { FormError, FormSuccess, PhoneConfirmation, SlowNotice } from './FormFeedback';

export interface ContactFormValues {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  consent: boolean;
  website: string;
}

const FIELDS = ['name', 'phone', 'email', 'subject', 'message', 'consent'] as const;
const resolver = zodResolver(contactSchema) as unknown as Resolver<ContactFormValues>;

export function ContactForm({ defaultSubject = '' }: { defaultSubject?: string }) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver,
    mode: 'onTouched',
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      subject: defaultSubject,
      message: '',
      consent: false,
      website: '',
    },
  });
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
    // após o resolver, os valores já estão no formato de saída do contactSchema
    const data = values as unknown as ContactData;
    setSentPhone(values.phone);
    return run(
      () => sendContact({ ...data, utm: getUtm() }),
      () => track('form_submit', { form: 'contact' }),
    );
  });

  if (status.kind === 'success') {
    return (
      <FormSuccess
        title="Mensagem enviada"
        resetLabel="Enviar outra mensagem"
        onReset={() => {
          reset();
          setStatus({ kind: 'idle' });
        }}
      >
        <p>Obrigado pelo contato! A equipe da Ceará Náutica vai ler a sua mensagem.</p>
        <PhoneConfirmation
          phone={sentPhone}
          onEdit={() => {
            setStatus({ kind: 'idle' });
            setEditPhone(true);
          }}
        />
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
      aria-label="Formulário de contato"
    >
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
      </div>
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        optional
        error={errors.email?.message}
        {...register('email')}
      />
      <TextField label="Assunto" error={errors.subject?.message} {...register('subject')} />
      <TextAreaField label="Mensagem" error={errors.message?.message} {...register('message')} />
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
              <Send aria-hidden="true" className="size-5" /> Enviar mensagem
            </>
          )}
        </button>
        <p className="text-sm text-steel" data-testid="response-note">
          Retornamos pelo telefone informado (ligação ou WhatsApp).
        </p>
      </div>
    </form>
  );
}
