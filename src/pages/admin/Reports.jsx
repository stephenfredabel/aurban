import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Flag, AlertTriangle, MessageSquare, User,
  Clock, CheckCircle2, Shield, AlertCircle,
} from 'lucide-react';
import * as adminService from '../../services/admin.service.js';
import RequirePermission from '../../components/admin/RequirePermission.jsx';
import ConfirmAction from '../../components/admin/ConfirmAction.jsx';
import useAdminAction from '../../hooks/useAdminAction.js';

/* ════════════════════════════════════════════════════════════
   REPORTS — Flagged content & user reports queue
   Route: /admin/reports
════════════════════════════════════════════════════════════ */

/* ── Mock data (dev fallback) ────────────────────────────── */
const MOCK_REPORTS = [
  { id: 'r1', reporter: 'Adaeze Obi',     reportedItem: 'Listing: Luxury Apartment V.I', reportType: 'Scam',         priority: 'high',   status: 'open',        date: '2025-02-10' },
  { id: 'r2', reporter: 'Ibrahim Musa',   reportedItem: 'User: FakeAgent123',            reportType: 'Fake Listing', priority: 'high',   status: 'open',        date: '2025-02-09' },
  { id: 'r3', reporter: 'Chinwe Eze',     reportedItem: 'Listing: Land for Sale Ajah',   reportType: 'Scam',         priority: 'medium', status: 'in_progress', date: '2025-02-08' },
  { id: 'r4', reporter: 'Tunde Bakare',   reportedItem: 'User: Emeka Nwosu',             reportType: 'Harassment',   priority: 'high',   status: 'in_progress', date: '2025-02-07' },
  { id: 'r5', reporter: 'Funke Adeyemi',  reportedItem: 'Listing: Cheap iPhone 15',      reportType: 'Fake Listing', priority: 'low',    status: 'open',        date: '2025-02-06' },
  { id: 'r6', reporter: 'Amina Suleiman', reportedItem: 'User: Oluwaseun Ajayi',         reportType: 'Other',        priority: 'medium', status: 'resolved',    date: '2025-02-05' },
];

const TABS = [
  { id: 'open',        label: 'Open' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'escalated',   label: 'Escalated' },
  { id: 'resolved',    label: 'Resolved' },
];

