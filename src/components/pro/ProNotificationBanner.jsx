import { useState } from 'react';
import { X, AlertTriangle, Info, CheckCircle, Bell } from 'lucide-react';

/**
 * ProNotificationBanner — Dismissible alert banner for Pro bookings.
 * Used for: observation window reminders, milestone releases,
 * rectification updates, SOS alerts, etc.
 *
 * @param {'info'|'warning'|'success'|'alert'} variant
 * @param {string} title
 * @param {string} message
 * @param {function} onAction — optional CTA callback
 * @param {string} actionLabel — optional CTA text
 * @param {boolean} dismissible — allow hiding (default true)
 */

const VARIANTS = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
    icon: Info,
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-800 dark:text-blue-300',
    textColor: 'text-blue-600 dark:text-blue-400',
    btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-800 dark:text-amber-300',
    textColor: 'text-amber-600 dark:text-amber-400',
    btnColor: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
    icon: CheckCircle,
    iconColor: 'text-emerald-500',
    titleColor: 'text-emerald-800 dark:text-emerald-300',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  alert: {
    bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
    icon: Bell,
    iconColor: 'text-red-500',
    titleColor: 'text-red-800 dark:text-red-300',
    textColor: 'text-red-600 dark:text-red-400',
    btnColor: 'bg-red-600 hover:bg-red-700 text-white',
  },
};

export default function ProNotificationBanner({
  variant = 'info',
  title,
  message,
  onAction,
  actionLabel,
  dismissible = true,
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const v = VARIANTS[variant] || VARIANTS.info;
  const Icon = v.icon;

  return (
    <div className={`flex items-start gap-3 p-4 border rounded-2xl ${v.bg}`}>
      <Icon size={18} className={`${v.iconColor} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        {title && <p className={`text-sm font-semibold ${v.titleColor}`}>{title}</p>}
        {message && <p className={`text-xs leading-relaxed mt-0.5 ${v.textColor}`}>{message}</p>}
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className={`mt-2 px-3 py-1.5 text-xs font-bold rounded-lg ${v.btnColor}`}
          >
            {actionLabel}
          </button>
        )}
      </div>
      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg text-gray-400 hover:bg-white/50 dark:hover:bg-white/10 shrink-0"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
