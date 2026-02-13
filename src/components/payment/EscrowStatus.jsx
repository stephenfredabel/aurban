import { useState, useCallback } from 'react';
import {
  ShieldCheck, Clock, CheckCircle2, AlertTriangle,
  XCircle, ChevronDown, ChevronUp, MessageSquare,
  Flag, ArrowRight, Lock,
} from 'lucide-react';
import { format, formatDistanceToNow, addHours } from 'date-fns';
import { useCurrency } from '../../hooks/useCurrency.js';

// ─────────────────────────────────────────────────────────────
// STATUS CONFIG
// ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label:     'Payment Held in Escrow',
    sub:       'Waiting for service completion',
    icon:      Lock,
    color:     'text-amber-500',
    bg:        'bg-amber-50 dark:bg-amber-500/10',
    border:    'border-amber-200 dark:border-amber-500/20',
    dotColor:  'bg-amber-400',
  },
  in_progress: {
    label:     'Service In Progress',
    sub:       'Provider is actively working',
    icon:      Clock,
    color:     'text-blue-500',
    bg:        'bg-blue-50 dark:bg-blue-500/10',
    border:    'border-blue-200 dark:border-blue-500/20',
    dotColor:  'bg-blue-400',
  },
  awaiting_confirmation: {
    label:     'Awaiting Your Confirmation',
    sub:       'Provider has marked the job complete',
    icon:      CheckCircle2,
    color:     'text-brand-gold',
    bg:        'bg-brand-gold/5 dark:bg-brand-gold/10',
    border:    'border-brand-gold/20',
    dotColor:  'bg-brand-gold',
    urgent:    true,
  },
  released: {
    label:     'Payment Released',
    sub:       'Funds sent to provider',
    icon:      CheckCircle2,
    color:     'text-emerald-500',
    bg:        'bg-emerald-50 dark:bg-emerald-500/10',
    border:    'border-emerald-200 dark:border-emerald-500/20',
    dotColor:  'bg-emerald-400',
  },
  disputed: {
    label:     'Under Dispute',
    sub:       'Aurban support is reviewing',
    icon:      AlertTriangle,
    color:     'text-red-500',
    bg:        'bg-red-50 dark:bg-red-500/10',
    border:    'border-red-200 dark:border-red-500/20',
    dotColor:  'bg-red-400',
  },
  refunded: {
    label:     'Refunded',
    sub:       'Payment returned to you',
    icon:      XCircle,
    color:     'text-gray-500',
    bg:        'bg-gray-50 dark:bg-white/5',
    border:    'border-gray-200 dark:border-white/10',
    dotColor:  'bg-gray-400',
  },
};

// ─────────────────────────────────────────────────────────────
// TIMELINE STEP
// ─────────────────────────────────────────────────────────────

