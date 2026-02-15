import { useState } from 'react';
import { FileText, Plus, Loader2, Shield, X } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency.js';

/**
 * Add-on scope change invoice — provider requests extra work
 * beyond the original scope. Client must approve before payment.
 */
export default function ScopeChangeInvoice({ booking, onSubmit, onApprove, onReject, invoice }) {
  const { symbol } = useCurrency();

  // Provider creates a new invoice
  if (!invoice) {
    return <ScopeChangeForm booking={booking} onSubmit={onSubmit} symbol={symbol} />;
  }

  // Client reviews existing invoice
  return (
    <div className="p-4 border border-amber-200 dark:border-amber-500/20 rounded-2xl bg-amber-50/50 dark:bg-amber-500/5">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={16} className="text-amber-600" />
        <h4 className="text-sm font-bold text-brand-charcoal-dark dark:text-white">Scope Change Request</h4>
        <span className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full ${
          invoice.status === 'pending' ? 'bg-amber-100 text-amber-700' :
          invoice.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
          'bg-red-100 text-red-700'
        }`}>
          {invoice.status === 'pending' ? 'Awaiting Approval' : invoice.status}
        </span>
      </div>

      <p className="mb-3 text-xs text-gray-600 dark:text-white/70">{invoice.description}</p>

      <div className="flex justify-between items-center p-3 mb-3 bg-white dark:bg-white/5 rounded-xl">
        <span className="text-xs text-gray-500">Additional Cost</span>
        <span className="text-sm font-bold text-brand-gold">{symbol}{invoice.amount?.toLocaleString()}</span>
      </div>

      {invoice.status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={() => onReject?.(invoice.id)}
            className="flex-1 px-4 py-2.5 text-xs font-bold border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white"
          >
            Decline
          </button>
          <button
            onClick={() => onApprove?.(invoice.id)}
            className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-brand-gold rounded-xl hover:bg-brand-gold-dark"
          >
            Approve & Pay
          </button>
        </div>
      )}

      <p className="mt-2 text-center text-[10px] text-gray-400 flex items-center justify-center gap-1">
        <Shield size={9} className="text-brand-gold" />
        Additional payment held in escrow
      </p>
    </div>
  );
}

function ScopeChangeForm({ booking, onSubmit, symbol }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!description.trim()) { setError('Describe the additional work'); return; }
    if (!amount || Number(amount) <= 0) { setError('Enter a valid amount'); return; }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit?.({
        bookingId: booking.id,
        description: description.trim(),
        amount: Number(amount),
      });
    } catch { setError('Failed to submit'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
      <div className="flex items-center gap-2 mb-3">
        <Plus size={16} className="text-brand-gold" />
        <h4 className="text-sm font-bold text-brand-charcoal-dark dark:text-white">Request Scope Change</h4>
      </div>

      <p className="mb-4 text-xs text-gray-400">
        For work beyond the original scope. The client must approve before you proceed.
      </p>

      <div className="space-y-3">
        <div>
          <label className="mb-1 text-xs font-semibold text-gray-500 block">Additional Work Description</label>
          <textarea
            value={description}
            onChange={e => { setDescription(e.target.value); setError(''); }}
            placeholder="Describe the extra work needed..."
            rows={3}
            className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none resize-none"
          />
        </div>
        <div>
          <label className="mb-1 text-xs font-semibold text-gray-500 block">Additional Cost ({symbol})</label>
          <input
            type="number"
            value={amount}
            onChange={e => { setAmount(e.target.value); setError(''); }}
            placeholder="0"
            min="0"
            className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold outline-none"
          />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-bold text-white bg-brand-gold rounded-xl hover:bg-brand-gold-dark disabled:opacity-50"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          Send to Client for Approval
        </button>
      </div>
    </div>
  );
}
