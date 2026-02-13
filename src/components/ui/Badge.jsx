import { CheckCircle2, Clock, XCircle, Star, ShieldCheck, Award } from 'lucide-react';

/**
 * Verification + tier badges
 * variant: 'verified' | 'pending' | 'rejected' |
 *          'tier1' | 'tier2' | 'tier3' |
 *          'top_rated' | 'license' | 'tin'
 */
const BADGE_CONFIG = {
  verified:   { label: 'Verified',       icon: CheckCircle2, classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending:    { label: 'Pending',         icon: Clock,        classes: 'bg-amber-50 text-amber-700 border-amber-200'   },
  rejected:   { label: 'Rejected',        icon: XCircle,      classes: 'bg-red-50 text-red-600 border-red-200'         },
  tier1:      { label: 'Basic',           icon: null,         classes: 'bg-gray-100 text-gray-600 border-gray-200'     },
  tier2:      { label: 'Professional',    icon: ShieldCheck,  classes: 'bg-blue-50 text-blue-700 border-blue-200'      },
  tier3:      { label: 'Certified',       icon: Award,        classes: 'bg-brand-gold/15 text-brand-gold-dark border-brand-gold/30' },
  top_rated:  { label: 'Top Rated',       icon: Star,         classes: 'bg-amber-50 text-amber-700 border-amber-200'   },
  license:    { label: 'Licensed',        icon: CheckCircle2, classes: 'bg-purple-50 text-purple-700 border-purple-200'},
  tin:        { label: 'TIN Verified',    icon: CheckCircle2, classes: 'bg-teal-50 text-teal-700 border-teal-200'      },
  cac:        { label: 'CAC Verified',    icon: ShieldCheck,  classes: 'bg-indigo-50 text-indigo-700 border-indigo-200'},
  id_verified:{ label: 'ID Verified',     icon: CheckCircle2, classes: 'bg-emerald-50 text-emerald-700 border-emerald-200'},
};

export default function Badge({
  variant  = 'verified',
  label,
  size     = 'sm',
  showIcon = true,
  className = '',
}) {
  const config = BADGE_CONFIG[variant] || BADGE_CONFIG.verified;
  const Icon   = config.icon;
  const text   = label || config.label;
  const isLg   = size === 'lg';

  return (
    <span
      className={[
        'inline-flex items-center gap-1 font-semibold font-body border rounded-full',
        isLg ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]',
        config.classes,
        className,
      ].join(' ')}
      aria-label={text}
    >
      {showIcon && Icon && <Icon size={isLg ? 13 : 11} className="shrink-0" aria-hidden />}
      {text}
    </span>
  );
}

/**
 * Group of badges — for property cards or profile headers
 */
export function BadgeGroup({ badges = [], className = '' }) {
  if (!badges.length) return null;
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {badges.map((b, i) => (
        <Badge key={i} variant={b.variant} label={b.label} size={b.size} />
      ))}
    </div>
  );
}