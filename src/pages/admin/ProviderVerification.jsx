import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, Shield, ShieldCheck, ShieldX, FileText,
  AlertCircle, ChevronLeft, ChevronRight,
  Clock, User, Eye, Upload, Building2,
} from 'lucide-react';
import RequirePermission from '../../components/admin/RequirePermission.jsx';
import ConfirmAction from '../../components/admin/ConfirmAction.jsx';
import useAdminAction from '../../hooks/useAdminAction.js';
import { AUDIT_ACTIONS } from '../../services/audit.service.js';
import { useAuth } from '../../context/AuthContext.jsx';
import * as adminService from '../../services/admin.service.js';

/* ════════════════════════════════════════════════════════════
   PROVIDER VERIFICATION — Queue of providers pending review
   Route: /provider/verification   Permission: verification:view
════════════════════════════════════════════════════════════ */

/* ── Mock data (dev fallback) ────────────────────────────── */
const MOCK_REQUESTS = [
  {
    id: 'vr1', providerName: 'Emeka Nwosu',     providerType: 'host',   email: 'emeka@example.com',
    submittedDocs: ['Government ID', 'Proof of Address', 'Property Deed'],
    status: 'pending',   submittedAt: '2025-02-12T10:30:00Z', notes: '',
  },
  {
    id: 'vr2', providerName: 'Adaeze Obi',       providerType: 'agent',  email: 'adaeze@example.com',
    submittedDocs: ['Agent License', 'Government ID'],
    status: 'pending',   submittedAt: '2025-02-11T14:15:00Z', notes: '',
  },
  {
    id: 'vr3', providerName: 'Ibrahim Musa',     providerType: 'seller', email: 'ibrahim@example.com',
    submittedDocs: ['Business Registration', 'Tax Clearance Certificate', 'Government ID'],
    status: 'approved',  submittedAt: '2025-02-09T08:00:00Z', notes: 'All documents verified',
  },
  {
    id: 'vr4', providerName: 'Chinwe Eze',       providerType: 'host',   email: 'chinwe@example.com',
    submittedDocs: ['Government ID'],
    status: 'docs_requested', submittedAt: '2025-02-08T16:45:00Z', notes: 'Missing proof of address',
  },
  {
    id: 'vr5', providerName: 'Oluwaseun Ajayi',  providerType: 'agent',  email: 'seun@example.com',
    submittedDocs: ['Agent License', 'Government ID', 'Professional Indemnity Insurance'],
    status: 'rejected',  submittedAt: '2025-02-07T11:20:00Z', notes: 'Agent license expired',
  },
];

const STATUS_FILTERS = ['all', 'unverified', 'pending', 'approved', 'rejected', 'docs_requested'];

