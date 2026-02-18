import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wallet, ArrowUpRight, ArrowDownLeft, CreditCard,
  Clock, CheckCircle2, XCircle, AlertCircle,
  ShieldOff, Shield, RefreshCw, FileText,
} from 'lucide-react';
import * as adminService from '../../services/admin.service.js';
import RequirePermission from '../../components/admin/RequirePermission.jsx';
import ConfirmAction from '../../components/admin/ConfirmAction.jsx';
import useAdminAction from '../../hooks/useAdminAction.js';
import { AUDIT_ACTIONS } from '../../services/audit.service.js';
import { REFUND_THRESHOLDS, PAYOUT_THRESHOLDS, getMaxRefund, normalizeRole } from '../../utils/rbac.js';
import { useAuth } from '../../context/AuthContext.jsx';

/* ════════════════════════════════════════════════════════════
   PAYMENT MANAGEMENT — Transactions & escrow oversight
   Route: /admin/payments
════════════════════════════════════════════════════════════ */

/* ── Currency formatter (Naira) ──────────────────────────── */
const formatNaira = (value) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value);

/* ── Mock data (dev fallback) ────────────────────────────── */
const MOCK_PAYMENT_STATS = [
  { key: 'escrowHeld',    label: 'Total Escrow Held',  value: '₦12.5M', icon: Wallet,       color: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { key: 'pendingPayout', label: 'Pending Payouts',    value: '₦3.2M',  icon: Clock,        color: 'text-amber-500',   bg: 'bg-amber-50 dark:bg-amber-500/10' },
  { key: 'revenueMonth',  label: 'Revenue This Month', value: '₦1.8M',  icon: ArrowUpRight, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
];

const MOCK_TRANSACTIONS = [
  { id: 'tx1', ref: 'PAY-20250210-001', user: 'Adaeze Obi',     amount: '₦2,500,000', rawAmount: 2_500_000, type: 'inflow',  provider: 'Paystack',     status: 'completed', date: '2025-02-10', escrowStuck: false, escrowFrozen: false },
  { id: 'tx2', ref: 'PAY-20250209-002', user: 'Ibrahim Musa',   amount: '₦850,000',   rawAmount: 850_000,   type: 'inflow',  provider: 'Flutterwave',  status: 'completed', date: '2025-02-09', escrowStuck: false, escrowFrozen: false },
  { id: 'tx3', ref: 'PAY-20250209-003', user: 'Emeka Nwosu',    amount: '₦1,250,000', rawAmount: 1_250_000, type: 'outflow', provider: 'Paystack',     status: 'pending',   date: '2025-02-09', escrowStuck: true,  escrowFrozen: false },
  { id: 'tx4', ref: 'PAY-20250208-004', user: 'Chinwe Eze',     amount: '₦45,000',    rawAmount: 45_000,    type: 'inflow',  provider: 'OPay',         status: 'completed', date: '2025-02-08', escrowStuck: false, escrowFrozen: false },
  { id: 'tx5', ref: 'PAY-20250208-005', user: 'Tunde Bakare',   amount: '₦150,000',   rawAmount: 150_000,   type: 'outflow', provider: 'Paystack',     status: 'failed',    date: '2025-02-08', escrowStuck: false, escrowFrozen: false },
  { id: 'tx6', ref: 'PAY-20250207-006', user: 'Funke Adeyemi',  amount: '₦90,000',    rawAmount: 90_000,    type: 'inflow',  provider: 'Flutterwave',  status: 'pending',   date: '2025-02-07', escrowStuck: true,  escrowFrozen: false },
  { id: 'tx7', ref: 'PAY-20250206-007', user: 'Amina Suleiman', amount: '₦25,000',    rawAmount: 25_000,    type: 'inflow',  provider: 'OPay',         status: 'completed', date: '2025-02-06', escrowStuck: false, escrowFrozen: false },
  { id: 'tx8', ref: 'PAY-20250205-008', user: 'Oluwaseun Ajayi', amount: '₦7,500,000', rawAmount: 7_500_000, type: 'outflow', provider: 'Paystack',    status: 'pending',   date: '2025-02-05', escrowStuck: true,  escrowFrozen: true },
];

const TABS = [
  { id: 'all',       label: 'All Transactions' },
  { id: 'pending',   label: 'Pending' },
  { id: 'completed', label: 'Completed' },
  { id: 'failed',    label: 'Failed' },
];

const STATUS_STYLES = {
  completed: { label: 'Completed', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600', icon: CheckCircle2 },
  pending:   { label: 'Pending',   bg: 'bg-amber-50 dark:bg-amber-500/10',     text: 'text-amber-600',   icon: Clock },
  failed:    { label: 'Failed',    bg: 'bg-red-50 dark:bg-red-500/10',         text: 'text-red-600',     icon: XCircle },
  refunded:  { label: 'Refunded',  bg: 'bg-purple-50 dark:bg-purple-500/10',   text: 'text-purple-600',  icon: XCircle },
};

const PROVIDER_STYLES = {
  Paystack:    'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
  Flutterwave: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600',
  OPay:        'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600',
};

export default function PaymentManagement() {
  const { t } = useTranslation('admin');
  const { user } = useAuth();
  const adminRole = normalizeRole(user?.role);
  const maxRefund = getMaxRefund(adminRole);

  const [stats, setStats]               = useState(MOCK_PAYMENT_STATS);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [activeTab, setActiveTab]       = useState('all');
  const [loading, setLoading]           = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [pendingReleaseTxId, setPendingReleaseTxId] = useState(null);
  const [pendingRefundTxId, setPendingRefundTxId]   = useState(null);
  const [pendingFreezeTxId, setPendingFreezeTxId]   = useState(null);

  useEffect(() => {
    document.title = t('payments.title', 'Payment Management') + ' — Aurban';
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await adminService.getTransactions({ page: 1, limit: 50 });
        if (!cancelled && res.success && res.transactions?.length) {
          const normalized = res.transactions.map((tx) => {
            const rawAmount = Number(tx.amount || tx.rawAmount || 0);
            return {
              id: tx.id,
              ref: tx.ref || tx.reference || `PAY-${tx.id}`,
              user: tx.user_name || tx.user || tx.customer_name || 'Unknown',
              amount: formatNaira(rawAmount),
              rawAmount,
              type: tx.type || (rawAmount < 0 ? 'outflow' : 'inflow'),
              provider: tx.provider || tx.gateway || 'Paystack',
              status: tx.status || 'pending',
              date: tx.created_at ? tx.created_at.slice(0, 10) : (tx.date || ''),
              escrowStuck: Boolean(tx.escrow_stuck || tx.escrowStuck),
              escrowFrozen: Boolean(tx.escrow_frozen || tx.escrowFrozen),
              raw: tx,
            };
          });
          setTransactions(normalized);

          if (res.stats) {
            setStats(res.stats);
          } else {
            const escrowHeld = normalized.filter((t) => t.escrowStuck).reduce((s, t) => s + t.rawAmount, 0);
            const pendingPayout = normalized.filter((t) => t.status === 'pending').reduce((s, t) => s + t.rawAmount, 0);
            const revenueMonth = normalized.filter((t) => t.status === 'completed').reduce((s, t) => s + t.rawAmount, 0);
            setStats([
              { key: 'escrowHeld', label: 'Total Escrow Held', value: formatNaira(escrowHeld), icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
              { key: 'pendingPayout', label: 'Pending Payouts', value: formatNaira(pendingPayout), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
              { key: 'revenueMonth', label: 'Revenue This Month', value: formatNaira(revenueMonth), icon: ArrowUpRight, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
            ]);
          }
          setUsingFallback(false);
        } else if (!cancelled) {
          setUsingFallback(true);
        }
      } catch {
        if (!cancelled) setUsingFallback(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = activeTab === 'all' ? transactions : transactions.filter((tx) => tx.status === activeTab);

  /* ── Release escrow action ──────────────────────────────── */
  const handleRelease = async () => {
    if (!pendingReleaseTxId) return;
    const txId = pendingReleaseTxId;
    setTransactions((prev) => prev.map((tx) => tx.id === txId ? { ...tx, escrowStuck: false, status: 'completed' } : tx));
    setPendingReleaseTxId(null);
    await adminService.releaseEscrow(txId);
  };

  /* ── Admin action for escrow release (CRITICAL — requires password re-entry) */
  const releaseAction = useAdminAction({
    permission: 'payments:release_escrow',
    action: AUDIT_ACTIONS.ESCROW_RELEASE,
    onExecute: handleRelease,
    targetId: pendingReleaseTxId,
    targetType: 'payment',
    confirmTitle: 'Release Escrow',
    confirmMessage: 'This will release the held escrow funds to the recipient. This action cannot be undone.',
    confirmLabel: 'Release Escrow',
  });

  /** Initiate escrow release for a specific transaction */
  releaseAction.initiate = (txId) => {
    setPendingReleaseTxId(txId);
    releaseAction.execute();
  };

  /* ── Refund action ───────────────────────────────────────── */
  const handleRefund = async () => {
    if (!pendingRefundTxId) return;
    const txId = pendingRefundTxId;
    setTransactions((prev) => prev.map((tx) => tx.id === txId ? { ...tx, escrowStuck: false, status: 'refunded' } : tx));
    setPendingRefundTxId(null);
    await adminService.processRefund(txId);
  };

  /* ── Admin action for refund (CRITICAL — requires password re-entry) */
  const refundAction = useAdminAction({
    permission: 'payments:process_refund',
    action: AUDIT_ACTIONS.REFUND_PROCESS,
    onExecute: handleRefund,
    targetId: pendingRefundTxId,
    targetType: 'payment',
    confirmTitle: 'Process Refund',
    confirmMessage: 'This will refund the transaction amount back to the buyer. This action cannot be undone.',
    confirmLabel: 'Process Refund',
  });

  /** Initiate refund for a specific transaction */
  refundAction.initiate = (txId) => {
    setPendingRefundTxId(txId);
    refundAction.execute();
  };

  /* ── Freeze/unfreeze escrow action ────────────────────────── */
  const handleFreezeToggle = async () => {
    if (!pendingFreezeTxId) return;
    const txId = pendingFreezeTxId;
    setTransactions((prev) =>
      prev.map((tx) => tx.id === txId ? { ...tx, escrowFrozen: !tx.escrowFrozen } : tx),
    );
    setPendingFreezeTxId(null);
    const tx = transactions.find((t) => t.id === txId);
    await adminService.freezeEscrow(txId, { reason: tx?.escrowFrozen ? 'unfreeze' : 'freeze' });
  };

  const freezeAction = useAdminAction({
    permission: 'payments:freeze_escrow',
    action: AUDIT_ACTIONS.ESCROW_FREEZE,
    onExecute: handleFreezeToggle,
    targetId: pendingFreezeTxId,
    targetType: 'payment',
    confirmTitle: t('payments.freezeEscrow', 'Freeze / Unfreeze Escrow'),
    confirmMessage: t('payments.freezeEscrowMsg', 'This will toggle the escrow freeze status for this transaction. Frozen escrow cannot be released until unfrozen.'),
    confirmLabel: t('payments.freezeConfirm', 'Confirm'),
  });

  freezeAction.initiate = (txId) => {
    setPendingFreezeTxId(txId);
    freezeAction.execute();
  };

  /* ── Reconciliation action ────────────────────────────────── */
  const handleReconciliation = async () => {
    await adminService.getReconciliationReport({ gateway: 'all', period: 'current' });
  };

  const reconciliationAction = useAdminAction({
    permission: 'payments:reconciliation',
    action: AUDIT_ACTIONS.RECONCILIATION_RUN,
    onExecute: handleReconciliation,
    targetType: 'payment',
    confirmTitle: t('payments.reconciliation', 'Run Reconciliation'),
    confirmMessage: t('payments.reconciliationMsg', 'This will run a full reconciliation across all payment gateways. This may take several minutes.'),
    confirmLabel: t('payments.reconciliationConfirm', 'Run Reconciliation'),
  });

  /* ── Tax report action ────────────────────────────────────── */
  const handleTaxReport = async () => {
    const now = new Date();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    await adminService.getTaxReport({ quarter, year: now.getFullYear() });
  };

  const taxReportAction = useAdminAction({
    permission: 'payments:tax_reporting',
    action: AUDIT_ACTIONS.TAX_REPORT_GENERATE,
    onExecute: handleTaxReport,
    targetType: 'payment',
    confirmTitle: t('payments.taxReport', 'Generate Tax Report'),
    confirmMessage: t('payments.taxReportMsg', 'This will generate a tax report for the current quarter. The report will be available for download once complete.'),
    confirmLabel: t('payments.taxReportConfirm', 'Generate Report'),
  });

  return (
    <div className="pb-8 space-y-5">
      {/* ── Fallback banner ──────────────────────────────────── */}
      {usingFallback && (
        <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
          <AlertCircle size={14} className="shrink-0" />
          {t('fallback', 'Could not reach server. Showing cached data.')}
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
            {t('payments.title', 'Payment Management')}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {t('payments.subtitle', 'Transactions, escrow, and payout oversight')}
          </p>
          {/* ── Refund threshold display ──────────────────────── */}
          {maxRefund > 0 && (
            <p className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {t('payments.refundLimit', 'Your refund limit')}: {maxRefund === Infinity ? '∞ (unlimited)' : formatNaira(maxRefund)}
            </p>
          )}
        </div>

        {/* ── Finance action buttons ─────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          <RequirePermission permission="payments:reconciliation">
            <button
              onClick={() => reconciliationAction.execute()}
              disabled={reconciliationAction.loading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-colors bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-50"
            >
              <RefreshCw size={12} className={reconciliationAction.loading ? 'animate-spin' : ''} />
              {t('payments.runReconciliation', 'Run Reconciliation')}
            </button>
          </RequirePermission>
          <RequirePermission permission="payments:tax_reporting">
            <button
              onClick={() => taxReportAction.execute()}
              disabled={taxReportAction.loading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-colors bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50"
            >
              <FileText size={12} />
              {t('payments.generateTaxReport', 'Generate Tax Report')}
            </button>
          </RequirePermission>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
              <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
                <Icon size={16} className={s.color} />
              </div>
              <p className="text-xl font-bold text-brand-charcoal-dark dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-400">{t(`payments.stats.${s.key}`, s.label)}</p>
            </div>
          );
        })}
      </div>

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap shrink-0
                ${active
                  ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
            >
              {t(`payments.tabs.${tab.id}`, tab.label)}
            </button>
          );
        })}
      </div>

      {/* ── Transaction list ─────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-white dark:bg-gray-900 rounded-2xl shadow-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <CreditCard size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
            {t('payments.empty.title', 'No transactions found')}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {t('payments.empty.subtitle', 'No transactions match this filter')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((tx) => {
            const statusStyle = STATUS_STYLES[tx.status] || STATUS_STYLES.pending;
            const StatusIcon  = statusStyle.icon;
            const provStyle   = PROVIDER_STYLES[tx.provider] || 'bg-gray-100 dark:bg-white/5 text-gray-500';
            const isInflow    = tx.type === 'inflow';

            return (
              <div key={tx.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left: tx info */}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isInflow ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                      {isInflow ? <ArrowDownLeft size={16} className="text-emerald-500" /> : <ArrowUpRight size={16} className="text-red-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-gray-400">{tx.ref}</p>
                      <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">{tx.user}</p>
                    </div>
                  </div>

                  {/* Right: amount, provider, status, badges, date */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className={`text-sm font-bold ${isInflow ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isInflow ? '+' : '-'}{tx.amount}
                    </span>
                    {/* Dual approval badge for transactions over ₦5M */}
                    {tx.rawAmount >= PAYOUT_THRESHOLDS.dualApproval && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-50 dark:bg-red-500/10 text-red-600 flex items-center gap-1">
                        <Shield size={10} />
                        {t('payments.dualApproval', 'Dual Approval Required')}
                      </span>
                    )}
                    {/* Escrow frozen badge */}
                    {tx.escrowFrozen && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 flex items-center gap-1">
                        <ShieldOff size={10} />
                        {t('payments.frozen', 'Frozen')}
                      </span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${provStyle}`}>
                      {tx.provider}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${statusStyle.bg} ${statusStyle.text}`}>
                      <StatusIcon size={10} /> {statusStyle.label}
                    </span>
                    <span className="text-xs text-gray-400">{tx.date}</span>
                  </div>
                </div>

                {/* Stuck escrow warning */}
                {tx.escrowStuck && (
                  <div className="flex items-center justify-between p-3 mt-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
                      <AlertCircle size={13} />
                      {t('payments.escrowStuck', 'Escrow held — manual release may be required')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <RequirePermission permission="payments:freeze_escrow">
                        <button
                          onClick={() => freezeAction.initiate(tx.id)}
                          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-colors rounded-xl ${
                            tx.escrowFrozen
                              ? 'bg-blue-500 text-white hover:bg-blue-600'
                              : 'bg-gray-700 text-white hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500'
                          }`}
                        >
                          {tx.escrowFrozen ? <><Shield size={12} /> {t('payments.unfreeze', 'Unfreeze')}</> : <><ShieldOff size={12} /> {t('payments.freeze', 'Freeze')}</>}
                        </button>
                      </RequirePermission>
                      <RequirePermission permission="payments:release_escrow">
                        <button
                          onClick={() => releaseAction.initiate(tx.id)}
                          disabled={tx.escrowFrozen}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-colors bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Wallet size={12} />
                          {t('payments.release', 'Release Escrow')}
                        </button>
                      </RequirePermission>
                      <RequirePermission permission="payments:process_refund">
                        <button
                          onClick={() => refundAction.initiate(tx.id)}
                          disabled={tx.escrowFrozen}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold transition-colors bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle size={12} />
                          {t('payments.refund', 'Process Refund')}
                        </button>
                      </RequirePermission>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Confirm modal for escrow release ─────────────────── */}
      <ConfirmAction {...releaseAction.confirmProps} />

      {/* ── Confirm modal for refund ───────────────────────── */}
      <ConfirmAction {...refundAction.confirmProps} />

      {/* ── Confirm modal for escrow freeze/unfreeze ────────── */}
      <ConfirmAction {...freezeAction.confirmProps} />

      {/* ── Confirm modal for reconciliation ─────────────────── */}
      <ConfirmAction {...reconciliationAction.confirmProps} />

      {/* ── Confirm modal for tax report ─────────────────────── */}
      <ConfirmAction {...taxReportAction.confirmProps} />
    </div>
  );
}