function TimelineStep({ label, sub, done, active, last }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={[
          'w-7 h-7 rounded-full flex items-center justify-center border-2 shrink-0 transition-all',
          done   ? 'bg-emerald-500 border-emerald-500'
          : active ? 'bg-white dark:bg-brand-charcoal-dark border-brand-gold'
          : 'bg-white dark:bg-brand-charcoal-dark border-gray-200 dark:border-white/20',
        ].join(' ')}>
          {done
            ? <CheckCircle2 size={14} className="text-white" />
            : active
            ? <div className="w-2.5 h-2.5 rounded-full bg-brand-gold animate-pulse" />
            : <div className="w-2 h-2 bg-gray-300 rounded-full dark:bg-white/20" />
          }
        </div>
        {!last && <div className={`flex-1 w-0.5 my-1 ${done ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-white/10'}`} style={{ minHeight: '20px' }} />}
      </div>
      <div className="pb-5">
        <p className={`text-sm font-bold ${done || active ? 'text-brand-charcoal-dark dark:text-white' : 'text-gray-400 dark:text-white/30'}`}>{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DISPUTE WINDOW COUNTDOWN
// ─────────────────────────────────────────────────────────────

function DisputeCountdown({ confirmedAt }) {
  const deadline    = addHours(new Date(confirmedAt), 48);
  const isExpired   = new Date() > deadline;
  const timeLeft    = isExpired ? null : formatDistanceToNow(deadline, { addSuffix: false });

  if (isExpired) return null;

  return (
    <div className="flex items-center gap-2 p-3 border bg-amber-50 dark:bg-amber-500/10 rounded-xl border-amber-200 dark:border-amber-500/20">
      <Clock size={13} className="text-amber-500 shrink-0" />
      <p className="flex-1 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
        <strong>Dispute window closes in {timeLeft}</strong> — after this, payment is permanently released.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

/**
 * EscrowStatus
 * Props:
 *   transaction: {
 *     id, amount, status, paymentType,
 *     provider: { name },
 *     listing:  { title },
 *     createdAt, confirmedAt?, releasedAt?,
 *     txRef
 *   }
 *   onConfirmRelease: () => void
 *   onOpenDispute: () => void
 *   onMessage: () => void
 *   compact: boolean — shows only the status pill
 */
export default function EscrowStatus({
  transaction,
  onConfirmRelease,
  onOpenDispute,
  onMessage,
  compact = false,
}) {
  const { symbol }      = useCurrency();
  const [expanded, setExpanded] = useState(!compact);
  const [confirming,   setConfirming]   = useState(false);
  const [confirmed,    setConfirmed]    = useState(false);
  const [showDispute,  setShowDispute]  = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const tx = transaction || {
    id:          'tx_001',
    amount:      1200000,
    status:      'awaiting_confirmation',
    paymentType: 'rental',
    provider:    { name: 'Chukwuemeka Eze' },
    listing:     { title: '3-Bedroom Flat, Lekki Phase 1' },
    createdAt:   Date.now() - 3 * 86400_000,
    confirmedAt: Date.now() - 1800_000,
    releasedAt:  null,
    txRef:       'TXN-ABC123',
  };

  const cfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG.pending;
  const { icon: StatusIcon } = cfg;

  // Timeline steps
  const TIMELINE = [
    { label: 'Payment received',        sub: format(new Date(tx.createdAt), 'd MMM · HH:mm'),                  done: true,                                        active: false },
    { label: 'Service in progress',     sub: 'Provider is working on it',                                       done: ['awaiting_confirmation','released','disputed'].includes(tx.status), active: tx.status === 'in_progress' },
    { label: 'Provider marked complete',sub: tx.confirmedAt ? format(new Date(tx.confirmedAt), 'd MMM · HH:mm') : 'Pending',  done: !!tx.confirmedAt,             active: false },
    { label: 'Your confirmation',       sub: confirmed ? 'Confirmed by you' : 'Awaiting your approval',         done: confirmed || tx.status === 'released',       active: tx.status === 'awaiting_confirmation' && !confirmed },
    { label: 'Funds released',          sub: tx.releasedAt ? format(new Date(tx.releasedAt), 'd MMM · HH:mm') : 'Pending confirmation', done: tx.status === 'released', active: false },
  ];

  const handleConfirm = useCallback(async () => {
    setConfirming(true);
    await new Promise(r => setTimeout(r, 1500));
    setConfirming(false);
    setConfirmed(true);
    onConfirmRelease?.();
  }, [onConfirmRelease]);

  const handleDispute = () => {
    if (!disputeReason.trim()) return;
    setShowDispute(false);
    onOpenDispute?.({ reason: disputeReason });
  };

  // ── COMPACT MODE ─────────────────────────────────────────
  if (compact) {
    return (
      <button type="button" onClick={() => setExpanded(v => !v)}
        className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border ${cfg.bg} ${cfg.border} transition-all`}>
        <div className={`w-2 h-2 rounded-full ${cfg.dotColor} ${cfg.urgent ? 'animate-pulse' : ''} shrink-0`} />
        <div className="flex-1 min-w-0 text-left">
          <p className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</p>
          <p className="text-xs text-gray-400 truncate">{tx.listing?.title}</p>
        </div>
        <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white shrink-0">
          {symbol}{tx.amount.toLocaleString()}
        </p>
        {expanded ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
      </button>
    );
  }

  return (
    <div className="overflow-hidden bg-white border border-gray-100 dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10">

      {/* Status header */}
      <div className={`flex items-center gap-4 px-5 py-4 ${cfg.bg} border-b ${cfg.border}`}>
        <div className={`w-10 h-10 rounded-2xl bg-white/80 dark:bg-black/20 flex items-center justify-center shrink-0`}>
          <StatusIcon size={20} className={cfg.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold ${cfg.color} flex items-center gap-2`}>
            {cfg.label}
            {cfg.urgent && <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />}
          </p>
          <p className="text-xs text-gray-500 dark:text-white/50">{cfg.sub}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">
            {symbol}{tx.amount.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-400 font-mono">{tx.txRef}</p>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5">
        {/* Listing & provider */}
        <div className="flex items-center gap-3 p-3 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
          <div className="flex items-center justify-center text-lg w-9 h-9 rounded-xl bg-brand-gold/20 shrink-0">🏠</div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate text-brand-charcoal-dark dark:text-white">{tx.listing?.title}</p>
            <p className="text-xs text-gray-400">Provider: {tx.provider?.name}</p>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <p className="mb-4 text-xs font-bold tracking-wider text-gray-400 uppercase">Payment Timeline</p>
          <div>
            {TIMELINE.map((t, i) => (
              <TimelineStep key={t.label} {...t} last={i === TIMELINE.length - 1} />
            ))}
          </div>
        </div>

        {/* Dispute countdown (when released recently) */}
        {tx.status === 'released' && tx.confirmedAt && (
          <DisputeCountdown confirmedAt={tx.confirmedAt} />
        )}

        {/* ── AWAITING CONFIRMATION actions ────────── */}
        {tx.status === 'awaiting_confirmation' && !confirmed && (
          <div className="pt-2 space-y-3 border-t border-gray-100 dark:border-white/10">
            <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
              Is the service complete to your satisfaction?
            </p>
            <p className="text-xs leading-relaxed text-gray-400">
              Confirming releases the <strong className="text-brand-charcoal-dark dark:text-white">{symbol}{tx.amount.toLocaleString()}</strong> escrow payment to {tx.provider?.name}. You have <strong>48 hours</strong> after confirmation to raise a dispute.
            </p>

            <div className="flex gap-3">
              {/* Confirm release */}
              <button type="button" onClick={handleConfirm} disabled={confirming}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition-colors">
                {confirming
                  ? <><span className="w-4 h-4 border-2 rounded-full border-white/40 border-t-white animate-spin" /> Confirming…</>
                  : <><CheckCircle2 size={15} /> Confirm & Release</>
                }
              </button>

              {/* Open dispute */}
              <button type="button" onClick={() => setShowDispute(true)}
                className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl border-2 border-red-200 dark:border-red-500/30 text-red-500 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                <Flag size={14} /> Dispute
              </button>
            </div>

            {/* Message provider */}
            <button type="button" onClick={onMessage}
              className="flex items-center justify-center w-full gap-2 py-3 text-sm font-bold transition-colors border-2 border-gray-200 rounded-2xl dark:border-white/20 text-brand-charcoal dark:text-white hover:border-brand-gold">
              <MessageSquare size={14} /> Message {tx.provider?.name?.split(' ')[0]}
            </button>
          </div>
        )}

        {/* Confirmed banner */}
        {confirmed && (
          <div className="flex items-center gap-3 p-4 border bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border-emerald-100 dark:border-emerald-500/20">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Payment Released!</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {symbol}{tx.amount.toLocaleString()} sent to {tx.provider?.name}. 48-hour dispute window is active.
              </p>
            </div>
          </div>
        )}

        {/* Released state */}
        {tx.status === 'released' && (
          <div className="flex items-center gap-3 p-4 border bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border-emerald-100 dark:border-emerald-500/20">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Transaction Complete</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                Payment released on {tx.releasedAt ? format(new Date(tx.releasedAt), 'd MMM yyyy') : 'confirmed date'}.
              </p>
            </div>
          </div>
        )}

        {/* Disputed state */}
        {tx.status === 'disputed' && (
          <div className="flex items-start gap-3 p-4 border border-red-100 bg-red-50 dark:bg-red-500/10 rounded-2xl dark:border-red-500/20">
            <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-700 dark:text-red-300">Dispute Under Review</p>
              <p className="text-xs text-red-500 dark:text-red-400 mt-0.5 leading-relaxed">
                Aurban support is reviewing your case. Funds remain in escrow. Typical resolution: 2–5 business days.
              </p>
              <button type="button" onClick={onMessage}
                className="flex items-center gap-1 mt-2 text-xs font-bold text-red-500 hover:text-red-600">
                <MessageSquare size={11} /> Message support <ArrowRight size={11} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── DISPUTE MODAL ─────────────────────────── */}
      {showDispute && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
          role="dialog" aria-modal="true">
          <div className="w-full p-6 bg-white shadow-2xl sm:max-w-sm dark:bg-brand-charcoal-dark rounded-t-3xl sm:rounded-3xl">
            <h3 className="mb-2 text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              Open a Dispute
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-gray-400">
              Describe what went wrong. Aurban will hold the {symbol}{tx.amount.toLocaleString()} until the issue is resolved.
            </p>
            <div className="mb-4">
              <label className="label-sm mb-1.5">Reason for dispute *</label>
              <textarea
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                placeholder="e.g. Work was not completed as agreed, property was not as described…"
                rows={4}
                maxLength={500}
                className="resize-none input-field"
              />
              <p className="text-[11px] text-right text-gray-400 mt-0.5">{disputeReason.length}/500</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowDispute(false)}
                className="flex-none px-5 py-3 text-sm font-bold border-2 border-gray-200 rounded-xl dark:border-white/20 text-brand-charcoal dark:text-white">
                Cancel
              </button>
              <button type="button" onClick={handleDispute}
                disabled={!disputeReason.trim()}
                className="flex-1 py-3 text-sm font-bold text-white transition-colors bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-40">
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}