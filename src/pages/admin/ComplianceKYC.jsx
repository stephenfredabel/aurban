import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, Shield, ShieldCheck, ShieldX, ShieldAlert,
  AlertCircle, ChevronLeft, ChevronRight,
  Clock, User, FileText, Lock, AlertTriangle,
  Radar, FileWarning, Globe, Database,
  CheckCircle2, XCircle, ChevronDown, Download, Trash2,
  BadgeCheck,
} from 'lucide-react';
import RequirePermission from '../../components/admin/RequirePermission.jsx';
import ConfirmAction from '../../components/admin/ConfirmAction.jsx';
import useAdminAction from '../../hooks/useAdminAction.js';
import { AUDIT_ACTIONS } from '../../services/audit.service.js';
import { maskUserData } from '../../utils/dataMask.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { KYC_LEVELS } from '../../utils/rbac.js';

/* ════════════════════════════════════════════════════════════
   COMPLIANCE / KYC — KYC review queue with risk scoring
   Route: /provider/kyc   Permission: kyc:view
════════════════════════════════════════════════════════════ */

/* ── Mock data (dev fallback) ────────────────────────────── */
const MOCK_KYC_RAW = [
  {
    id: 'kyc1', name: 'Emeka Nwosu',      email: 'emeka@example.com',    phone: '08012345678',
    submittedDocs: ['Government ID', 'Proof of Address', 'Utility Bill'],
    riskScore: 'low',    numericRisk: 18,  kycLevel: 'L2',
    status: 'pending',
    submittedAt: '2025-02-13T10:00:00Z', notes: '',
    bvn: '22345678901', nin: '98765432100',
    jurisdiction: 'Lagos, Nigeria',
  },
  {
    id: 'kyc2', name: 'Adaeze Obi',       email: 'adaeze@example.com',   phone: '07098765432',
    submittedDocs: ['Government ID', 'Business Registration'],
    riskScore: 'medium', numericRisk: 45,  kycLevel: 'L3',
    status: 'pending',
    submittedAt: '2025-02-12T14:30:00Z', notes: '',
    bvn: '11234567890', nin: '12345678900',
    jurisdiction: 'Abuja, Nigeria',
  },
  {
    id: 'kyc3', name: 'Ibrahim Musa',     email: 'ibrahim@example.com',  phone: '09011223344',
    submittedDocs: ['Government ID', 'Proof of Address', 'Business Registration', 'Tax Clearance'],
    riskScore: 'low',    numericRisk: 12,  kycLevel: 'L3',
    status: 'approved',
    submittedAt: '2025-02-10T08:15:00Z', notes: 'All documents verified and consistent',
    bvn: '33456789012', nin: '45678901233',
    jurisdiction: 'Kano, Nigeria',
  },
  {
    id: 'kyc4', name: 'Funke Adeyemi',    email: 'funke@example.com',    phone: '08155667788',
    submittedDocs: ['Government ID'],
    riskScore: 'high',   numericRisk: 78,  kycLevel: 'L1',
    status: 'flagged',
    submittedAt: '2025-02-09T16:45:00Z', notes: 'ID document appears altered — under review',
    bvn: '44567890123', nin: '56789012344',
    jurisdiction: 'Port Harcourt, Nigeria',
  },
  {
    id: 'kyc5', name: 'Oluwaseun Ajayi',  email: 'seun@example.com',     phone: '07033445566',
    submittedDocs: ['Government ID', 'Proof of Address'],
    riskScore: 'medium', numericRisk: 52,  kycLevel: 'L2',
    status: 'rejected',
    submittedAt: '2025-02-07T11:20:00Z', notes: 'Address proof does not match registered location',
    bvn: '55678901234', nin: '67890123455',
    jurisdiction: 'Ibadan, Nigeria',
  },
];