const PRIORITY_STYLES = {
  high:   { label: 'High',   bg: 'bg-red-50 dark:bg-red-500/10',     text: 'text-red-600',     border: 'border-l-red-500' },
  medium: { label: 'Medium', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600',   border: 'border-l-amber-500' },
  low:    { label: 'Low',    bg: 'bg-gray-100 dark:bg-white/5',      text: 'text-gray-500',    border: 'border-l-gray-400' },
};

const TYPE_STYLES = {
  Scam:           'bg-red-50 dark:bg-red-500/10 text-red-600',
  Harassment:     'bg-purple-50 dark:bg-purple-500/10 text-purple-600',
  'Fake Listing': 'bg-amber-50 dark:bg-amber-500/10 text-amber-600',
  Other:          'bg-gray-100 dark:bg-white/5 text-gray-500',
};

export default function Reports() {
  const { t } = useTranslation('admin');

  const [reports, setReports]     = useState(MOCK_REPORTS);
  const [activeTab, setActiveTab] = useState('open');
  const [resolvingId, setResolvingId] = useState(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [loading, setLoading]     = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    document.title = t('reports.title', 'Reports') + ' — Aurban';
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await adminService.getReports({ page: 1, limit: 50 });
        if (!cancelled && res.success && res.reports?.length) {
          const normalized = res.reports.map((r) => ({
            id: r.id,
            reporter: r.reporter_name || r.reporter || r.reporter_id || 'Unknown',
            reportedItem: r.target_label || r.reportedItem || r.target_id || 'Item',
            reportType: r.type || r.reportType || 'Other',
            priority: r.priority || 'low',
            status: r.status || 'open',
            date: r.created_at ? r.created_at.slice(0, 10) : (r.date || ''),
            raw: r,
          }));
          setReports(normalized);
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

  /* ── Tab counts ─────────────────────────────────────────── */
  const counts = {
    open:        reports.filter((r) => r.status === 'open').length,
    in_progress: reports.filter((r) => r.status === 'in_progress').length,
    escalated:   reports.filter((r) => r.status === 'escalated').length,
    resolved:    reports.filter((r) => r.status === 'resolved').length,
  };

  const filtered = reports.filter((r) => r.status === activeTab);

  /* ── Actions ────────────────────────────────────────────── */
  const handleInvestigate = async (id) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'in_progress' } : r));
    try {
      await adminService.updateReportStatus(id, 'in_progress', { resolution: 'in_progress', notes: '' });
    } catch { /* fallback: local state already updated */ }
  };

  const handleEscalate = async (id) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'escalated' } : r));
    try {
      await adminService.updateReportStatus(id, 'escalated', { resolution: 'escalated', notes: '' });
    } catch { /* fallback: local state already updated */ }
  };

  const handleResolve = async (id) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'resolved' } : r));
    try {
      await adminService.updateReportStatus(id, 'resolved', { resolution: 'resolved', notes: resolveNotes });
    } catch { /* fallback: local state already updated */ }
    setResolvingId(null);
    setResolveNotes('');
  };

  /* ── Admin action for resolve (requires reason) ─────── */
  const resolveAction = useAdminAction({
    permission: 'reports:resolve',
    requireReason: true,
    onExecute: (id) => handleResolve(id),
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
      <div>
        <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
          {t('reports.title', 'Reports & Flagged Content')}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {t('reports.subtitle', 'Investigate and resolve user reports')}
        </p>
      </div>

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => {
          const count  = counts[tab.id];
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-colors whitespace-nowrap shrink-0
                ${active
                  ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
            >
              {t(`reports.tabs.${tab.id}`, tab.label)}
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                  ${active ? 'bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Report cards ─────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-white dark:bg-gray-900 rounded-2xl shadow-card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Flag size={36} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
            {t('reports.empty.title', 'No reports in this queue')}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {t('reports.empty.subtitle', 'All caught up!')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => {
            const priority = PRIORITY_STYLES[report.priority] || PRIORITY_STYLES.low;
            const typeStyle = TYPE_STYLES[report.reportType] || TYPE_STYLES.Other;
            const isHigh = report.priority === 'high';

            return (
              <div
                key={report.id}
                className={`p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5 border-l-4 ${priority.border}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Report info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${typeStyle}`}>
                        {report.reportType}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priority.bg} ${priority.text}`}>
                        {priority.label} Priority
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                      {report.reportedItem}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <User size={11} /> Reported by {report.reporter}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {report.date}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    {report.status === 'open' && (
                      <button
                        onClick={() => handleInvestigate(report.id)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-600 transition-colors bg-blue-50 dark:bg-blue-500/10 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20"
                      >
                        <Shield size={12} /> {t('reports.investigate', 'Investigate')}
                      </button>
                    )}
                    {(report.status === 'open' || report.status === 'in_progress') && (
                      <>
                        <RequirePermission permission="reports:resolve">
                          <button
                            onClick={() => { setResolvingId(resolvingId === report.id ? null : report.id); setResolveNotes(''); }}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-600 transition-colors bg-emerald-50 dark:bg-emerald-500/10 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                          >
                            <CheckCircle2 size={12} /> {t('reports.resolve', 'Resolve')}
                          </button>
                        </RequirePermission>
                        <RequirePermission permission="reports:escalate">
                          <button
                            onClick={() => handleEscalate(report.id)}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-600 transition-colors bg-amber-50 dark:bg-amber-500/10 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/20"
                          >
                            <AlertTriangle size={12} /> {t('reports.escalate', 'Escalate')}
                          </button>
                        </RequirePermission>
                      </>
                    )}
                    {report.status === 'escalated' && (
                      <>
                        <span className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-amber-600">
                          <AlertTriangle size={12} /> {t('reports.escalatedLabel', 'Escalated')}
                        </span>
                        <RequirePermission permission="reports:resolve">
                          <button
                            onClick={() => { setResolvingId(resolvingId === report.id ? null : report.id); setResolveNotes(''); }}
                            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-600 transition-colors bg-emerald-50 dark:bg-emerald-500/10 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                          >
                            <CheckCircle2 size={12} /> {t('reports.resolve', 'Resolve')}
                          </button>
                        </RequirePermission>
                      </>
                    )}
                    {report.status === 'resolved' && (
                      <span className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-emerald-600">
                        <CheckCircle2 size={12} /> {t('reports.resolved', 'Resolved')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Inline resolve notes input */}
                {resolvingId === report.id && (
                  <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      <MessageSquare size={13} />
                      {t('reports.resolveNotesLabel', 'Resolution notes')}
                    </div>
                    <input
                      type="text"
                      value={resolveNotes}
                      onChange={(e) => setResolveNotes(e.target.value)}
                      placeholder={t('reports.resolveNotesPlaceholder', 'Describe the resolution...')}
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-500/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 text-brand-charcoal-dark dark:text-white placeholder-gray-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolve(report.id)}
                        disabled={!resolveNotes.trim()}
                        className="px-4 py-2 text-xs font-bold text-white transition-colors bg-emerald-500 rounded-lg hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {t('reports.confirmResolve', 'Confirm Resolution')}
                      </button>
                      <button
                        onClick={() => { setResolvingId(null); setResolveNotes(''); }}
                        className="px-4 py-2 text-xs font-bold text-gray-500 transition-colors bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100"
                      >
                        {t('common.cancel', 'Cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Confirm modal for resolve action ─────────────────── */}
      <ConfirmAction {...resolveAction.confirmProps} />
    </div>
  );
}
