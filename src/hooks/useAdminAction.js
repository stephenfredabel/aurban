import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { hasPermission, isCriticalAction, normalizeRole } from '../utils/rbac.js';
import { logAction } from '../services/audit.service.js';
import * as adminService from '../services/admin.service.js';

/**
 * useAdminAction — encapsulates the full admin action pipeline:
 *   VALIDATE → CONFIRM → EXECUTE → LOG → NOTIFY
 *
 * Returns { execute, confirmProps, loading, error }
 *
 * Usage:
 *   const { execute, confirmProps, loading } = useAdminAction({
 *     permission: 'users:suspend',
 *     action: AUDIT_ACTIONS.USER_SUSPEND,
 *     onExecute: async ({ reason }) => await suspendUser(userId, reason),
 *     targetId: userId,
 *     targetType: 'user',
 *   });
 *
 *   <button onClick={execute}>Suspend</button>
 *   <ConfirmAction {...confirmProps} />
 */
export default function useAdminAction({
  permission,
  action,           // AUDIT_ACTIONS value for logging
  onExecute,        // async function({ reason, password }) — the actual action
  onSuccess,        // optional callback after successful execution
  onError,          // optional callback on failure
  targetId,         // ID of entity being acted on
  targetType,       // 'user', 'listing', 'booking', etc.
  confirmTitle,     // Override ConfirmAction title
  confirmMessage,   // Override ConfirmAction message
  confirmLabel,     // Override confirm button label
  requireReason = false,
} = {}) {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);

  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  const critical = permission ? isCriticalAction(permission) : false;

  /**
   * Call this to initiate the action.
   * If a confirmation is needed (high/critical risk), it opens the modal.
   * The actual execution happens in handleConfirm.
   */
  const execute = useCallback(() => {
    // Permission check
    if (permission && !hasPermission(role, permission)) {
      setError('You do not have permission to perform this action.');
      onError?.('You do not have permission to perform this action.');
      return;
    }
    setError(null);
    setShowConfirm(true);
  }, [permission, role, onError]);

  /**
   * Called by ConfirmAction after user confirms (and re-enters password if critical).
   */
  const handleConfirm = useCallback(async ({ reason, password } = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Re-authenticate for critical actions
      if (critical && password) {
        const authRes = await adminService.reAuthenticate(password);
        if (!authRes.success) {
          setError(authRes.error || 'Re-authentication failed.');
          setLoading(false);
          return;
        }
      }

      // Execute the action
      const result = await onExecute?.({ reason, password });

      // Log to audit trail
      if (action) {
        logAction({
          action,
          targetId,
          targetType,
          details: reason || `Action: ${action}`,
          adminId:   user?.id,
          adminRole: role,
        }).catch(() => {}); // fire-and-forget
      }

      setShowConfirm(false);
      setLoading(false);
      onSuccess?.(result);
    } catch (err) {
      const msg = err?.message || 'Action failed.';
      setError(msg);
      setLoading(false);
      onError?.(msg);
    }
  }, [critical, onExecute, action, targetId, targetType, user, role, onSuccess, onError]);

  /**
   * Props to spread onto <ConfirmAction>.
   */
  const confirmProps = {
    isOpen:        showConfirm,
    onClose:       () => { setShowConfirm(false); setError(null); },
    onConfirm:     handleConfirm,
    permission,
    title:         confirmTitle,
    message:       confirmMessage,
    confirmLabel,
    requireReason,
    loading,
  };

  return {
    execute,
    confirmProps,
    loading,
    error,
    showConfirm,
  };
}
