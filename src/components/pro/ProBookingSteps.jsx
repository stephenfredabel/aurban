import { Check } from 'lucide-react';

/**
 * Step indicator for the Pro booking wizard.
 * Horizontal on desktop, compact on mobile.
 */
export default function ProBookingSteps({ steps, currentStep }) {
  return (
    <div className="flex items-center justify-center gap-1 px-4 py-3">
      {steps.map((label, i) => {
        const isCompleted = i < currentStep;
        const isCurrent = i === currentStep;

        return (
          <div key={i} className="flex items-center gap-1">
            {/* Step circle */}
            <div className={[
              'flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold transition-all shrink-0',
              isCompleted ? 'bg-brand-gold text-white' :
              isCurrent   ? 'bg-brand-gold/15 text-brand-gold border-2 border-brand-gold' :
                            'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30',
            ].join(' ')}>
              {isCompleted ? <Check size={12} /> : i + 1}
            </div>

            {/* Label (hidden on small screens for non-current) */}
            <span className={[
              'text-[10px] font-semibold whitespace-nowrap transition-colors',
              isCurrent ? 'text-brand-charcoal-dark dark:text-white' : 'text-gray-400 hidden sm:inline',
            ].join(' ')}>
              {label}
            </span>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className={[
                'w-4 sm:w-8 h-0.5 rounded-full mx-1',
                isCompleted ? 'bg-brand-gold' : 'bg-gray-200 dark:bg-white/10',
              ].join(' ')} />
            )}
          </div>
        );
      })}
    </div>
  );
}
