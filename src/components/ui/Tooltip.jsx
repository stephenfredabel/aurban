import { useState, useRef } from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * "Why we need this" info tooltip
 * Shows on hover (desktop) and tap (mobile)
 * position: 'top' | 'bottom' | 'left' | 'right'
 */
export default function Tooltip({
  content,
  children,
  position  = 'top',
  maxWidth  = '220px',
  icon      = false,
}) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const show = () => {
    clearTimeout(timerRef.current);
    setVisible(true);
  };

  const hide = () => {
    timerRef.current = setTimeout(() => setVisible(false), 100);
  };

  const positionClasses = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top:    'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-brand-charcoal-dark',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-brand-charcoal-dark',
    left:   'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-brand-charcoal-dark',
    right:  'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-brand-charcoal-dark',
  };

  const trigger = icon ? (
    <button
      type="button"
      className="inline-flex items-center justify-center w-4 h-4 text-gray-400 transition-colors hover:text-brand-gold"
      aria-label="More information"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={() => setVisible((v) => !v)}
    >
      <HelpCircle size={14} />
    </button>
  ) : (
    <span
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={() => setVisible((v) => !v)}
    >
      {children}
    </span>
  );

  return (
    <span className="relative inline-flex items-center">
      {trigger}
      {visible && (
        <span
          role="tooltip"
          className={`absolute z-50 ${positionClasses[position]} animate-scale-in`}
          style={{ maxWidth }}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <span className="block px-3 py-2 text-xs leading-relaxed text-white bg-brand-charcoal-dark font-body rounded-xl shadow-modal">
            {content}
          </span>
          <span
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
          />
        </span>
      )}
    </span>
  );
}