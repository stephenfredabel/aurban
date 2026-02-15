import { useState } from 'react';
import { Calendar, Clock, FileText, Loader2, Wrench, XCircle } from 'lucide-react';
import { RECTIFICATION_CONFIG } from '../../data/proConstants.js';

/**
 * Provider response to a rectification request.
 * Accept & schedule fix, or dispute with explanation.
 */
export default function ProviderFixResponse({ rectification, onAccept, onDispute }) {
  const [mode, setMode] = useState(null); // null | 'accept' | 'dispute'
  const [fixDate, setFixDate] = useState('');
  const [fixNotes, setFixNotes] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];
  const maxDate = new Date(Date.now() + RECTIFICATION_CONFIG.fixDeadlineHours * 3_600_000).toISOString().split('T')[0];

  async function handleAccept() {
    if (!fixDate) { setError('Select a fix date'); return; }
    if (!fixNotes.trim()) { setError('Add notes about how you\'ll fix it'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onAccept?.({
        rectificationId: rectification.id,
        fixDate,
        fixNotes: fixNotes.trim(),
      });
    } catch { setError('Failed to submit'); }
    finally { setSubmitting(false); }
  }

  async function handleDispute() {
    if (!disputeReason.trim() || disputeReason.trim().length < 20) {
      setError('Provide a detailed explanation (min 20 characters)');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onDispute?.({
        rectificationId: rectification.id,
        reason: disputeReason.trim(),
      });
    } catch { setError('Failed to submit'); }
    finally { setSubmitting(false); }
  }

  if (!mode) {
    return (
      <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
        <h4 className="mb-2 text-sm font-bold text-brand-charcoal-dark dark:text-white">Client Reported an Issue</h4>
        <p className="mb-4 text-xs text-gray-400">
          You have {RECTIFICATION_CONFIG.providerResponseHours} hours to respond.
          You can accept and schedule a fix, or dispute the claim.
        </p>

        {rectification?.description && (
          <div className="p-3 mb-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
            <p className="text-xs text-gray-600 dark:text-white/70">{rectification.description}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setMode('accept')}
            className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
          >
            <Wrench size={14} /> Accept & Fix
          </button>
          <button
            onClick={() => setMode('dispute')}
            className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 text-xs font-bold border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:border-red-400"
          >
            <XCircle size={14} /> Dispute
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
          {mode === 'accept' ? 'Schedule Fix' : 'Dispute Claim'}
        </h4>
        <button onClick={() => { setMode(null); setError(''); }} className="text-xs text-gray-400 hover:text-brand-gold">
          Back
        </button>
      </div>

      {mode === 'accept' ? (
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <Calendar size={12} /> Fix Date
            </label>
            <input
              type="date"
              value={fixDate}
              onChange={e => { setFixDate(e.target.value); setError(''); }}
              min={minDate}
              max={maxDate}
              className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <FileText size={12} /> How will you fix it?
            </label>
            <textarea
              value={fixNotes}
              onChange={e => { setFixNotes(e.target.value); setError(''); }}
              placeholder="Describe what you'll do to resolve the issue..."
              rows={3}
              className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={handleAccept}
            disabled={submitting}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />}
            Confirm Fix Schedule
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <FileText size={12} /> Why are you disputing?
            </label>
            <textarea
              value={disputeReason}
              onChange={e => { setDisputeReason(e.target.value); setError(''); }}
              placeholder="Explain why you believe the issue report is incorrect or unreasonable..."
              rows={4}
              className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={handleDispute}
            disabled={submitting}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            Submit Dispute
          </button>
          <p className="text-[10px] text-gray-400 text-center">
            Disputes are reviewed by Aurban support within {RECTIFICATION_CONFIG.autoEscalateAfterHours} hours
          </p>
        </div>
      )}
    </div>
  );
}