const STATUS_STYLES = {
  unverified:     { label: 'Unverified',       bg: 'bg-gray-50 dark:bg-gray-500/10',     text: 'text-gray-600' },
  pending:        { label: 'Pending',          bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600' },
  approved:       { label: 'Approved',         bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600' },
  rejected:       { label: 'Rejected',         bg: 'bg-red-50 dark:bg-red-500/10',       text: 'text-red-600' },
  docs_requested: { label: 'Docs Requested',   bg: 'bg-blue-50 dark:bg-blue-500/10',     text: 'text-blue-600' },
};

const TYPE_STYLES = {
  host:       'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600',
  agent:      'bg-purple-50 dark:bg-purple-500/10 text-purple-600',
  seller:     'bg-amber-50 dark:bg-amber-500/10 text-amber-600',
  individual: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600',
  company:    'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600',
};

const PAGE_SIZE = 4;

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ProviderVerification() {
  const { t } = useTranslation('admin');
  useAuth();

  const [requests, setRequests]           = useState(MOCK_REQUESTS);
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [page, setPage]                   = useState(1);
  const [loading, setLoading]             = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);
  const [expandedDocs, setExpandedDocs]   = useState(null);

  useEffect(() => {
    document.title = t('verification.title', 'Provider Verification') + ' — Aurban';
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function loadProviders() {
      try {
        const res = await adminService.getVerificationQueue({ page: 1, limit: 100 });
        if (!cancelled && res.success && res.submissions?.length) {
          setRequests(res.submissions.map(p => ({
            id: p.id,
            providerName: p.name || p.user_name || 'Unnamed Provider',
            providerType: p.type || p.role || 'individual',
            email: p.email || '',
            whatsapp: p.whatsapp || p.phone || '',
            accountType: p.account_type || p.accountType || 'individual',
            submittedDocs: p.documents || p.submittedDocs || [],
            status: p.status || p.verification_status || 'unverified',
            submittedAt: p.created_at || p.submittedAt,
            notes: p.notes || '',
            raw: p,
          })));
          setUsingFallback(false);
        } else if (!cancelled) {
          setUsingFallback(true);
        }
      } catch { /* fall through to mock */ }
      if (!cancelled) setLoading(false);
    }

    loadProviders();
    return () => { cancelled = true; };
  }, []);

  /* ── Admin actions ─────────────────────────────────────── */
  const approveAction = useAdminAction({
    permission: 'verification:approve',
    action: AUDIT_ACTIONS.VERIFY_APPROVE,
    confirmTitle: t('verification.confirmApprove', 'Approve Provider'),
    confirmMessage: t('verification.confirmApproveMsg', 'This will grant full provider access. Are you sure?'),
    confirmLabel: t('verification.approve', 'Approve'),
    requireReason: true,
    targetId: activeRequest?.id,
    targetType: 'verification',
    onExecute: async ({ reason }) => {
      if (activeRequest?.id) {
        try { await adminService.approveVerification(activeRequest.id, { notes: reason }); } catch { /* keep optimistic */ }
      }
      setRequests((prev) => prev.map((r) => r.id === activeRequest?.id ? { ...r, status: 'approved', notes: reason } : r));
    },
    onSuccess: () => setActiveRequest(null),
  });

  const rejectAction = useAdminAction({
    permission: 'verification:reject',
    action: AUDIT_ACTIONS.VERIFY_REJECT,
    confirmTitle: t('verification.confirmReject', 'Reject Verification'),
    confirmMessage: t('verification.confirmRejectMsg', 'This will reject the provider application. You must provide a reason.'),
    confirmLabel: t('verification.reject', 'Reject'),
    requireReason: true,
    targetId: activeRequest?.id,
    targetType: 'verification',
    onExecute: async ({ reason }) => {
      if (activeRequest?.id) {
        try { await adminService.rejectVerification(activeRequest.id, { reason }); } catch { /* keep optimistic */ }
      }
      setRequests((prev) => prev.map((r) => r.id === activeRequest?.id ? { ...r, status: 'rejected', notes: reason } : r));
    },
    onSuccess: () => setActiveRequest(null),
  });

  const requestDocsAction = useAdminAction({
    permission: 'verification:request_docs',
    action: AUDIT_ACTIONS.VERIFY_REQUEST_DOCS,
    confirmTitle: t('verification.confirmRequestDocs', 'Request Additional Documents'),
    confirmMessage: t('verification.confirmRequestDocsMsg', 'Specify which additional documents are needed.'),
    confirmLabel: t('verification.requestDocs', 'Request Docs'),
    requireReason: true,
    targetId: activeRequest?.id,
    targetType: 'verification',
    onExecute: async ({ reason }) => {
      if (activeRequest?.id) {
        try { await adminService.requestAdditionalDocs(activeRequest.id, { documents: reason ? [reason] : [] }); } catch { /* keep optimistic */ }
      }
      setRequests((prev) => prev.map((r) => r.id === activeRequest?.id ? { ...r, status: 'docs_requested', notes: reason } : r));
    },
    onSuccess: () => setActiveRequest(null),
  });

  /* ── Filtering ─────────────────────────────────────────── */
  const filtered = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.providerName.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <RequirePermission permission="verification:view">
      <div className="pb-8 space-y-5">
        {/* ── Fallback banner ──────────────────────────────────── */}
        {usingFallback && (
          <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
            <AlertCircle size={14} className="shrink-0" />
            {t('fallback', 'Could not reach server. Showing mock data for development.')}
          </div>
        )}

        {/* ── Header ───────────────────────────────────────────── */}
        <div>
          <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
            {t('verification.title', 'Provider Verification')}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {t('verification.subtitle', 'Review and approve provider verification requests')}
          </p>
        </div>

        {/* ── Search ───────────────────────────────────────────── */}
        <div className="relative">
          <Search size={16} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            placeholder={t('verification.searchPlaceholder', 'Search by name or email...')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full py-2.5 pl-10 pr-4 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/40 text-brand-charcoal-dark dark:text-white placeholder-gray-400"
          />
        </div>

        {/* ── Status filter pills ──────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors capitalize whitespace-nowrap shrink-0
                ${statusFilter === s
                  ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
            >
              {s === 'all' ? t('verification.filters.all', 'All') : STATUS_STYLES[s]?.label || s}
            </button>
          ))}
        </div>

        {/* ── Verification cards ───────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 bg-white dark:bg-gray-900 rounded-2xl shadow-card animate-pulse" />
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="py-16 text-center">
            <Shield size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
              {t('verification.empty.title', 'No verification requests')}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {t('verification.empty.subtitle', 'All caught up! No pending verifications.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {paged.map((req) => {
              const status = STATUS_STYLES[req.status] || STATUS_STYLES.pending;
              return (
                <div key={req.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
                  {/* Top row: name + status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full dark:bg-white/10 shrink-0">
                        <User size={18} className="text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white truncate">{req.providerName}</p>
                        <p className="text-xs text-gray-400 truncate">{req.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${TYPE_STYLES[req.providerType] || TYPE_STYLES.host}`}>
                        {req.providerType}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Submitted docs */}
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      {t('verification.submittedDocs', 'Submitted Documents')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {req.submittedDocs.map((doc, i) => (
                        <span key={i} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                          <FileText size={10} /> {doc}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {req.notes && (
                    <p className="mt-2 text-xs text-gray-400 italic">
                      {t('verification.notes', 'Note')}: {req.notes}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(req.submittedAt)}</span>
                  </div>

                  {/* Expanded docs detail */}
                  {expandedDocs === req.id && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl space-y-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Document Details</p>
                      {req.submittedDocs.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-lg">
                          <span className="flex items-center gap-2 text-xs text-brand-charcoal-dark dark:text-white">
                            <FileText size={12} className="text-gray-400" /> {doc}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            req.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' :
                            req.status === 'rejected' ? 'bg-red-50 dark:bg-red-500/10 text-red-600' :
                            'bg-amber-50 dark:bg-amber-500/10 text-amber-600'
                          }`}>
                            {req.status === 'approved' ? 'Verified' : req.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => setExpandedDocs(expandedDocs === req.id ? null : req.id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-gray-100 dark:bg-white/5 text-brand-charcoal-dark dark:text-white rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                      <Eye size={12} /> {expandedDocs === req.id ? t('verification.hideDocs', 'Hide Docs') : t('verification.viewDocs', 'View Docs')}
                    </button>

                    {(req.status === 'pending' || req.status === 'unverified') && (
                      <>
                        <RequirePermission permission="verification:approve">
                          <button
                            onClick={() => { setActiveRequest(req); approveAction.execute(); }}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                          >
                            <ShieldCheck size={12} /> {t('verification.approve', 'Approve')}
                          </button>
                        </RequirePermission>

                        <RequirePermission permission="verification:reject">
                          <button
                            onClick={() => { setActiveRequest(req); rejectAction.execute(); }}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-red-50 dark:bg-red-500/10 text-red-600 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                          >
                            <ShieldX size={12} /> {t('verification.reject', 'Reject')}
                          </button>
                        </RequirePermission>

                        <RequirePermission permission="verification:request_docs">
                          <button
                            onClick={() => { setActiveRequest(req); requestDocsAction.execute(); }}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                          >
                            <Upload size={12} /> {t('verification.requestDocs', 'Request Docs')}
                          </button>
                        </RequirePermission>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Pagination ───────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 text-gray-400 transition-colors bg-white dark:bg-gray-900 rounded-lg shadow-card hover:text-brand-charcoal-dark dark:hover:text-white disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors
                  ${page === i + 1
                    ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-900 text-gray-400 shadow-card hover:text-brand-charcoal-dark dark:hover:text-white'
                  }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 text-gray-400 transition-colors bg-white dark:bg-gray-900 rounded-lg shadow-card hover:text-brand-charcoal-dark dark:hover:text-white disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── Confirm modals ───────────────────────────────────── */}
        <ConfirmAction {...approveAction.confirmProps} />
        <ConfirmAction {...rejectAction.confirmProps} />
        <ConfirmAction {...requestDocsAction.confirmProps} />
      </div>
    </RequirePermission>
  );
}
