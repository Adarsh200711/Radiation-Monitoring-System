import type { ReactNode } from 'react';

interface SelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  error,
}: SelectProps) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`w-full rounded-lg border bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500 ${
          error ? 'border-red-500' : 'border-slate-700'
        }`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  error,
}: InputProps) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full rounded-lg border bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 ${
          error ? 'border-red-500' : 'border-slate-700'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface TextAreaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  error?: string;
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  required,
  rows = 3,
  error,
}: TextAreaProps) {
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
          {required && <span className="text-red-400">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={`w-full resize-none rounded-lg border bg-slate-800/50 px-3 py-2 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 ${
          error ? 'border-red-500' : 'border-slate-700'
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled,
  className = '',
}: ButtonProps) {
  const variants = {
    primary:
      'bg-sky-600 text-white hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500',
    secondary:
      'border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-50',
    danger: 'bg-red-600 text-white hover:bg-red-500 disabled:opacity-50',
    ghost: 'text-slate-300 hover:bg-slate-800 hover:text-slate-100 disabled:opacity-50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
