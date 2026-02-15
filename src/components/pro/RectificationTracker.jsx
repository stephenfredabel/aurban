import { CheckCircle2, Circle, AlertCircle, Clock } from 'lucide-react';
import { PRO_RECTIFICATION_STATUSES, RECTIFICATION_CONFIG } from '../../data/proConstants.js';

/**
 * Timeline tracker for rectification progress.
 * reported → provider_notified → fix_scheduled → fix_in_progress →
 * fix_complete → mini_observation → resolved | escalated
 */

const RECTIFICATION_STEPS = [
  { status: 'reported', label: 'Issue Reported' },
  { status: 'provider_notified', label: 'Provider Notified' },
  { status: 'fix_scheduled', label: 'Fix Scheduled' },
  { status: 'fix_in_progress', label: 'Fix In Progress' },
  { status: 'fix_complete', label: 'Fix Complete' },
  { status: 'mini_observation', label: 'Mini-Observation (2 days)' },
  { status: 'resolved', label: 'Resolved' },
];

const STATUS_ORDER = Object.fromEntries(RECTIFICATION_STEPS.map((s, i) => [s.status, i]));

export default function RectificationTracker({ rectification }) {
  if (!rectification) return null;

  const currentIdx = STATUS_ORDER[rectification.status] ?? -1;
  const escalated = rectification.status === 'escalated';

  return (
    <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold text-brand-charcoal-dark dark:text-white">Rectification Progress</h4>
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
          PRO_RECTIFICATION_STATUSES[rectification.status]?.color || 'bg-gray-100 text-gray-600'
        }`}>
          {PRO_RECTIFICATION_STATUSES[rectification.status]?.label || rectification.status}
        </span>
      </div>

      {/* SLA countdown */}
      {!escalated && currentIdx < STATUS_ORDER.fix_complete && (
        <div className="flex items-center gap-2 p-2.5 mb-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl border border-amber-100 dark:border-amber-500/20">
          <Clock size={14} className="text-amber-600 shrink-0" />
          <p className="text-[11px] text-amber-700 dark:text-amber-300">
            Provider has <strong>{RECTIFICATION_CONFIG.fixDeadlineHours} hours</strong> to schedule a fix.
            Auto-escalates if unresolved.
          </p>
        </div>
      )}

      {/* Steps timeline */}
      <div className="relative pl-6">
        <div className="absolute left-[9px] top-1 bottom-1 w-0.5 bg-gray-200 dark:bg-white/10" />

        {RECTIFICATION_STEPS.map((step, i) => {
          const completed = i < currentIdx;
          const current = i === currentIdx;

          return (
            <div key={step.status} className="relative flex items-start gap-3 pb-4 last:pb-0">
              <div className="absolute -left-6">
                {completed ? (
                  <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-500/20" />
                ) : current ? (
                  <div className="flex items-center justify-center w-[18px] h-[18px] rounded-full border-2 border-brand-gold bg-brand-gold/10">
                    <div className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
                  </div>
                ) : (
                  <Circle size={18} className="text-gray-300 dark:text-white/20" />
                )}
              </div>
              <p className={`text-xs font-semibold ${
                completed ? 'text-brand-charcoal-dark dark:text-white' :
                current ? 'text-brand-gold' :
                'text-gray-400 dark:text-white/30'
              }`}>
                {step.label}
              </p>
            </div>
          );
        })}

        {/* Escalated branch */}
        {escalated && (
          <div className="relative flex items-start gap-3 pb-0">
            <div className="absolute -left-6">
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-600">Escalated to Aurban Support</p>
              <p className="text-[10px] text-gray-400 mt-0.5">An admin will review and make a ruling</p>
            </div>
          </div>
        )}
      </div>

      {/* Category & description */}
      {rectification.category && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Category</span>
            <span className="font-semibold text-brand-charcoal-dark dark:text-white">{rectification.category}</span>
          </div>
          {rectification.description && (
            <p className="text-xs text-gray-500 mt-2">{rectification.description}</p>
          )}
        </div>
      )}
    </div>
  );
}
