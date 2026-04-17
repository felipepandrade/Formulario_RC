
import React from 'react';

interface BaseProps {
  label: string;
  error?: string;
  required?: boolean;
}

interface InputProps extends BaseProps, React.InputHTMLAttributes<HTMLInputElement> {}
interface SelectProps extends BaseProps, React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { label: string; value: string }[];
}
interface TextAreaProps extends BaseProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Label: React.FC<{ children: React.ReactNode; required?: boolean; htmlFor?: string }> = ({ children, required, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1 cursor-pointer">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

export const ErrorMsg: React.FC<{ message?: string; id?: string }> = ({ message, id }) => {
  if (!message) return null;
  return <p id={id} className="mt-1 text-sm text-red-600">{message}</p>;
};

export const Input: React.FC<InputProps> = ({ label, error, required, className = '', id, ...props }) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  return (
    <div className="mb-4">
      <Label htmlFor={inputId} required={required}>{label}</Label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm border p-2 bg-white text-gray-900 placeholder-gray-400 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      <ErrorMsg id={errorId} message={error} />
    </div>
  );
};

export const Select: React.FC<SelectProps> = ({ label, error, required, options, className = '', id, ...props }) => {
  const generatedId = React.useId();
  const selectId = id || generatedId;
  const errorId = `${selectId}-error`;
  return (
    <div className="mb-4">
      <Label htmlFor={selectId} required={required}>{label}</Label>
      <select
        id={selectId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm border p-2 bg-white text-gray-900 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="text-gray-900">
            {opt.label}
          </option>
        ))}
      </select>
      <ErrorMsg id={errorId} message={error} />
    </div>
  );
};

export const TextArea: React.FC<TextAreaProps> = ({ label, error, required, className = '', id, ...props }) => {
  const generatedId = React.useId();
  const textAreaId = id || generatedId;
  const errorId = `${textAreaId}-error`;
  return (
    <div className="mb-4">
      <Label htmlFor={textAreaId} required={required}>{label}</Label>
      <textarea
        id={textAreaId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm border p-2 bg-white text-gray-900 placeholder-gray-400 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      <ErrorMsg id={errorId} message={error} />
    </div>
  );
};
