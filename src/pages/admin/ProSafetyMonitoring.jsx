import { useState, useMemo } from 'react';
import {
  AlertTriangle, Clock, MapPin, Shield,
  Phone, Snowflake, CheckCircle2, Search,
  AlertCircle, Radio, Eye,
} from 'lucide-react';

/* ════════════════════════════════════════════════════════════
   PRO SAFETY MONITORING — Real-time safety for Pro bookings
   Route: /admin/pro-safety
════════════════════════════════════════════════════════════ */

/* ── Mock data ─────────────────────────────────────────────── */
const MOCK_SOS_ALERTS = [
  {
    id: 'sos1', bookingRef: 'PRO-20250301-044', providerName: 'Emeka Nwosu',
    clientName: 'Adaeze Obi', location: '15 Admiralty Way, Lekki Phase 1',
    triggeredAt: '2025-03-01T14:32:00Z', service: 'Electrical Rewiring',
    triggeredBy: 'client', notes: 'Provider became aggressive after dispute over scope',
  },
  {
    id: 'sos2', bookingRef: 'PRO-20250301-051', providerName: 'Tunde Bakare',
    clientName: 'Ibrahim Musa', location: '8 Ozumba Mbadiwe Ave, V.I',
    triggeredAt: '2025-03-01T15:10:00Z', service: 'AC Installation',
    triggeredBy: 'provider', notes: 'Client refused to allow provider to leave premises',
  },
];

const MOCK_ACTIVE_BOOKINGS = [
  {
    id: 'ab1', ref: 'PRO-20250301-040', service: 'Deep Cleaning',
    provider: 'Funke Adeyemi', client: 'Chinwe Eze',
    status: 'in_progress', checkInTime: '09:15 AM', gpsStatus: 'verified',
  },
  {
    id: 'ab2', ref: 'PRO-20250301-041', service: 'Plumbing Repair',
    provider: 'Amina Suleiman', client: 'Oluwaseun Ajayi',
    status: 'checked_in', checkInTime: '10:00 AM', gpsStatus: 'verified',
  },
  {
    id: 'ab3', ref: 'PRO-20250301-042', service: 'Painting — 3 Rooms',
    provider: 'Chukwuemeka Eze', client: 'Tunde Bakare',
    status: 'in_progress', checkInTime: '08:30 AM', gpsStatus: 'verified',
  },
  {
    id: 'ab4', ref: 'PRO-20250301-043', service: 'Tiling — Kitchen',
    provider: 'Ngozi Okafor', client: 'Funke Adeyemi',
    status: 'en_route', checkInTime: '—', gpsStatus: 'pending',
  },
  {
    id: 'ab5', ref: 'PRO-20250301-045', service: 'Generator Servicing',
    provider: 'Ibrahim Musa', client: 'Amina Suleiman',
    status: 'checked_in', checkInTime: '11:45 AM', gpsStatus: 'verified',
  },
  {
    id: 'ab6', ref: 'PRO-20250301-046', service: 'Fumigation',
    provider: 'Adaeze Obi', client: 'Chukwuemeka Eze',
    status: 'en_route', checkInTime: '—', gpsStatus: 'failed',
  },
];

const MOCK_INCIDENTS = [
  { id: 'inc1', date: '2025-02-28', type: 'SOS',      bookingRef: 'PRO-20250228-033', outcome: 'Resolved — provider removed', resolvedBy: 'Admin Kemi' },
  { id: 'inc2', date: '2025-02-25', type: 'GPS_fail',  bookingRef: 'PRO-20250225-028', outcome: 'Manual check-in approved', resolvedBy: 'Admin Tayo' },
  { id: 'inc3', date: '2025-02-20', type: 'no_show',   bookingRef: 'PRO-20250220-019', outcome: 'Penalty applied to provider', resolvedBy: 'System' },
  { id: 'inc4', date: '2025-02-15', type: 'SOS',       bookingRef: 'PRO-20250215-012', outcome: 'False alarm — resolved amicably', resolvedBy: 'Admin Kemi' },
  { id: 'inc5', date: '2025-02-10', type: 'GPS_fail',  bookingRef: 'PRO-20250210-005', outcome: 'Booking cancelled, refund issued', resolvedBy: 'Admin Tayo' },
];

