import { useTranslation } from 'react-i18next';
import Tooltip             from '../ui/Tooltip.jsx';

/**
 * Wraps each onboarding step with:
 * - Consistent title + subtitle layout
 * - "Why we need this" tooltip
 * - Optional skip link
 * - Estimated time badge
 */
export default function StepWrapper({
  title,
  subtitle,
  tooltip,
  onSkip,
  skipLabel,
  required = false,
  children,
  footer,
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div>
        <div className="flex items-start gap-2 mb-2">
          <h1 className="flex-1 text-2xl font-extrabold leading-tight font-display text-brand-charcoal-dark">
            {title}
          </h1>
          {tooltip && (
            <Tooltip content={tooltip} position="bottom" icon maxWidth="240px" />
          )}
        </div>

        {subtitle && (
          <p className="text-sm leading-relaxed text-gray-500 font-body">
            {subtitle}
          </p>
        )}

        {/* Skip link */}
        {onSkip && !required && (
          <button
            type="button"
            onClick={onSkip}
            className="mt-2 text-xs text-gray-400 underline transition-colors hover:text-brand-charcoal underline-offset-2 font-body"
          >
            {skipLabel || t('common.skip')}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-4">
        {children}
      </div>

      {/* Custom footer slot */}
      {footer && (
        <div className="mt-2">
          {footer}
        </div>
      )}
    </div>
  );
}