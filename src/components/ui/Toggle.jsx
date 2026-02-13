/**
 * Accessible on/off toggle switch
 */
export default function Toggle({
  checked   = false,
  onChange,
  label,
  description,
  disabled  = false,
  size      = 'md',
  id,
}) {
  const toggleId = id || `toggle-${Math.random().toString(36).slice(2, 7)}`;
  const isLarge  = size === 'lg';

  return (
    <div className="flex items-center justify-between gap-3">
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label
              htmlFor={toggleId}
              className={`font-medium text-brand-charcoal-dark cursor-pointer ${isLarge ? 'text-sm' : 'text-sm'}`}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-gray-400 mt-0.5">{description}</p>
          )}
        </div>
      )}

      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={[
          'relative shrink-0 rounded-full transition-colors duration-200',
          'outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/40 focus-visible:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isLarge ? 'w-14 h-7' : 'w-11 h-6',
          checked ? 'bg-brand-gold' : 'bg-gray-200',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 bg-white rounded-full shadow-sm transition-all duration-200',
            isLarge ? 'w-6 h-6' : 'w-5 h-5',
            checked
              ? isLarge ? 'left-7' : 'left-5.5 translate-x-0.5'
              : 'left-0.5',
          ].join(' ')}
        />
      </button>
    </div>
  );
}