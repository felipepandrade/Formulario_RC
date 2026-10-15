import React, { useId } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

interface BaseProps {
  label: string;
  error?: string;
  /** Helper text shown under the field while it has no error. */
  hint?: React.ReactNode;
  required?: boolean;
  id?: string;
}

interface InputProps extends BaseProps, React.InputHTMLAttributes<HTMLInputElement> {}
interface SelectProps extends BaseProps, React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { label: string; value: string }[];
}
interface TextAreaProps extends BaseProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Label: React.FC<{ children: React.ReactNode; htmlFor?: string; required?: boolean }> = ({ children, htmlFor, required }) => (
  <label htmlFor={htmlFor} className="block text-sm font-bold text-gray-800 mb-1.5">
    {children} {required && <span className="text-red-600" aria-hidden="true">*</span>}
  </label>
);

export const ErrorMsg: React.FC<{ message?: string; id?: string }> = ({ message, id }) => {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
};

const Hint: React.FC<{ children?: React.ReactNode; id: string }> = ({ children, id }) =>
  children ? <div id={id} className="mt-1.5 text-sm text-gray-600">{children}</div> : null;

// Accessibility attributes that tie a field to its error or hint for screen readers.
const fieldA11yProps = (id: string, error?: string, required?: boolean, hint?: React.ReactNode) => ({
  'aria-invalid': error ? true : undefined,
  'aria-describedby': error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  'aria-required': required || undefined,
});

// Shared look of every field: 44px tall, visible focus ring, red border and ring when invalid.
const fieldClasses = (error?: string) =>
  `block w-full rounded-lg border bg-white px-3 text-base sm:text-sm text-gray-900 placeholder:text-gray-500 shadow-xs transition-colors ` +
  `hover:border-gray-400 focus:outline-hidden focus:ring-3 ` +
  (error
    ? 'border-red-500 focus:border-red-600 focus:ring-red-100'
    : 'border-gray-300 focus:border-brand-600 focus:ring-brand-100');

const FieldMessages: React.FC<{ id: string; error?: string; hint?: React.ReactNode }> = ({ id, error, hint }) =>
  error ? <ErrorMsg id={`${id}-error`} message={error} /> : <Hint id={`${id}-hint`}>{hint}</Hint>;

export const Input = React.memo<InputProps>(({ label, error, hint, required, id: providedId, className = '', ...props }) => {
  const generatedId = useId();
  const id = providedId || generatedId;
  return (
    <div>
      <Label htmlFor={id} required={required}>{label}</Label>
      <input
        id={id}
        {...fieldA11yProps(id, error, required, hint)}
        className={`${fieldClasses(error)} h-11 ${className}`}
        {...props}
      />
      <FieldMessages id={id} error={error} hint={hint} />
    </div>
  );
});

export const Select = React.memo<SelectProps>(({ label, error, hint, required, id: providedId, options, className = '', ...props }) => {
  const generatedId = useId();
  const id = providedId || generatedId;
  return (
    <div>
      <Label htmlFor={id} required={required}>{label}</Label>
      <div className="relative">
        <select
          id={id}
          {...fieldA11yProps(id, error, required, hint)}
          className={`${fieldClasses(error)} h-11 appearance-none pr-9 ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-gray-900">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600"
          aria-hidden="true"
        />
      </div>
      <FieldMessages id={id} error={error} hint={hint} />
    </div>
  );
});

export const TextArea = React.memo<TextAreaProps>(({ label, error, hint, required, id: providedId, className = '', ...props }) => {
  const generatedId = useId();
  const id = providedId || generatedId;
  return (
    <div>
      <Label htmlFor={id} required={required}>{label}</Label>
      <textarea
        id={id}
        {...fieldA11yProps(id, error, required, hint)}
        className={`${fieldClasses(error)} py-2.5 leading-relaxed resize-y ${className}`}
        {...props}
      />
      <FieldMessages id={id} error={error} hint={hint} />
    </div>
  );
});
