import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Link } from 'react-router-dom';

interface BaseProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
}

function FieldShell({
  id,
  label,
  error,
  hint,
  optional,
  children,
}: BaseProps & { id: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-steel">(opcional)</span>
        ) : (
          <span aria-hidden="true" className="ml-0.5 text-orange-ink">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-steel">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: ReactNode) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

export const TextField = forwardRef<
  HTMLInputElement,
  BaseProps & InputHTMLAttributes<HTMLInputElement>
>(function TextField({ label, error, hint, optional, id: idProp, ...rest }, ref) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional}>
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-required={!optional || undefined}
        aria-describedby={describedBy(id, error, hint)}
        className="field-input"
        {...rest}
      />
    </FieldShell>
  );
});

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextAreaField({ label, error, hint, optional, id: idProp, ...rest }, ref) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional}>
      <textarea
        ref={ref}
        id={id}
        rows={5}
        aria-invalid={error ? true : undefined}
        aria-required={!optional || undefined}
        aria-describedby={describedBy(id, error, hint)}
        className="field-input min-h-32 resize-y"
        {...rest}
      />
    </FieldShell>
  );
});

export const SelectField = forwardRef<
  HTMLSelectElement,
  BaseProps & SelectHTMLAttributes<HTMLSelectElement>
>(function SelectField({ label, error, hint, optional, id: idProp, children, ...rest }, ref) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional}>
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className="field-input appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%228%22 viewBox=%220 0 12 8%22><path d=%22M1 1l5 5 5-5%22 fill=%22none%22 stroke=%22%232B2E33%22 stroke-width=%221.6%22/></svg>')] bg-[length:12px_8px] bg-[position:right_14px_center] bg-no-repeat pr-10"
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
});

export const ConsentField = forwardRef<
  HTMLInputElement,
  { error?: string } & InputHTMLAttributes<HTMLInputElement>
>(function ConsentField({ error, ...rest }, ref) {
  const id = useId();
  return (
    <div>
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-6 shrink-0 cursor-pointer accent-orange"
          {...rest}
        />
        <label htmlFor={id} className="cursor-pointer text-sm leading-relaxed text-graphite">
          Autorizo a Ceará Náutica a usar meus dados para responder a esta solicitação, conforme a{' '}
          <Link
            to="/politica-de-privacidade"
            className="link-underline font-medium"
            target="_blank"
          >
            Política de Privacidade
          </Link>
          .
        </label>
      </div>
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});

/** Campo armadilha anti-spam: invisível para pessoas, preenchido por robôs. */
export const HoneypotField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function HoneypotField(props, ref) {
    return (
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Não preencha este campo
          <input ref={ref} type="text" tabIndex={-1} autoComplete="off" {...props} />
        </label>
      </div>
    );
  },
);
