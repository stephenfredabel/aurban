import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Unified Button component
 * variant: 'primary' | 'outline' | 'ghost' | 'danger' | 'gold'
 * size:    'sm' | 'md' | 'lg' | 'xl'
 */
const VARIANTS = {
  primary: [
    'bg-brand-gold text-brand-charcoal-dark',
    'hover:bg-brand-gold-dark',
    'focus-visible:ring-brand-gold/40',
    'disabled:bg-brand-gold/50',
  ],
  outline: [
    'border border-brand-charcoal text-brand-charcoal bg-transparent',
    'hover:bg-brand-charcoal hover:text-white',
    'focus-visible:ring-brand-charcoal/30',
    'disabled:border-gray-200 disabled:text-gray-300',
  ],
  ghost: [
    'text-brand-charcoal bg-transparent',
    'hover:bg-brand-gray-soft',
    'focus-visible:ring-brand-charcoal/20',
    'disabled:text-gray-300',
  ],
  danger: [
    'bg-red-500 text-white',
    'hover:bg-red-600',
    'focus-visible:ring-red-400/40',
    'disabled:bg-red-300',
  ],
  dark: [
    'bg-brand-charcoal-dark text-white',
    'hover:bg-brand-charcoal',
    'focus-visible:ring-brand-charcoal/40',
    'disabled:bg-gray-300',
  ],
};

const SIZES = {
  sm:  'px-3.5 py-2 text-xs rounded-xl',
  md:  'px-5 py-2.5 text-sm rounded-xl',
  lg:  'px-6 py-3.5 text-sm rounded-2xl',
  xl:  'px-7 py-4 text-base rounded-2xl',
};

const Button = forwardRef(({
  children,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  ...props
}, ref) => {
  const variantClasses = VARIANTS[variant]?.join(' ') || VARIANTS.primary.join(' ');
  const sizeClasses    = SIZES[size] || SIZES.md;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      className={[
        'inline-flex items-center justify-center gap-2',
        'font-semibold font-body tracking-wide',
        'transition-all duration-200',
        'active:scale-95',
        'select-none outline-none',
        'focus-visible:ring-2 focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:active:scale-100',
        variantClasses,
        sizeClasses,
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin shrink-0" aria-hidden />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left'  && <span className="shrink-0">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;