import { forwardRef, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

/**
 * Unified Input component
 * Supports: text, email, password, number, tel, search, textarea
 */
const Input = forwardRef(({
  label,
  hint,
  error,
  icon,
  iconRight,
  type        = 'text',
  required    = false,
  optional    = false,
  recommended = false,
  rows        = 4,
  className   = '',
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `input-${Math.random().toString(36).slice(2, 7)}`;
  const isPassword = type === 'password';
  const isTextarea = type === 'textarea';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const baseClass = [
    'w-full bg-white font-body text-sm text-brand-charcoal-dark',
    'border rounded-xl transition-all duration-200 outline-none',
    'placeholder:text-gray-400',
    'disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed',
    error
      ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
      : 'border-gray-200 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20',
    icon        ? 'pl-10' : 'pl-4',
    (iconRight || isPassword) ? 'pr-10' : 'pr-4',
    isTextarea  ? 'py-3 resize-none' : 'py-3',
    className,
  ].join(' ');

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center gap-2 mb-1.5">
          <label
            htmlFor={inputId}
            className="label-sm text-brand-charcoal-dark"
          >
            {label}
          </label>
          {required    && <span className="text-[10px] font-medium text-red-400 bg-red-50 px-1.5 py-0.5 rounded">Required</span>}
          {optional    && <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Optional</span>}
          {recommended && <span className="text-[10px] font-medium text-brand-gold-dark bg-brand-gold/10 px-1.5 py-0.5 rounded">Recommended</span>}
        </div>
      )}

      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </span>
        )}

        {isTextarea ? (
          <textarea
            ref={ref}
            id={inputId}
            rows={rows}
            className={baseClass}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        ) : (
          <input
            ref={ref}
            id={inputId}
            type={resolvedType}
            className={baseClass}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
        )}

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}

        {iconRight && !isPassword && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {iconRight}
          </span>
        )}
      </div>

      {hint && !error && (
        <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-gray-400 leading-relaxed">
          {hint}
        </p>
      )}

      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="mt-1.5 flex items-center gap-1.5 text-xs text-red-500"
        >
          <AlertCircle size={12} className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;