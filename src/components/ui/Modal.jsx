import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Accessible modal — full screen on mobile, centered on desktop
 * Also works as a bottom sheet on mobile when sheet={true}
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size      = 'md',
  sheet     = false,  // bottom sheet on mobile
  hideClose = false,
  footer,
}) {
  const overlayRef  = useRef(null);
  const contentRef  = useRef(null);

  // Trap focus + close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'Tab') {
        const focusable = contentRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm:   'max-w-sm',
    md:   'max-w-lg',
    lg:   'max-w-2xl',
    xl:   'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />

      {/* Content */}
      <div
        ref={contentRef}
        className={[
          'relative z-10 bg-white shadow-modal flex flex-col',
          'w-full',
          sheet
            ? 'rounded-t-3xl md:rounded-2xl animate-slide-up md:animate-scale-in'
            : 'rounded-2xl animate-scale-in',
          sheet ? '' : `${sizeClasses[size] || sizeClasses.md} mx-4`,
          'max-h-[90vh]',
        ].join(' ')}
      >
        {/* Drag handle (sheet only) */}
        {sheet && (
          <div className="flex justify-center pt-3 pb-1 md:hidden">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>
        )}

        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
            {title && (
              <h2 className="text-lg font-bold leading-tight font-display text-brand-charcoal-dark">
                {title}
              </h2>
            )}
            {!hideClose && (
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 ml-auto text-gray-400 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 px-5 py-5 overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-4 border-t border-gray-100 shrink-0 pb-safe">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}