const STAT_CARDS = [
  { key: 'activeSOS',      label: 'Active SOS',         value: 2,  icon: AlertTriangle, color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-500/10',       pulse: true },
  { key: 'activeBookings', label: 'Active Bookings',    value: 15, icon: Clock,         color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-500/10',     pulse: false },
  { key: 'gpsVerified',    label: 'GPS Verified',       value: 12, icon: MapPin,        color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', pulse: false },
  { key: 'incidents30d',   label: 'Incidents (30d)',    value: 3,  icon: Shield,        color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-500/10',   pulse: false },
];

const TABS = [
  { id: 'sos',       label: 'Active SOS' },
  { id: 'bookings',  label: 'Active Bookings' },
  { id: 'incidents', label: 'Incident Log' },
];

const GPS_STYLES = {
  verified: { label: 'Verified', bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600' },
  pending:  { label: 'Pending',  bg: 'bg-amber-50 dark:bg-amber-500/10',     text: 'text-amber-600' },
  failed:   { label: 'Failed',   bg: 'bg-red-50 dark:bg-red-500/10',         text: 'text-red-600' },
};

const BOOKING_STATUS_STYLES = {
  in_progress: { label: 'In Progress', bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600' },
  checked_in:  { label: 'Checked In',  bg: 'bg-teal-50 dark:bg-teal-500/10',     text: 'text-teal-600' },
  en_route:    { label: 'En Route',    bg: 'bg-indigo-50 dark:bg-indigo-500/10', text: 'text-indigo-600' },
};

const INCIDENT_TYPE_STYLES = {
  SOS:      { label: 'SOS',       bg: 'bg-red-50 dark:bg-red-500/10',    text: 'text-red-600' },
  GPS_fail: { label: 'GPS Fail',  bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600' },
  no_show:  { label: 'No-Show',   bg: 'bg-purple-50 dark:bg-purple-500/10', text: 'text-purple-600' },
};

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════ */
export default function ProSafetyMonitoring() {
  const [activeTab, setActiveTab]     = useState('sos');
  const [sosAlerts, setSosAlerts]     = useState(MOCK_SOS_ALERTS);
  const [bookings]                    = useState(MOCK_ACTIVE_BOOKINGS);
  const [incidents]                   = useState(MOCK_INCIDENTS);
  const [search, setSearch]           = useState('');

  /* ── Search filter for bookings / incidents ────────────── */
  const filteredBookings = useMemo(() => {
    if (!search.trim()) return bookings;
    const q = search.toLowerCase();
    return bookings.filter((b) =>
      b.ref.toLowerCase().includes(q) ||
      b.service.toLowerCase().includes(q) ||
      b.provider.toLowerCase().includes(q) ||
      b.client.toLowerCase().includes(q)
    );
  }, [bookings, search]);

  const filteredIncidents = useMemo(() => {
    if (!search.trim()) return incidents;
    const q = search.toLowerCase();
    return incidents.filter((inc) =>
      inc.bookingRef.toLowerCase().includes(q) ||
      inc.type.toLowerCase().includes(q) ||
      inc.outcome.toLowerCase().includes(q)
    );
  }, [incidents, search]);

  /* ── SOS actions ───────────────────────────────────────── */
  const handleResolveSOS = (id) => {
    setSosAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleFreezeSOS = (id) => {
    setSosAlerts((prev) => prev.map((a) => a.id === id ? { ...a, notes: a.notes + ' [BOOKING FROZEN]' } : a));
  };

  return (
    <div className="pb-8 space-y-5">
      {/* ── Header ───────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
          Pro Safety Monitoring
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Real-time safety oversight for active Pro bookings
        </p>
      </div>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {STAT_CARDS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
              <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-2 ${s.pulse ? 'animate-pulse' : ''}`}>
                <Icon size={16} className={s.color} />
              </div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-lg font-extrabold text-brand-charcoal-dark dark:text-white">{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* ── Search ───────────────────────────────────────────── */}
      <div className="relative">
        <Search size={16} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
        <input
          type="text"
          placeholder="Search bookings, references, providers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full py-2.5 pl-10 pr-4 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/40 text-brand-charcoal-dark dark:text-white placeholder-gray-400"
        />
      </div>

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
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
              {tab.label}
              {tab.id === 'sos' && sosAlerts.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-red-500 text-white rounded-full">
                  {sosAlerts.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════
          ACTIVE SOS TAB
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'sos' && (
        <div className="space-y-4">
          {sosAlerts.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle2 size={36} className="mx-auto mb-3 text-emerald-400" />
              <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">No active SOS alerts</p>
              <p className="mt-1 text-xs text-gray-400">All clear — no safety incidents in progress</p>
            </div>
          ) : (
            sosAlerts.map((sos) => (
              <div
                key={sos.id}
                className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5 ring-2 ring-red-300 dark:ring-red-500/40"
              >
                {/* Pulsing header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex w-full h-full rounded-full opacity-75 bg-red-400 animate-ping" />
                    <span className="relative inline-flex w-3 h-3 rounded-full bg-red-500" />
                  </span>
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wider">SOS Alert — Active</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400">Booking Ref</p>
                    <p className="text-sm font-mono font-bold text-brand-charcoal-dark dark:text-white">{sos.bookingRef}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400">Service</p>
                    <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">{sos.service}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400">Provider</p>
                    <p className="text-sm text-brand-charcoal-dark dark:text-white">{sos.providerName}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400">Client</p>
                    <p className="text-sm text-brand-charcoal-dark dark:text-white">{sos.clientName}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400">Location</p>
                    <p className="text-sm text-brand-charcoal-dark dark:text-white flex items-center gap-1">
                      <MapPin size={12} className="text-red-500" /> {sos.location}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-gray-400">Triggered</p>
                    <p className="text-sm text-brand-charcoal-dark dark:text-white">
                      {formatTime(sos.triggeredAt)} by <span className="font-semibold capitalize">{sos.triggeredBy}</span>
                    </p>
                  </div>
                </div>

                {sos.notes && (
                  <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-500/10 rounded-xl">
                    <p className="text-xs text-red-600 dark:text-red-400">{sos.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
                  <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-500 rounded-xl hover:bg-emerald-600 transition-colors">
                    <Phone size={12} /> Call Provider
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors">
                    <Phone size={12} /> Call Client
                  </button>
                  <button
                    onClick={() => handleFreezeSOS(sos.id)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-500/10 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                  >
                    <Snowflake size={12} /> Freeze Booking
                  </button>
                  <button
                    onClick={() => handleResolveSOS(sos.id)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-brand-charcoal-dark dark:text-white bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  >
                    <CheckCircle2 size={12} /> Resolve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          ACTIVE BOOKINGS TAB
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'bookings' && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5">
                {['Ref', 'Service', 'Provider', 'Client', 'Status', 'Check-in', 'GPS Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredBookings.map((b) => {
                const statusDef = BOOKING_STATUS_STYLES[b.status] || BOOKING_STATUS_STYLES.in_progress;
                const gpsDef = GPS_STYLES[b.gpsStatus] || GPS_STYLES.pending;
                return (
                  <tr key={b.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">{b.ref}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-brand-charcoal-dark dark:text-white whitespace-nowrap">{b.service}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{b.provider}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{b.client}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${statusDef.bg} ${statusDef.text}`}>
                        {statusDef.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{b.checkInTime}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium flex items-center gap-1 w-fit ${gpsDef.bg} ${gpsDef.text}`}>
                        <MapPin size={10} /> {gpsDef.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          INCIDENT LOG TAB
      ═══════════════════════════════════════════════════════ */}
      {activeTab === 'incidents' && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/10">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5">
                {['Date', 'Type', 'Booking Ref', 'Outcome', 'Resolved By'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredIncidents.map((inc) => {
                const typeDef = INCIDENT_TYPE_STYLES[inc.type] || INCIDENT_TYPE_STYLES.SOS;
                return (
                  <tr key={inc.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{inc.date}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${typeDef.bg} ${typeDef.text}`}>
                        {typeDef.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">{inc.bookingRef}</td>
                    <td className="px-4 py-3 text-xs text-brand-charcoal-dark dark:text-white">{inc.outcome}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">{inc.resolvedBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Info banner ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
        <AlertCircle size={14} className="shrink-0" />
        Safety monitoring data is mock. In production, this connects to real-time GPS and SOS systems.
      </div>
    </div>
  );
}
