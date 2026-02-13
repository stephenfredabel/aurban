/**
 * Step progress indicator
 * Used in onboarding shell and profile completeness meter
 */
export default function ProgressBar({
  value       = 0,    // 0–100
  steps,              // optional: array of step labels
  currentStep = 0,
  showLabel   = true,
  showSteps   = false,
  size        = 'sm', // 'xs' | 'sm' | 'md'
  color       = 'gold',
  animated    = true,
  className   = '',
}) {
  const clamped = Math.min(100, Math.max(0, value));

  const trackHeight = { xs: 'h-1', sm: 'h-1.5', md: 'h-2.5' }[size] || 'h-1.5';
  const fillColor   = color === 'gold' ? 'bg-brand-gold' : 'bg-brand-charcoal';

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-brand-charcoal-dark">
            {steps ? `Step ${currentStep + 1} of ${steps.length}` : `${Math.round(clamped)}% complete`}
          </span>
          {steps && (
            <span className="text-xs text-gray-400">
              {steps[currentStep] || ''}
            </span>
          )}
        </div>
      )}

      <div className={`w-full progress-track ${trackHeight}`}>
        <div
          className={`${fillColor} h-full rounded-full ${animated ? 'transition-all duration-500 ease-out' : ''}`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={Math.round(clamped)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress: ${Math.round(clamped)}%`}
        />
      </div>

      {showSteps && steps && (
        <div className="flex justify-between mt-2">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`flex flex-col items-center gap-1 ${i > 0 && i < steps.length - 1 ? 'flex-1' : ''}`}
            >
              <div
                className={[
                  'w-2 h-2 rounded-full transition-colors duration-300',
                  i < currentStep
                    ? 'bg-brand-gold'
                    : i === currentStep
                      ? 'bg-brand-charcoal-dark ring-2 ring-brand-charcoal/20'
                      : 'bg-gray-200',
                ].join(' ')}
              />
              <span
                className={`hidden md:block text-[10px] font-medium ${
                  i <= currentStep ? 'text-brand-charcoal-dark' : 'text-gray-400'
                }`}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Profile completeness ring (circular variant)
 */
export function CompletenessRing({ value = 0, size = 60 }) {
  const clamped    = Math.min(100, Math.max(0, value));
  const radius     = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F0F0F0" strokeWidth={6} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="#EFB50B"
          strokeWidth={6}
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <span className="absolute text-xs font-bold text-brand-charcoal-dark">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}