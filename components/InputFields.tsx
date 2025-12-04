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

export const Label: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

export const ErrorMsg: React.FC<{ message?: string }> = ({ message }) => {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
};

export const Input: React.FC<InputProps> = ({ label, error, required, className = '', ...props }) => (
  <div className="mb-4">
    <Label required={required}>{label}</Label>
    <input
      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 ${error ? 'border-red-500' : ''} ${className}`}
      {...props}
    />
    <ErrorMsg message={error} />
  </div>
);

export const Select: React.FC<SelectProps> = ({ label, error, required, options, className = '', ...props }) => (
  <div className="mb-4">
    <Label required={required}>{label}</Label>
    <select
      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white ${error ? 'border-red-500' : ''} ${className}`}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    <ErrorMsg message={error} />
  </div>
);

export const TextArea: React.FC<TextAreaProps> = ({ label, error, required, className = '', ...props }) => (
  <div className="mb-4">
    <Label required={required}>{label}</Label>
    <textarea
      className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 ${error ? 'border-red-500' : ''} ${className}`}
      {...props}
    />
    <ErrorMsg message={error} />
  </div>
);