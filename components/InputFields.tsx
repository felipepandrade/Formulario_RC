
import React, { useId } from 'react';

interface BaseProps {
  label: string;
  error?: string;
  required?: boolean;
  id?: string;
}

interface InputProps extends BaseProps, React.InputHTMLAttributes<HTMLInputElement> {}
interface SelectProps extends BaseProps, React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { label: string; value: string }[];
}
interface TextAreaProps extends BaseProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Label: React.FC<{ children: React.ReactNode; htmlFor?: string; required?: boolean }> = ({ children, htmlFor, required }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

export const ErrorMsg: React.FC<{ message?: string; id?: string }> = ({ message, id }) => {
  if (!message) return null;
  return <p id={id} className="mt-1 text-sm text-red-600">{message}</p>;
};

// Accessibility attributes that tie a field to its error message for screen readers.
const fieldA11yProps = (id: string, error?: string, required?: boolean) => ({
  'aria-invalid': error ? true : undefined,
  'aria-describedby': error ? `${id}-error` : undefined,
  'aria-required': required || undefined,
});

export const Input = React.memo<InputProps>(({ label, error, required, id: providedId, className = '', ...props }) => {
  const generatedId = useId();
  const id = providedId || generatedId;
  return (
    <div className="mb-4">
      <Label htmlFor={id} required={required}>{label}</Label>
      <input
        id={id}
        {...fieldA11yProps(id, error, required)}
        className={`block w-full rounded-md border-gray-300 shadow-xs focus:border-sky-500 focus:ring-sky-500 sm:text-sm border p-2 bg-white text-gray-900 placeholder-gray-400 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      <ErrorMsg id={`${id}-error`} message={error} />
    </div>
  );
});

export const Select = React.memo<SelectProps>(({ label, error, required, id: providedId, options, className = '', ...props }) => {
  const generatedId = useId();
  const id = providedId || generatedId;
  return (
    <div className="mb-4">
      <Label htmlFor={id} required={required}>{label}</Label>
      <select
        id={id}
        {...fieldA11yProps(id, error, required)}
        className={`block w-full rounded-md border-gray-300 shadow-xs focus:border-sky-500 focus:ring-sky-500 sm:text-sm border p-2 bg-white text-gray-900 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="text-gray-900">
            {opt.label}
          </option>
        ))}
      </select>
      <ErrorMsg id={`${id}-error`} message={error} />
    </div>
  );
});

export const TextArea = React.memo<TextAreaProps>(({ label, error, required, id: providedId, className = '', ...props }) => {
  const generatedId = useId();
  const id = providedId || generatedId;
  return (
    <div className="mb-4">
      <Label htmlFor={id} required={required}>{label}</Label>
      <textarea
        id={id}
        {...fieldA11yProps(id, error, required)}
        className={`block w-full rounded-md border-gray-300 shadow-xs focus:border-sky-500 focus:ring-sky-500 sm:text-sm border p-2 bg-white text-gray-900 placeholder-gray-400 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      <ErrorMsg id={`${id}-error`} message={error} />
    </div>
  );
});
