import { Droplets, Zap, ShieldCheck, Route, Trash2 } from 'lucide-react';

/* ════════════════════════════════════════════════════════════
   NIGERIAN DECLARATIONS — Mandatory utility declarations
   Required for all accommodation listings in Nigeria.
   Water source, power source, security, road access, waste.
════════════════════════════════════════════════════════════ */

const DECLARATION_CONFIG = [
  { key: 'waterSource',   icon: Droplets,    label: 'Water Supply' },
  { key: 'powerSource',   icon: Zap,         label: 'Power Supply' },
  { key: 'security',      icon: ShieldCheck, label: 'Security' },
  { key: 'roadAccess',    icon: Route,       label: 'Road Access' },
  { key: 'wasteDisposal', icon: Trash2,      label: 'Waste Disposal' },
];

export default function NigerianDeclarations({ declarations }) {
  if (!declarations) return null;

  const items = DECLARATION_CONFIG.filter(c => declarations[c.key]);
  if (!items.length) return null;

  return (
    <div>
      <h2 className="mb-3 font-bold font-display text-brand-charcoal-dark dark:text-white">Utility & Infrastructure</h2>
      <div className="p-4 space-y-3 border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 rounded-2xl">
        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
          Mandatory Declarations
        </p>
        {items.map(({ key, icon: Icon, label }) => (
          <div key={key} className="flex items-start gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0 bg-white dark:bg-brand-charcoal-dark border border-amber-200 dark:border-amber-500/20">
              <Icon size={14} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-charcoal-dark dark:text-white">{label}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">{declarations[key]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
