import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { isAdminRole } from '../utils/rbac.js';

/* ════════════════════════════════════════════════════════════
   USE VERIFICATION GATE — Guards major provider actions

   Returns:
   • isVerified     — true if provider is fully verified
   • canPerform     — function that returns true if the action is allowed
   • gateMessage    — user-friendly message explaining why action is blocked
   • statusLabel    — human-readable verification status label

   Major actions (gated):
   • Create/edit listings
   • Accept bookings
   • Access payouts
   • Create pro listings
   • Accept pro bookings

   Basic actions (always allowed):
   • View overview / dashboard (read-only)
   • View/edit profile
   • View/edit settings
   • Messages
   • View analytics (read-only)
════════════════════════════════════════════════════════════ */

// Actions that require full verification
const GATED_ACTIONS = new Set([
  'create_listing',
  'edit_listing',
  'delete_listing',
  'toggle_listing',
  'accept_booking',
  'access_payouts',
  'create_pro_listing',
  'accept_pro_booking',
  'withdraw_funds',
  'create_store',
]);

// Human-readable messages per verification status
const STATUS_MESSAGES = {
  unverified:     'Complete your profile verification to unlock this feature.',
  pending:        'Your verification is under review. This feature will be available once approved.',
  rejected:       'Your verification was declined. Please update your documents in Settings to regain access.',
  docs_requested: 'Additional documents were requested. Please upload them in Settings to unlock this feature.',
};

const STATUS_LABELS = {
  unverified:     'Not Verified',
  pending:        'Pending Review',
  approved:       'Verified',
  rejected:       'Verification Declined',
  docs_requested: 'Documents Requested',
};

export default function useVerificationGate() {
  const { user, isProvider, isAdmin } = useAuth();

  const status = user?.verificationStatus || 'unverified';
  const isVerified = user?.verified || status === 'approved';

  // Admins always have full access
  const adminOverride = isAdmin || isAdminRole(user?.role);

  const canPerform = useCallback((action) => {
    // Admins bypass all gates
    if (adminOverride) return true;
    // Non-providers: not relevant, allow
    if (!isProvider) return true;
    // Verified providers: allow everything
    if (isVerified) return true;
    // Unverified providers: block gated actions
    return !GATED_ACTIONS.has(action);
  }, [adminOverride, isProvider, isVerified]);

  const gateMessage = isVerified ? '' : (STATUS_MESSAGES[status] || STATUS_MESSAGES.unverified);
  const statusLabel = STATUS_LABELS[status] || STATUS_LABELS.unverified;

  return {
    isVerified: adminOverride || isVerified,
    verificationStatus: status,
    canPerform,
    gateMessage,
    statusLabel,
    isProvider,
  };
}
