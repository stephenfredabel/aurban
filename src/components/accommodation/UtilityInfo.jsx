import { CheckCircle2, SplitSquareHorizontal, Info } from 'lucide-react';

/* ════════════════════════════════════════════════════════════
   UTILITY INFO — Shows included vs split utilities
   For shared accommodation listings
════════════════════════════════════════════════════════════ */

export default function UtilityInfo({ utilityInfo }) {
  if (!utilityInfo) return null;

  const { included = [], split = [], splitMethod } = utilityInfo;
  if (!included.length && !split.length) return null;

  return (
    <div>
      <h2 className="mb-3 font-bold font-display text-brand-charcoal-dark dark:text-white">Utilities</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Included */}
        {included.length > 0 && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider mb-2">
              Included in Rent
            </p>
            <ul className="space-y-1.5">
              {included.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={11} className="shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Split */}
        {split.length > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
            <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider mb-2">
              Split Among Tenants
            </p>
            <ul className="space-y-1.5">
              {split.map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                  <SplitSquareHorizontal size={11} className="shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {splitMethod && (
        <div className="flex items-start gap-2 mt-2 p-2.5 bg-gray-50 dark:bg-white/5 rounded-xl">
          <Info size={12} className="text-gray-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-gray-500 dark:text-gray-400">{splitMethod}</p>
        </div>
      )}
    </div>
  );
}
