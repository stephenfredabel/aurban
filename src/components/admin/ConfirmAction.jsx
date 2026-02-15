import { useState } from 'react';
import { AlertTriangle, ShieldAlert, Lock } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import { isCriticalAction, getRiskLevel } from '../../utils/rbac.js';

/**
 * ConfirmAction — two-tier confirmation modal.
 *
 * Normal actions:  "Are you sure?" + optional reason textarea
 * Critical actions: Above + password re-entry field
 *
 * Auto-detects tier via isCriticalAction(permission).
 *
 * Usage:
 *   <ConfirmAction
 *     isOpen={showConfirm}
 *     onClose={() => setShowConfirm(false)}
 *     onConfirm={({ reason, password }) => handleAction(reason, password)}
 *     permission="users:ban_permanent"
 *     title="Ban User Permanently"
 *     message="This will permanently ban the user from the platform."
 *     requireReason
 *   />
 */
export default function ConfirmAction({
  isOpen,
  onClose,
  onConfirm,
  permission,
  title        = 'Confirm Action',
  message      = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  requireReason = false,
  loading      = false,
}) {
  const [reason, setReason]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  const critical = permission ? isCriticalAction(permission) : false;
  const risk     = permission ? getRiskLevel(permission) : 'low';

  const riskStyles = {
    low:      { border: 'border-gray-200', icon: AlertTriangle, iconColor: 'text-gray-400', btnClass: 'bg-gray-600 hover:bg-gray-700' },
    medium:   { border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500', btnClass: 'bg-amber-600 hover:bg-amber-700' },
    high:     { border: 'border-orange-200', icon: ShieldAlert, iconColor: 'text-orange-500', btnClass: 'bg-orange-600 hover:bg-orange-700' },
    critical: { border: 'border-red-200', icon: ShieldAlert, iconColor: 'text-red-500', btnClass: 'bg-red-600 hover:bg-red-700' },
  };

  const style = riskStyles[risk] || riskStyles.low;
  const Icon  = style.icon;

  const handleConfirm = () => {
    setError('');

    if (requireReason && !reason.trim()) {
      setError('Please provide a reason.');
      return;
    }

    if (critical && !password.trim()) {
      setError('Password is required for this action.');
      return;
    }

    onConfirm?.({
      reason: reason.trim(),
      password: critical ? password.trim() : undefined,
    });
  };

  const handleClose = () => {
    setReason('');
    setPassword('');
    setError('');
    onClose?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="sm">
      <div className="space-y-4">
        {/* Risk indicator */}
        <div className={`flex items-start gap-3 p-3 rounded-xl border ${style.border} bg-white dark:bg-gray-900`}>
          <Icon size={20} className={`${style.iconColor} mt-0.5 shrink-0`} />
          <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
        </div>

        {/* Reason textarea */}
        {requireReason && (
          <div>
            <label className="block mb-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Reason {!critical && <span className="normal-case text-gray-400">(required)</span>}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-white/10 rounded-xl
                bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
                focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none resize-none"
              placeholder="Enter reason for this action..."
            />
          </div>
        )}

        {/* Password re-entry (critical actions only) */}
        {critical && (
          <div>
            <label className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-red-500 uppercase tracking-wider">
              <Lock size={12} />
              Re-enter Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-red-200 dark:border-red-500/30 rounded-xl
                bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200
                focus:ring-2 focus:ring-red-300/30 focus:border-red-400 outline-none"
              placeholder="Your password"
              autoComplete="current-password"
            />
            <p className="mt-1 text-[10px] text-red-400">
              This action is critical and requires identity verification.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs font-medium text-red-500">{error}</p>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-500 rounded-xl hover:bg-gray-100
              dark:text-gray-400 dark:hover:bg-white/5 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed ${style.btnClass}`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
