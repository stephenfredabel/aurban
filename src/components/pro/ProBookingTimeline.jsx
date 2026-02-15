import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { PRO_BOOKING_STEP_LABELS, PRO_BOOKING_STATUSES } from '../../data/proConstants.js';

/**
 * Visual booking lifecycle timeline — shows all 10 status steps
 * with completed/current/upcoming indicators.
 * Also handles branch statuses (cancelled, rectification, etc.)
 */
export default function ProBookingTimeline({ booking }) {
  if (!booking) return null;

  const currentStep = PRO_BOOKING_STATUSES[booking.status]?.step ?? -1;
  const isBranch = currentStep === -1; // cancelled, no_show, disputed, rectification

  const timeline = booking.timeline || [];

  return (
    <div className="space-y-1">
      <h4 className="mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Booking Timeline</h4>

      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-1 bottom-1 w-0.5 bg-gray-200 dark:bg-white/10" />

        {PRO_BOOKING_STEP_LABELS.map((label, i) => {
          const completed = i < currentStep;
          const current = i === currentStep;
          const timelineEntry = timeline.find(t =>
            PRO_BOOKING_STATUSES[t.status]?.step === i
          );
          const timestamp = timelineEntry?.at;

          return (
            <div key={i} className="relative flex items-start gap-3 pb-4 last:pb-0">
              {/* Dot */}
              <div className="absolute -left-6">
                {completed ? (
                  <CheckCircle2 size={18} className="text-brand-gold fill-brand-gold/20" />
                ) : current ? (
                  <div className="flex items-center justify-center w-[18px] h-[18px] rounded-full border-2 border-brand-gold bg-brand-gold/10">
                    <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                  </div>
                ) : (
                  <Circle size={18} className="text-gray-300 dark:text-white/20" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${
                  completed ? 'text-brand-charcoal-dark dark:text-white' :
                  current ? 'text-brand-gold' :
                  'text-gray-400 dark:text-white/30'
                }`}>
                  {label}
                </p>
                {timestamp && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {new Date(timestamp).toLocaleDateString('en-NG', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                )}
                {timelineEntry?.note && (
                  <p className="text-[10px] text-gray-400 italic mt-0.5">{timelineEntry.note}</p>
                )}
              </div>
            </div>
          );
        })}

        {/* Branch status (if applicable) */}
        {isBranch && (
          <div className="relative flex items-start gap-3 pb-0">
            <div className="absolute -left-6">
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-600">
                {PRO_BOOKING_STATUSES[booking.status]?.label || booking.status}
              </p>
              {timeline[timeline.length - 1]?.note && (
                <p className="text-[10px] text-gray-400 italic mt-0.5">
                  {timeline[timeline.length - 1].note}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
