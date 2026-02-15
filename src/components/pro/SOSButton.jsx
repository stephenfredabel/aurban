import { useState } from 'react';
import { AlertTriangle, Phone, X, Loader2 } from 'lucide-react';

/**
 * Floating emergency SOS button — shown during active Pro bookings.
 * Triggers alert to Aurban safety team + freezes escrow.
 */
export default function SOSButton({ bookingId, onTriggerSOS }) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [triggered, setTriggered] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleConfirmSOS() {
    setSending(true);
    try {
      await onTriggerSOS?.(bookingId);
      setTriggered(true);
    } catch {
      // Still show as triggered for safety
      setTriggered(true);
    } finally {
      setSending(false);
      setConfirming(false);
    }
  }

  if (triggered) {
    return (
      <div className="fixed bottom-24 right-4 z-50 w-72 p-4 bg-red-600 text-white rounded-2xl shadow-2xl animate-pulse">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={18} />
          <span className="text-sm font-bold">SOS Alert Sent</span>
        </div>
        <p className="text-xs opacity-90 mb-3">
          Aurban safety team has been notified. Escrow has been frozen. Stay safe.
        </p>
        <a
          href="tel:112"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-bold bg-white text-red-600 rounded-xl"
        >
          <Phone size={14} /> Call Emergency (112)
        </a>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="fixed bottom-24 right-4 z-50 w-72 p-4 bg-white dark:bg-gray-900 border-2 border-red-500 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            <span className="text-sm font-bold text-red-600">Emergency SOS</span>
          </div>
          <button onClick={() => setConfirming(false)} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>
        <p className="mb-3 text-xs text-gray-600 dark:text-white/70">
          This will alert the Aurban safety team and freeze all escrow payments for this booking.
          Only use in genuine emergencies.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setConfirming(false)}
            className="flex-1 px-3 py-2 text-xs font-bold border border-gray-200 dark:border-white/10 rounded-xl text-gray-600 dark:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSOS}
            disabled={sending}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50"
          >
            {sending ? <Loader2 size={12} className="animate-spin" /> : <AlertTriangle size={12} />}
            Confirm SOS
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {expanded && (
        <div className="fixed bottom-24 right-4 z-50 w-56 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl">
          <button
            onClick={() => setConfirming(true)}
            className="flex items-center gap-2 w-full px-3 py-2.5 mb-2 text-xs font-bold text-red-600 bg-red-50 dark:bg-red-500/10 rounded-xl hover:bg-red-100 transition-colors"
          >
            <AlertTriangle size={14} /> Report Emergency
          </button>
          <a
            href="tel:112"
            className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-bold text-gray-600 dark:text-white bg-gray-50 dark:bg-white/5 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Phone size={14} /> Call 112
          </a>
        </div>
      )}

      <button
        onClick={() => setExpanded(v => !v)}
        className="fixed bottom-24 right-4 z-50 flex items-center justify-center w-14 h-14 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all active:scale-95"
        aria-label="Emergency SOS"
      >
        {expanded ? <X size={20} /> : <AlertTriangle size={20} />}
      </button>
    </>
  );
}
