import {
  Ban, Check, Clock, Users, Baby,
  Dog, PartyPopper, Cigarette,
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════
   HOUSE RULES — Displays property rules for accommodation
   Used in Property detail pages for shortlet/shared/stay
════════════════════════════════════════════════════════════ */

const RULE_ICONS = {
  smoking:    { icon: Cigarette,   yes: 'Smoking allowed',     no: 'No smoking' },
  pets:       { icon: Dog,         yes: 'Pets allowed',        no: 'No pets' },
  parties:    { icon: PartyPopper, yes: 'Parties allowed',     no: 'No parties/events' },
  children:   { icon: Baby,        yes: 'Children welcome',    no: 'Not suitable for children' },
};

export default function HouseRules({ rules }) {
  if (!rules) return null;

  const boolRules = Object.entries(RULE_ICONS)
    .filter(([key]) => rules[key] !== undefined)
    .map(([key, config]) => ({
      key,
      allowed: rules[key],
      label: rules[key] ? config.yes : config.no,
      Icon: config.icon,
    }));

  return (
    <div>
      <h2 className="mb-3 font-bold font-display text-brand-charcoal-dark dark:text-white">House Rules</h2>

      {/* Bool rules grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {boolRules.map(({ key, allowed, label, Icon }) => (
          <div
            key={key}
            className="flex items-center gap-2.5 p-3 rounded-xl bg-brand-gray-soft dark:bg-white/5"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              allowed ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10'
            }`}>
              {allowed
                ? <Check size={13} className="text-emerald-600" />
                : <Ban size={13} className="text-red-400" />
              }
            </div>
            <span className="text-xs font-medium text-brand-charcoal-dark dark:text-white">{label}</span>
          </div>
        ))}

        {/* Quiet hours */}
        {rules.quietHours && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-brand-gray-soft dark:bg-white/5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 bg-blue-50 dark:bg-blue-500/10">
              <Clock size={13} className="text-blue-500" />
            </div>
            <span className="text-xs font-medium text-brand-charcoal-dark dark:text-white">
              Quiet hours: {rules.quietHours}
            </span>
          </div>
        )}

        {/* Max guests */}
        {rules.maxGuests && (
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-brand-gray-soft dark:bg-white/5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0 bg-brand-gold/10">
              <Users size={13} className="text-brand-gold" />
            </div>
            <span className="text-xs font-medium text-brand-charcoal-dark dark:text-white">
              Max {rules.maxGuests} guests
            </span>
          </div>
        )}
      </div>

      {/* Custom rules */}
      {rules.custom?.length > 0 && (
        <div className="p-3 space-y-2 border border-gray-100 dark:border-white/10 rounded-xl">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Additional Rules</p>
          <ul className="space-y-1.5">
            {rules.custom.map((rule, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                <span className="mt-1 w-1 h-1 rounded-full bg-brand-gold shrink-0" />
                {rule}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