/* ── Mock GDPR / Data Privacy requests ───────────────────── */
const MOCK_GDPR_REQUESTS = [
  {
    id: 'gdpr1',
    userName: 'Chidinma Eze',
    email: 'chidinma@example.com',
    type: 'export',
    reason: 'Personal data portability request under NDPR',
    submittedAt: '2025-02-11T09:30:00Z',
    status: 'pending',
  },
  {
    id: 'gdpr2',
    userName: 'Babajide Ogunleye',
    email: 'babajide@example.com',
    type: 'deletion',
    reason: 'Account closure — requesting full data erasure per NDPR',
    submittedAt: '2025-02-10T15:12:00Z',
    status: 'pending',
  },
  {
    id: 'gdpr3',
    userName: 'Aisha Abdullahi',
    email: 'aisha@example.com',
    type: 'export',
    reason: 'Requesting copy of all personal data held on platform',
    submittedAt: '2025-02-08T11:45:00Z',
    status: 'pending',
  },
];

const RISK_STYLES = {
  low:    { label: 'Low Risk',    bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600', dot: 'bg-emerald-500' },
  medium: { label: 'Medium Risk', bg: 'bg-amber-50 dark:bg-amber-500/10',    text: 'text-amber-600',   dot: 'bg-amber-500' },
  high:   { label: 'High Risk',   bg: 'bg-red-50 dark:bg-red-500/10',        text: 'text-red-600',     dot: 'bg-red-500' },
};

const STATUS_STYLES = {
  pending:  { label: 'Pending',  bg: 'bg-amber-50 dark:bg-amber-500/10',     text: 'text-amber-600',   icon: Clock },
  approved: { label: 'Approved', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600', icon: ShieldCheck },
  rejected: { label: 'Rejected', bg: 'bg-red-50 dark:bg-red-500/10',         text: 'text-red-600',     icon: ShieldX },
  flagged:  { label: 'Flagged',  bg: 'bg-orange-50 dark:bg-orange-500/10',   text: 'text-orange-600',  icon: AlertTriangle },
  frozen:   { label: 'Frozen',   bg: 'bg-blue-50 dark:bg-blue-500/10',       text: 'text-blue-600',    icon: Lock },
};

/* ── KYC level badge styles ──────────────────────────────── */
const KYC_LEVEL_STYLES = {
  L1: { bg: 'bg-gray-100 dark:bg-white/5',         text: 'text-gray-500 dark:text-gray-400',     border: 'border-gray-200 dark:border-white/10' },
  L2: { bg: 'bg-blue-50 dark:bg-blue-500/10',      text: 'text-blue-600 dark:text-blue-400',     border: 'border-blue-200 dark:border-blue-500/20' },
  L3: { bg: 'bg-purple-50 dark:bg-purple-500/10',  text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-500/20' },
  L4: { bg: 'bg-brand-gold/10',                    text: 'text-brand-gold',                      border: 'border-brand-gold/30' },
};

const STATUS_FILTERS = ['all', 'pending', 'approved', 'rejected', 'flagged', 'frozen'];
const RISK_FILTERS   = ['all', 'low', 'medium', 'high'];

const PAGE_SIZE = 4;

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ── Risk Score Bar component ────────────────────────────── */
function RiskScoreBar({ score }) {
  const pct = Math.max(0, Math.min(100, score));
  let barColor, label;

  if (pct <= 30) {
    barColor = 'bg-emerald-500';
    label = 'Low';
  } else if (pct <= 60) {
    barColor = 'bg-amber-500';
    label = 'Medium';
  } else {
    barColor = 'bg-red-500';
    label = 'High';
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-20 h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] font-bold tabular-nums text-brand-charcoal-dark dark:text-white">
        {pct}
      </span>
      <span className={`text-[9px] font-medium uppercase tracking-wider ${
        pct <= 30 ? 'text-emerald-500' : pct <= 60 ? 'text-amber-500' : 'text-red-500'
      }`}>
        {label}
      </span>
    </div>
  );
}

/* ── KYC Level Badge component ───────────────────────────── */
function KycLevelBadge({ level }) {
  const meta = KYC_LEVELS[level];
  const style = KYC_LEVEL_STYLES[level] || KYC_LEVEL_STYLES.L1;

  if (!meta) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold border ${style.bg} ${style.text} ${style.border}`}
      title={meta.description}
    >
      <BadgeCheck size={10} />
      {level} {meta.label}
    </span>
  );
}

/* ── Dropdown menu component ─────────────────────────────── */
function DropdownMenu({ trigger, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)}>
        {trigger}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-52 py-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-white/10">
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

export default function ComplianceKYC() {
  const { t } = useTranslation('admin');
  const { user } = useAuth();

  const [kycRaw, setKycRaw]               = useState(MOCK_KYC_RAW);
  const [gdprRequests, setGdprRequests]   = useState(MOCK_GDPR_REQUESTS);
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [riskFilter, setRiskFilter]       = useState('all');
  const [page, setPage]                   = useState(1);
  const [loading, setLoading]             = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [activeKyc, setActiveKyc]         = useState(null);
  const [sanctionsResults, setSanctionsResults] = useState({});

  useEffect(() => {
    document.title = t('kyc.title', 'Compliance & KYC') + ' — Aurban';
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      if (!cancelled) {
        setUsingFallback(true);
        setLoading(false);
      }
    }, 600);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  /* ── Apply data masking based on viewer role ───────────── */
  const kyc = kycRaw.map((record) => maskUserData(record, user?.role));

  /* ── Admin actions ─────────────────────────────────────── */
  const approveAction = useAdminAction({
    permission: 'kyc:approve',
    action: AUDIT_ACTIONS.KYC_APPROVE,
    confirmTitle: t('kyc.confirmApprove', 'Approve KYC Application'),
    confirmMessage: t('kyc.confirmApproveMsg', 'This will mark the KYC application as verified and grant full access.'),
    confirmLabel: t('kyc.approve', 'Approve'),
    requireReason: true,
    targetId: activeKyc?.id,
    targetType: 'kyc',
    onExecute: async ({ reason }) => {
      setKycRaw((prev) => prev.map((r) => r.id === activeKyc?.id ? { ...r, status: 'approved', notes: reason } : r));
    },
    onSuccess: () => setActiveKyc(null),
  });

  const rejectAction = useAdminAction({
    permission: 'kyc:reject',
    action: AUDIT_ACTIONS.KYC_REJECT,
    confirmTitle: t('kyc.confirmReject', 'Reject KYC Application'),
    confirmMessage: t('kyc.confirmRejectMsg', 'This will reject the KYC application. You must provide a reason.'),
    confirmLabel: t('kyc.reject', 'Reject'),
    requireReason: true,
    targetId: activeKyc?.id,
    targetType: 'kyc',
    onExecute: async ({ reason }) => {
      setKycRaw((prev) => prev.map((r) => r.id === activeKyc?.id ? { ...r, status: 'rejected', notes: reason } : r));
    },
    onSuccess: () => setActiveKyc(null),
  });

  const flagRiskAction = useAdminAction({
    permission: 'kyc:flag_risk',
    action: AUDIT_ACTIONS.KYC_FLAG_RISK,
    confirmTitle: t('kyc.confirmFlagRisk', 'Flag as High Risk'),
    confirmMessage: t('kyc.confirmFlagRiskMsg', 'This will flag the user as high risk and trigger additional review.'),
    confirmLabel: t('kyc.flagRisk', 'Flag High Risk'),
    requireReason: true,
    targetId: activeKyc?.id,
    targetType: 'kyc',
    onExecute: async ({ reason }) => {
      setKycRaw((prev) => prev.map((r) => r.id === activeKyc?.id ? { ...r, status: 'flagged', riskScore: 'high', numericRisk: 85, notes: reason } : r));
    },
    onSuccess: () => setActiveKyc(null),
  });

  const freezeAction = useAdminAction({
    permission: 'kyc:freeze_account',
    action: AUDIT_ACTIONS.KYC_FREEZE,
    confirmTitle: t('kyc.confirmFreeze', 'Freeze Account'),
    confirmMessage: t('kyc.confirmFreezeMsg', 'This is a critical action. The user account will be completely frozen and all activities suspended. This requires re-authentication.'),
    confirmLabel: t('kyc.freezeAccount', 'Freeze Account'),
    requireReason: true,
    targetId: activeKyc?.id,
    targetType: 'kyc',
    onExecute: async ({ reason }) => {
      setKycRaw((prev) => prev.map((r) => r.id === activeKyc?.id ? { ...r, status: 'frozen', notes: reason } : r));
    },
    onSuccess: () => setActiveKyc(null),
  });

  /* ── Sanctions Screening action ────────────────────────── */
  const sanctionsAction = useAdminAction({
    permission: 'kyc:sanctions_screening',
    action: AUDIT_ACTIONS.KYC_SANCTIONS_SCREEN,
    confirmTitle: t('kyc.confirmSanctions', 'Run Sanctions Check'),
    confirmMessage: t('kyc.confirmSanctionsMsg', 'This will screen the applicant against OFAC, UN, EU, and CBN sanctions lists. Results will be recorded in the audit trail.'),
    confirmLabel: t('kyc.runSanctionsCheck', 'Run Check'),
    requireReason: false,
    targetId: activeKyc?.id,
    targetType: 'kyc',
    onExecute: async () => {
      // Mock: simulate sanctions screening result
      await new Promise((resolve) => setTimeout(resolve, 800));
      const cleared = activeKyc?.numericRisk <= 60;
      setSanctionsResults((prev) => ({
        ...prev,
        [activeKyc?.id]: {
          status: cleared ? 'clear' : 'match_found',
          lists: cleared ? [] : ['CBN Watchlist'],
          screenedAt: new Date().toISOString(),
        },
      }));
    },
    onSuccess: () => setActiveKyc(null),
  });

  /* ── File SAR action (critical — high risk only) ───────── */
  const fileSarAction = useAdminAction({
    permission: 'kyc:file_sar',
    action: AUDIT_ACTIONS.KYC_FILE_SAR,
    confirmTitle: t('kyc.confirmFileSar', 'File Suspicious Activity Report'),
    confirmMessage: t('kyc.confirmFileSarMsg', 'This is a critical action. A SAR will be filed with the NFIU (Nigeria Financial Intelligence Unit). This action is irreversible and will be permanently logged. Re-authentication is required.'),
    confirmLabel: t('kyc.fileSar', 'File SAR'),
    requireReason: true,
    targetId: activeKyc?.id,
    targetType: 'kyc',
    onExecute: async ({ reason }) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setKycRaw((prev) => prev.map((r) =>
        r.id === activeKyc?.id
          ? { ...r, notes: `SAR filed: ${reason}`, status: r.status === 'pending' ? 'flagged' : r.status }
          : r
      ));
    },
    onSuccess: () => setActiveKyc(null),
  });

  /* ── Block Jurisdiction action (critical) ──────────────── */
  const blockJurisdictionAction = useAdminAction({
    permission: 'kyc:block_jurisdiction',
    action: AUDIT_ACTIONS.KYC_BLOCK_JURISDICTION,
    confirmTitle: t('kyc.confirmBlockJurisdiction', 'Block Jurisdiction'),
    confirmMessage: t('kyc.confirmBlockJurisdictionMsg', 'This is a critical action. All new registrations and transactions from this jurisdiction will be blocked. This requires re-authentication.'),
    confirmLabel: t('kyc.blockJurisdiction', 'Block Jurisdiction'),
    requireReason: true,
    targetId: activeKyc?.id,
    targetType: 'kyc',
    onExecute: async ({ reason }) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      // Mock: flag the jurisdiction as blocked in notes
      setKycRaw((prev) => prev.map((r) =>
        r.id === activeKyc?.id
          ? { ...r, notes: `Jurisdiction blocked (${r.jurisdiction}): ${reason}` }
          : r
      ));
    },
    onSuccess: () => setActiveKyc(null),
  });

  /* ── GDPR Approve action ───────────────────────────────── */
  const gdprApproveAction = useAdminAction({
    permission: 'compliance:gdpr_requests',
    action: AUDIT_ACTIONS.COMPLIANCE_GDPR,
    confirmTitle: t('kyc.confirmGdprApprove', 'Approve Data Request'),
    confirmMessage: t('kyc.confirmGdprApproveMsg', 'This will process the data privacy request. For deletion requests, this is irreversible.'),
    confirmLabel: t('kyc.gdprApprove', 'Approve Request'),
    requireReason: true,
    targetId: activeKyc?.id,
    targetType: 'gdpr_request',
    onExecute: async ({ reason }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setGdprRequests((prev) => prev.map((r) =>
        r.id === activeKyc?.id ? { ...r, status: 'approved', notes: reason } : r
      ));
    },
    onSuccess: () => setActiveKyc(null),
  });

  /* ── GDPR Deny action ──────────────────────────────────── */
  const gdprDenyAction = useAdminAction({
    permission: 'compliance:gdpr_requests',
    action: AUDIT_ACTIONS.COMPLIANCE_DATA_EXPORT,
    confirmTitle: t('kyc.confirmGdprDeny', 'Deny Data Request'),
    confirmMessage: t('kyc.confirmGdprDenyMsg', 'This will deny the data privacy request. You must provide a legal justification.'),
    confirmLabel: t('kyc.gdprDeny', 'Deny Request'),
    requireReason: true,
    targetId: activeKyc?.id,
    targetType: 'gdpr_request',
    onExecute: async ({ reason }) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setGdprRequests((prev) => prev.map((r) =>
        r.id === activeKyc?.id ? { ...r, status: 'denied', notes: reason } : r
      ));
    },
    onSuccess: () => setActiveKyc(null),
  });

  /* ── Filtering ─────────────────────────────────────────── */
  const filtered = kyc.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (riskFilter !== 'all' && r.riskScore !== riskFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.name?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <RequirePermission permission="kyc:view">
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
            {t('kyc.title', 'Compliance & KYC')}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {t('kyc.subtitle', 'Review KYC applications, verify documents, and manage risk')}
          </p>
        </div>

        {/* ── Search ───────────────────────────────────────────── */}
        <div className="relative">
          <Search size={16} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
          <input
            type="text"
            placeholder={t('kyc.searchPlaceholder', 'Search by name or email...')}
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
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap shrink-0
                ${statusFilter === s
                  ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
            >
              {s === 'all' ? t('kyc.filters.allStatus', 'All Status') : STATUS_STYLES[s]?.label || s}
            </button>
          ))}
        </div>

        {/* ── Risk filter pills ────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {RISK_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => { setRiskFilter(r); setPage(1); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors capitalize whitespace-nowrap shrink-0
                ${riskFilter === r
                  ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
            >
              {r === 'all' ? t('kyc.filters.allRisk', 'All Risk Levels') : RISK_STYLES[r]?.label || r}
            </button>
          ))}
        </div>

        {/* ── KYC cards ────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-56 bg-white dark:bg-gray-900 rounded-2xl shadow-card animate-pulse" />
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="py-16 text-center">
            <Shield size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
              {t('kyc.empty.title', 'No KYC applications found')}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {t('kyc.empty.subtitle', 'Try adjusting your search or filters')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {paged.map((record) => {
              const risk   = RISK_STYLES[record.riskScore]   || RISK_STYLES.low;
              const status = STATUS_STYLES[record.status]    || STATUS_STYLES.pending;
              const StatusIcon = status.icon;
              const sanctionResult = sanctionsResults[record.id];
              const isHighRisk = record.numericRisk > 60;

              return (
                <div key={record.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
                  {/* Top row: user info + badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full dark:bg-white/10 shrink-0">
                        <User size={18} className="text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white truncate">{record.name}</p>
                        <p className="text-xs text-gray-400 truncate">{record.email}</p>
                        <p className="text-xs text-gray-400">{record.phone}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {/* KYC Level badge */}
                      {record.kycLevel && <KycLevelBadge level={record.kycLevel} />}

                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${risk.dot}`} />
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${risk.bg} ${risk.text}`}>
                          {risk.label}
                        </span>
                      </div>
                      <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.text}`}>
                        <StatusIcon size={10} /> {status.label}
                      </span>
                    </div>
                  </div>

                  {/* Risk Score Bar — numeric 0-100 indicator */}
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      {t('kyc.riskScore', 'Risk Score')}
                    </p>
                    <RiskScoreBar score={record.numericRisk} />
                  </div>

                  {/* Sanctions screening result (if available) */}
                  {sanctionResult && (
                    <div className={`mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
                      sanctionResult.status === 'clear'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                        : 'bg-red-50 dark:bg-red-500/10 text-red-600'
                    }`}>
                      {sanctionResult.status === 'clear' ? (
                        <>
                          <CheckCircle2 size={12} />
                          {t('kyc.sanctionsClear', 'Sanctions screening clear — no matches found')}
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={12} />
                          {t('kyc.sanctionsMatch', 'Potential match found')}: {sanctionResult.lists.join(', ')}
                        </>
                      )}
                      <span className="ml-auto text-[9px] text-gray-400">
                        {formatDate(sanctionResult.screenedAt)}
                      </span>
                    </div>
                  )}

                  {/* Submitted documents */}
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      {t('kyc.submittedDocs', 'Submitted Documents')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {record.submittedDocs.map((doc, i) => (
                        <span key={i} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                          <FileText size={10} /> {doc}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sensitive fields (masked based on role) */}
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="text-xs">
                      <span className="font-semibold text-gray-400">BVN: </span>
                      <span className="text-brand-charcoal-dark dark:text-white font-mono">{record.bvn}</span>
                    </div>
                    <div className="text-xs">
                      <span className="font-semibold text-gray-400">NIN: </span>
                      <span className="text-brand-charcoal-dark dark:text-white font-mono">{record.nin}</span>
                    </div>
                    {record.jurisdiction && (
                      <div className="text-xs">
                        <span className="font-semibold text-gray-400">Jurisdiction: </span>
                        <span className="text-brand-charcoal-dark dark:text-white">{record.jurisdiction}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {record.notes && (
                    <p className="mt-2 text-xs text-gray-400 italic">
                      {t('kyc.notes', 'Note')}: {record.notes}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={11} /> {formatDate(record.submittedAt)}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {(record.status === 'pending' || record.status === 'flagged') && (
                      <>
                        <RequirePermission permission="kyc:approve">
                          <button
                            onClick={() => { setActiveKyc(record); approveAction.execute(); }}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                          >
                            <ShieldCheck size={12} /> {t('kyc.approve', 'Approve')}
                          </button>
                        </RequirePermission>

                        <RequirePermission permission="kyc:reject">
                          <button
                            onClick={() => { setActiveKyc(record); rejectAction.execute(); }}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-red-50 dark:bg-red-500/10 text-red-600 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                          >
                            <ShieldX size={12} /> {t('kyc.reject', 'Reject')}
                          </button>
                        </RequirePermission>
                      </>
                    )}

                    {record.status !== 'flagged' && record.status !== 'frozen' && (
                      <RequirePermission permission="kyc:flag_risk">
                        <button
                          onClick={() => { setActiveKyc(record); flagRiskAction.execute(); }}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-orange-50 dark:bg-orange-500/10 text-orange-600 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
                        >
                          <AlertTriangle size={12} /> {t('kyc.flagRisk', 'Flag High Risk')}
                        </button>
                      </RequirePermission>
                    )}

                    {record.status !== 'frozen' && (
                      <RequirePermission permission="kyc:freeze_account">
                        <button
                          onClick={() => { setActiveKyc(record); freezeAction.execute(); }}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                        >
                          <Lock size={12} /> {t('kyc.freezeAccount', 'Freeze Account')}
                        </button>
                      </RequirePermission>
                    )}

                    {/* Sanctions Screening button */}
                    <RequirePermission permission="kyc:sanctions_screening">
                      <button
                        onClick={() => { setActiveKyc(record); sanctionsAction.execute(); }}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                      >
                        <Radar size={12} /> {t('kyc.runSanctionsCheck', 'Run Sanctions Check')}
                      </button>
                    </RequirePermission>

                    {/* File SAR button — only for high-risk submissions (numericRisk > 60) */}
                    {isHighRisk && (
                      <RequirePermission permission="kyc:file_sar">
                        <button
                          onClick={() => { setActiveKyc(record); fileSarAction.execute(); }}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-red-50 dark:bg-red-500/10 text-red-700 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-500/20"
                        >
                          <FileWarning size={12} /> {t('kyc.fileSar', 'File SAR')}
                        </button>
                      </RequirePermission>
                    )}

                    {/* More actions dropdown — Block Jurisdiction */}
                    <RequirePermission permission="kyc:block_jurisdiction">
                      <DropdownMenu
                        trigger={
                          <span className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer">
                            <ChevronDown size={12} /> {t('kyc.moreActions', 'More')}
                          </span>
                        }
                      >
                        {(close) => (
                          <button
                            onClick={() => {
                              close();
                              setActiveKyc(record);
                              blockJurisdictionAction.execute();
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          >
                            <Globe size={12} />
                            {t('kyc.blockJurisdiction', 'Block Jurisdiction')}
                            {record.jurisdiction && (
                              <span className="ml-auto text-[9px] text-gray-400 truncate max-w-[100px]">
                                {record.jurisdiction}
                              </span>
                            )}
                          </button>
                        )}
                      </DropdownMenu>
                    </RequirePermission>
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

        {/* ── GDPR / Data Privacy Requests Section ─────────────── */}
        <RequirePermission permission="compliance:gdpr_requests">
          <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
            <div className="flex items-center gap-2 mb-4">
              <Database size={18} className="text-purple-500" />
              <h2 className="text-sm font-bold font-display text-brand-charcoal-dark dark:text-white">
                {t('kyc.gdprTitle', 'Data Privacy Requests')}
              </h2>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium bg-purple-50 dark:bg-purple-500/10 text-purple-600">
                {gdprRequests.filter((r) => r.status === 'pending').length} {t('kyc.gdprPending', 'pending')}
              </span>
            </div>
            <p className="mb-4 text-xs text-gray-400">
              {t('kyc.gdprSubtitle', 'NDPR / GDPR data subject requests — export and deletion requests from platform users.')}
            </p>

            <div className="space-y-3">
              {gdprRequests.map((req) => {
                const isExport = req.type === 'export';
                const isPending = req.status === 'pending';

                return (
                  <div
                    key={req.id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border ${
                      isPending
                        ? 'border-purple-200 dark:border-purple-500/20 bg-purple-50/50 dark:bg-purple-500/5'
                        : req.status === 'approved'
                          ? 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5'
                          : 'border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      {isExport ? (
                        <Download size={14} className="text-blue-500" />
                      ) : (
                        <Trash2 size={14} className="text-red-500" />
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        isExport
                          ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600'
                          : 'bg-red-50 dark:bg-red-500/10 text-red-600'
                      }`}>
                        {isExport ? t('kyc.gdprExport', 'Data Export') : t('kyc.gdprDeletion', 'Data Deletion')}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-brand-charcoal-dark dark:text-white truncate">
                        {req.userName}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">{req.email}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 italic">{req.reason}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {formatDate(req.submittedAt)}
                      </span>

                      {isPending ? (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => { setActiveKyc(req); gdprApproveAction.execute(); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                          >
                            <CheckCircle2 size={10} /> {t('kyc.gdprApproveBtn', 'Approve')}
                          </button>
                          <button
                            onClick={() => { setActiveKyc(req); gdprDenyAction.execute(); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold bg-red-50 dark:bg-red-500/10 text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                          >
                            <XCircle size={10} /> {t('kyc.gdprDenyBtn', 'Deny')}
                          </button>
                        </div>
                      ) : (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          req.status === 'approved'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-600'
                        }`}>
                          {req.status === 'approved' ? t('kyc.gdprApproved', 'Approved') : t('kyc.gdprDenied', 'Denied')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </RequirePermission>

        {/* ── Confirm modals ───────────────────────────────────── */}
        <ConfirmAction {...approveAction.confirmProps} />
        <ConfirmAction {...rejectAction.confirmProps} />
        <ConfirmAction {...flagRiskAction.confirmProps} />
        <ConfirmAction {...freezeAction.confirmProps} />
        <ConfirmAction {...sanctionsAction.confirmProps} />
        <ConfirmAction {...fileSarAction.confirmProps} />
        <ConfirmAction {...blockJurisdictionAction.confirmProps} />
        <ConfirmAction {...gdprApproveAction.confirmProps} />
        <ConfirmAction {...gdprDenyAction.confirmProps} />
      </div>
    </RequirePermission>
  );
}
