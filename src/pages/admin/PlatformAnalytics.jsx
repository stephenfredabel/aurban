import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Users, User, Package, Calendar,
  Wallet, MapPin, BarChart2, Eye, Globe, ShoppingCart,
  Clock, DollarSign, Activity, UserPlus, Repeat,
  Smartphone, Monitor, ArrowUpRight, Download,
  Home, Briefcase, Star, MessageSquare, CreditCard,
  ShieldCheck, AlertCircle, Target, Lightbulb,
  CheckCircle2, XCircle, Zap, Info,
  RefreshCw, Radio, Search, Award, Trophy,
  ArrowDownRight,
} from 'lucide-react';
import * as competitiveService from '../../services/competitive.service.js';
import RequirePermission from '../../components/admin/RequirePermission.jsx';

/* ════════════════════════════════════════════════════════════
   PLATFORM ANALYTICS — Global insights dashboard
   Route: /provider/analytics

   Tabs:
   • Overview — KPIs, growth metrics, platform health
   • Users & Visitors — signups, DAU/MAU, retention, devices
   • Providers — listings, revenue, top providers
   • Financial — GMV, commissions, payouts, Paystack
   • Marketplace — categories, locations, search trends

   Matching: Jumia, Amazon, Airbnb-level platform analytics
   Nigeria-first: NGN currency, Nigerian cities, Paystack
════════════════════════════════════════════════════════════ */

/* ── Mock data: comprehensive platform metrics ──────────── */
const MOCK = {
  '7d': {
    // Overview KPIs
    totalUsers: 28450, newUsers: 324, dau: 4820, mau: 18200, dauMauRatio: '26.5%',
    totalListings: 12890, activeListings: 8420, newListings: 89,
    totalBookings: 1245, newBookings: 45, avgBookingValue: '₦285K',
    gmv: '₦34.2M', revenue: '₦1.71M', commissionRate: '5%',
    pageViews: 485000, uniqueVisitors: 142000, bounceRate: '34.2%', avgSessionDuration: '4m 38s',
    // Trends
    usersTrend: '+12%', listingsTrend: '+8%', bookingsTrend: '+15%', revenueTrend: '+22%',
    trafficTrend: '+18%', conversionTrend: '+5%',
    usersUp: true, listingsUp: true, bookingsUp: true, revenueUp: true,
  },
  '30d': {
    totalUsers: 28450, newUsers: 1245, dau: 5100, mau: 18200, dauMauRatio: '28.0%',
    totalListings: 12890, activeListings: 8420, newListings: 342,
    totalBookings: 4850, newBookings: 187, avgBookingValue: '₦312K',
    gmv: '₦142M', revenue: '₦7.1M', commissionRate: '5%',
    pageViews: 2100000, uniqueVisitors: 580000, bounceRate: '32.1%', avgSessionDuration: '5m 12s',
    usersTrend: '+18%', listingsTrend: '+12%', bookingsTrend: '+9%', revenueTrend: '+28%',
    trafficTrend: '+25%', conversionTrend: '+8%',
    usersUp: true, listingsUp: true, bookingsUp: true, revenueUp: true,
  },
  '90d': {
    totalUsers: 28450, newUsers: 3890, dau: 4500, mau: 18200, dauMauRatio: '24.7%',
    totalListings: 12890, activeListings: 8420, newListings: 987,
    totalBookings: 15200, newBookings: 534, avgBookingValue: '₦298K',
    gmv: '₦425M', revenue: '₦21.25M', commissionRate: '5%',
    pageViews: 6800000, uniqueVisitors: 1900000, bounceRate: '35.8%', avgSessionDuration: '4m 15s',
    usersTrend: '+25%', listingsTrend: '-3%', bookingsTrend: '+14%', revenueTrend: '+35%',
    trafficTrend: '+30%', conversionTrend: '+2%',
    usersUp: true, listingsUp: false, bookingsUp: true, revenueUp: true,
  },
};

const MOCK_SIGNUP_CHART = [
  { label: 'Mon', users: 42, providers: 8 },
  { label: 'Tue', users: 58, providers: 12 },
  { label: 'Wed', users: 35, providers: 6 },
  { label: 'Thu', users: 67, providers: 15 },
  { label: 'Fri', users: 52, providers: 10 },
  { label: 'Sat', users: 38, providers: 5 },
  { label: 'Sun', users: 32, providers: 3 },
];

const MOCK_TRAFFIC_CHART = [
  { label: '12am', value: 1200 }, { label: '4am', value: 450 }, { label: '8am', value: 8500 },
  { label: '12pm', value: 12400 }, { label: '4pm', value: 9800 }, { label: '8pm', value: 14200 },
  { label: '11pm', value: 5600 },
];

const MOCK_LOCATIONS = [
  { name: 'Lagos',         users: 12400, listings: 5420, bookings: 890, revenue: '₦89M',  pct: 42 },
  { name: 'Abuja',         users: 6200,  listings: 2890, bookings: 420, revenue: '₦42M',  pct: 22 },
  { name: 'Port Harcourt', users: 3400,  listings: 1540, bookings: 210, revenue: '₦21M',  pct: 12 },
  { name: 'Ibadan',        users: 2200,  listings: 980,  bookings: 145, revenue: '₦14M',  pct: 8 },
  { name: 'Enugu',         users: 1500,  listings: 650,  bookings: 98,  revenue: '₦9.8M', pct: 5 },
  { name: 'Kano',          users: 1200,  listings: 420,  bookings: 65,  revenue: '₦6.5M', pct: 4 },
  { name: 'Others',        users: 1550,  listings: 990,  bookings: 117, revenue: '₦11.7M', pct: 7 },
];

const MOCK_CATEGORIES = [
  { name: 'Rentals',       count: 4250, bookings: 680, avgPrice: '₦1.8M/yr', pct: 33, color: 'bg-blue-500' },
  { name: 'Sales',         count: 2890, bookings: 210, avgPrice: '₦45M',     pct: 22, color: 'bg-emerald-500' },
  { name: 'Shortlet',      count: 1680, bookings: 420, avgPrice: '₦85K/nt',  pct: 13, color: 'bg-purple-500' },
  { name: 'Land',          count: 1540, bookings: 95,  avgPrice: '₦15M',     pct: 12, color: 'bg-amber-500' },
  { name: 'Services',      count: 1380, bookings: 320, avgPrice: '₦45K',     pct: 11, color: 'bg-rose-500' },
  { name: 'Shared Living', count: 750,  bookings: 180, avgPrice: '₦450K/yr', pct: 6,  color: 'bg-teal-500' },
  { name: 'Marketplace',   count: 400,  bookings: 95,  avgPrice: '₦12K',     pct: 3,  color: 'bg-orange-500' },
];

const MOCK_TOP_PROVIDERS = [
  { name: 'Seun Ajayi Realty',    listings: 20, bookings: 45, revenue: '₦12.8M', rating: 4.9, verified: true },
  { name: 'Tunde Properties',      listings: 8,  bookings: 32, revenue: '₦8.5M',  rating: 4.7, verified: true },
  { name: 'LekStay Shortlets',     listings: 15, bookings: 89, revenue: '₦6.2M',  rating: 4.8, verified: true },
  { name: 'Abuja Home Finders',    listings: 12, bookings: 28, revenue: '₦5.4M',  rating: 4.5, verified: true },
  { name: 'QuickFix NG',           listings: 5,  bookings: 120, revenue: '₦3.8M', rating: 4.6, verified: false },
];

const MOCK_DEVICES = { desktop: 38, mobile: 54, tablet: 8 };
const MOCK_USER_TYPES = { users: 68, providers: 18, guests: 14 };
const MOCK_FINANCIAL = {
  totalGMV: '₦425M', totalCommissions: '₦21.25M', totalPayouts: '₦380M',
  pendingPayouts: '₦12.4M', escrowHeld: '₦8.6M', refundsProcessed: '₦2.1M',
  avgTransactionSize: '₦285K', successfulPayments: 4850, failedPayments: 42,
  paystackFees: '₦3.2M', netRevenue: '₦18.05M',
  revenueByMonth: [
    { month: 'Sep', value: 4.2 }, { month: 'Oct', value: 5.1 }, { month: 'Nov', value: 5.8 },
    { month: 'Dec', value: 7.2 }, { month: 'Jan', value: 6.8 }, { month: 'Feb', value: 7.1 },
  ],
};

/* ── Competitive sub-tabs ─────────────────────────────────── */
const COMP_SUB_TABS = [
  { id: 'livePulse',   label: 'Live Pulse',         icon: Radio },
  { id: 'search',      label: 'Search & Discovery',  icon: Search },
  { id: 'traffic',     label: 'Traffic Sources',      icon: Globe },
  { id: 'social',      label: 'Social & App',         icon: Smartphone },
  { id: 'competitors', label: 'Competitors',          icon: Target },
  { id: 'globalRank',  label: 'Global Rank',          icon: Star },
];

const TABS = [
  { id: 'overview',    label: 'Overview',       icon: BarChart2 },
  { id: 'users',       label: 'Users & Traffic', icon: Users },
  { id: 'providers',   label: 'Providers',      icon: Home },
  { id: 'financial',   label: 'Financial',      icon: DollarSign },
  { id: 'marketplace', label: 'Marketplace',    icon: ShoppingCart },
  { id: 'competitive', label: 'Competitive',   icon: Target },
];

function TrendBadge({ trend, up }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${up ? 'text-emerald-500' : 'text-red-500'}`}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {trend}
    </span>
  );
}

function StatCard({ label, value, trend, up, icon: Icon, color, bg, sub }) {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
      <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}>
        <Icon size={16} className={color} />
      </div>
      <p className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">{value}</p>
      <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
      {trend && <div className="mt-1.5"><TrendBadge trend={trend} up={up} /></div>}
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function BarChartSimple({ data, labelKey = 'label', valueKey = 'value', secondKey, barColor = 'bg-brand-gold/60', secondColor = 'bg-blue-400/60', title, subtitle }) {
  const max = Math.max(...data.map(d => d[valueKey] + (secondKey ? d[secondKey] || 0 : 0)));
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
          <BarChart2 size={14} className="text-brand-gold" /> {title}
        </h3>
        {subtitle && <span className="text-[10px] text-gray-400">{subtitle}</span>}
      </div>
      <div className="space-y-2">
        {data.map(d => (
          <div key={d[labelKey]} className="flex items-center gap-3">
            <span className="w-8 text-xs font-medium text-gray-400 shrink-0">{d[labelKey]}</span>
            <div className="flex-1 h-6 overflow-hidden bg-gray-100 rounded-lg dark:bg-white/5 flex">
              <div className={`h-full rounded-l-lg ${barColor} hover:opacity-80 transition-opacity`}
                style={{ width: `${max > 0 ? (d[valueKey] / max) * 100 : 0}%` }} />
              {secondKey && d[secondKey] > 0 && (
                <div className={`h-full ${secondColor} hover:opacity-80 transition-opacity`}
                  style={{ width: `${max > 0 ? (d[secondKey] / max) * 100 : 0}%` }} />
              )}
            </div>
            <span className="text-xs font-bold text-brand-charcoal-dark dark:text-white w-10 text-right">
              {(d[valueKey] + (secondKey ? d[secondKey] || 0 : 0)).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      {secondKey && (
        <div className="flex items-center gap-4 mt-3 text-[10px] text-gray-400">
          <span className="flex items-center gap-1"><span className={`w-2.5 h-2.5 rounded-sm ${barColor.replace('/60', '')}`} /> Users</span>
          <span className="flex items-center gap-1"><span className={`w-2.5 h-2.5 rounded-sm ${secondColor.replace('/60', '')}`} /> Providers</span>
        </div>
      )}
    </div>
  );
}

/* ── Last Updated bar (competitive live indicator) ──────────── */
function LastUpdatedBar({ lastUpdated, countdown, autoRefresh, onToggleAutoRefresh, onRefresh, loading }) {
  const ago = lastUpdated ? `${Math.max(0, Math.floor((Date.now() - lastUpdated.getTime()) / 60000))}m ago` : 'never';
  const mm = Math.floor(countdown / 60);
  const ss = String(countdown % 60).padStart(2, '0');
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl text-xs text-gray-500">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
        <span>Last updated: {ago}</span>
        {autoRefresh && <span className="text-gray-400">| Next: {mm}:{ss}</span>}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onToggleAutoRefresh}
          className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
            autoRefresh ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-gray-100 dark:bg-white/10 text-gray-400'
          }`}>
          {autoRefresh ? 'Auto ON' : 'Auto OFF'}
        </button>
        <button onClick={onRefresh} disabled={loading}
          className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 rounded-lg text-[10px] font-semibold text-brand-charcoal-dark dark:text-white shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>
    </div>
  );
}

export default function PlatformAnalytics() {
  const [period, setPeriod] = useState('30d');
  const [tab, setTab]       = useState('overview');
  const [loading, setLoading] = useState(true);

  /* ── Competitive intelligence state ──────────────────────── */
  const [compSubTab, setCompSubTab] = useState('livePulse');
  const [compData, setCompData] = useState({});
  const [compLoading, setCompLoading] = useState(false);
  const [compLastUpdated, setCompLastUpdated] = useState(null);
  const [compAutoRefresh, setCompAutoRefresh] = useState(true);
  const [compCountdown, setCompCountdown] = useState(300);

  const fetchCompetitiveData = useCallback(async () => {
    setCompLoading(true);
    try {
      const serviceFn = {
        livePulse: competitiveService.getAurbanWebPresence,
        search: competitiveService.getSearchIntelligence,
        traffic: competitiveService.getTrafficSources,
        social: competitiveService.getSocialMediaMetrics,
        competitors: competitiveService.getCompetitorComparison,
        globalRank: competitiveService.getGlobalRanking,
      }[compSubTab];
      if (serviceFn) {
        const res = await serviceFn();
        if (res.success) {
          setCompData(prev => ({ ...prev, [compSubTab]: res }));
          setCompLastUpdated(new Date());
        }
      }
    } catch { /* service handles fallback */ }
    finally { setCompLoading(false); setCompCountdown(300); }
  }, [compSubTab]);

  useEffect(() => {
    if (tab === 'competitive') fetchCompetitiveData();
  }, [tab, compSubTab, fetchCompetitiveData]);

  useEffect(() => {
    if (tab !== 'competitive' || !compAutoRefresh) return;
    const iv = setInterval(() => {
      setCompCountdown(prev => {
        if (prev <= 1) { fetchCompetitiveData(); return 300; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [tab, compAutoRefresh, fetchCompetitiveData]);

  useEffect(() => { document.title = 'Platform Analytics — Aurban'; }, []);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [period, tab]);

  const s = MOCK[period] || MOCK['30d'];
  const maxTraffic = Math.max(...MOCK_TRAFFIC_CHART.map(d => d.value));
  const maxRevMonth = Math.max(...MOCK_FINANCIAL.revenueByMonth.map(d => d.value));

  return (
    <div className="pb-8 space-y-5">

      {/* ── Header + Period + Tab ──────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">Platform Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">Global performance insights across all verticals</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
            {[{ id: '7d', label: '7D' }, { id: '30d', label: '30D' }, { id: '90d', label: '90D' }].map(p => (
              <button key={p.id} onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p.id ? 'bg-white dark:bg-gray-800 text-brand-charcoal-dark dark:text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}>{p.label}</button>
            ))}
          </div>
          <RequirePermission permission="analytics:export">
            <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-brand-charcoal-dark dark:text-white">
              <Download size={13} /> Export
            </button>
          </RequirePermission>
        </div>
      </div>

      {/* ── Tab navigation ─────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              tab === t.id ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'
            }`}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-gray-900 rounded-2xl shadow-card animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════
              OVERVIEW TAB
          ═══════════════════════════════════════════════════ */}
          {tab === 'overview' && (
            <div className="space-y-5">
              {/* Top KPIs */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total Users" value={s.totalUsers.toLocaleString()} trend={s.usersTrend} up={s.usersUp} icon={Users} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
                <StatCard label="Active Listings" value={s.activeListings.toLocaleString()} trend={s.listingsTrend} up={s.listingsUp} icon={Package} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
                <StatCard label="Bookings" value={s.newBookings.toLocaleString()} trend={s.bookingsTrend} up={s.bookingsUp} icon={Calendar} color="text-purple-500" bg="bg-purple-50 dark:bg-purple-500/10" sub={`Avg: ${s.avgBookingValue}`} />
                <RequirePermission permission="analytics:view_revenue">
                  <StatCard label="Revenue" value={s.revenue} trend={s.revenueTrend} up={s.revenueUp} icon={Wallet} color="text-brand-gold" bg="bg-yellow-50 dark:bg-yellow-500/10" sub={`GMV: ${s.gmv}`} />
                </RequirePermission>
              </div>

              {/* Second row */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Page Views" value={(s.pageViews / 1000).toFixed(0) + 'K'} trend={s.trafficTrend} up={true} icon={Eye} color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-500/10" />
                <StatCard label="Unique Visitors" value={(s.uniqueVisitors / 1000).toFixed(0) + 'K'} icon={Globe} color="text-teal-500" bg="bg-teal-50 dark:bg-teal-500/10" />
                <StatCard label="DAU / MAU" value={s.dauMauRatio} icon={Activity} color="text-orange-500" bg="bg-orange-50 dark:bg-orange-500/10" sub={`${s.dau.toLocaleString()} DAU`} />
                <StatCard label="Bounce Rate" value={s.bounceRate} icon={ArrowUpRight} color="text-rose-500" bg="bg-rose-50 dark:bg-rose-500/10" sub={`Avg: ${s.avgSessionDuration}`} />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <BarChartSimple data={MOCK_SIGNUP_CHART} valueKey="users" secondKey="providers" title="Daily Signups" subtitle="Last 7 days" />

                {/* Traffic by hour */}
                <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
                  <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                    <Activity size={14} className="text-brand-gold" /> Traffic by Hour
                  </h3>
                  <div className="flex items-end h-32 gap-2">
                    {MOCK_TRAFFIC_CHART.map(d => (
                      <div key={d.label} className="flex flex-col items-center flex-1 gap-1">
                        <div className="relative w-full transition-all rounded-t-lg bg-indigo-400/30 hover:bg-indigo-400/50 group"
                          style={{ height: `${maxTraffic > 0 ? (d.value / maxTraffic) * 100 : 0}%` }}>
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {d.value.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[9px] text-gray-400">{d.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top locations */}
              <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
                <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                  <MapPin size={14} className="text-brand-gold" /> Top Locations
                </h3>
                <div className="space-y-3">
                  {MOCK_LOCATIONS.map(loc => (
                    <div key={loc.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{loc.name}</span>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>{loc.users.toLocaleString()} users</span>
                          <span>{loc.listings.toLocaleString()} listings</span>
                          <span className="font-bold text-brand-charcoal-dark dark:text-white">{loc.pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 overflow-hidden bg-gray-100 rounded-full dark:bg-white/5">
                        <div className="h-full rounded-full bg-brand-gold/60 transition-all duration-500" style={{ width: `${loc.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              USERS & TRAFFIC TAB
          ═══════════════════════════════════════════════════ */}
          {tab === 'users' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total Users" value={s.totalUsers.toLocaleString()} trend={s.usersTrend} up={s.usersUp} icon={Users} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
                <StatCard label="New Signups" value={s.newUsers.toLocaleString()} icon={UserPlus} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" sub={`${period} period`} />
                <StatCard label="DAU" value={s.dau.toLocaleString()} icon={Activity} color="text-purple-500" bg="bg-purple-50 dark:bg-purple-500/10" sub={`MAU: ${s.mau.toLocaleString()}`} />
                <StatCard label="DAU/MAU Ratio" value={s.dauMauRatio} icon={Repeat} color="text-orange-500" bg="bg-orange-50 dark:bg-orange-500/10" sub="User stickiness" />
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <BarChartSimple data={MOCK_SIGNUP_CHART} valueKey="users" secondKey="providers" title="Daily Signups (Users vs Providers)" subtitle="Last 7 days" />

                {/* Device breakdown */}
                <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
                  <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                    <Smartphone size={14} className="text-brand-gold" /> Device Breakdown
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'Mobile', value: MOCK_DEVICES.mobile, icon: Smartphone, color: 'bg-blue-500' },
                      { label: 'Desktop', value: MOCK_DEVICES.desktop, icon: Monitor, color: 'bg-emerald-500' },
                      { label: 'Tablet', value: MOCK_DEVICES.tablet, icon: Monitor, color: 'bg-purple-500' },
                    ].map(d => (
                      <div key={d.label} className="flex items-center gap-3">
                        <d.icon size={16} className="text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 w-16">{d.label}</span>
                        <div className="flex-1 h-6 overflow-hidden bg-gray-100 rounded-lg dark:bg-white/5">
                          <div className={`h-full rounded-lg ${d.color}/40`} style={{ width: `${d.value}%` }} />
                        </div>
                        <span className="text-sm font-bold text-brand-charcoal-dark dark:text-white w-10 text-right">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* User type breakdown */}
              <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
                <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                  <Users size={14} className="text-brand-gold" /> Traffic by User Type
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Registered Users', pct: MOCK_USER_TYPES.users, count: Math.round(s.uniqueVisitors * MOCK_USER_TYPES.users / 100), color: 'bg-blue-500', icon: User },
                    { label: 'Providers', pct: MOCK_USER_TYPES.providers, count: Math.round(s.uniqueVisitors * MOCK_USER_TYPES.providers / 100), color: 'bg-emerald-500', icon: Briefcase },
                    { label: 'Guest Visitors', pct: MOCK_USER_TYPES.guests, count: Math.round(s.uniqueVisitors * MOCK_USER_TYPES.guests / 100), color: 'bg-gray-400', icon: Globe },
                  ].map(t => (
                    <div key={t.label} className="text-center p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <t.icon size={20} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-2xl font-bold font-display text-brand-charcoal-dark dark:text-white">{t.pct}%</p>
                      <p className="text-[11px] text-gray-400 mt-1">{t.label}</p>
                      <p className="text-[10px] text-gray-400">{t.count.toLocaleString()} visitors</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Traffic metrics */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Page Views" value={(s.pageViews / 1000).toFixed(0) + 'K'} icon={Eye} color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-500/10" />
                <StatCard label="Bounce Rate" value={s.bounceRate} icon={ArrowUpRight} color="text-rose-500" bg="bg-rose-50 dark:bg-rose-500/10" />
                <StatCard label="Avg Session" value={s.avgSessionDuration} icon={Clock} color="text-teal-500" bg="bg-teal-50 dark:bg-teal-500/10" />
                <StatCard label="Conversion" value="3.2%" trend={s.conversionTrend} up={true} icon={ShoppingCart} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-500/10" />
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              PROVIDERS TAB
          ═══════════════════════════════════════════════════ */}
          {tab === 'providers' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total Providers" value="2,480" trend="+14%" up={true} icon={Home} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
                <StatCard label="Verified" value="1,890" icon={ShieldCheck} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" sub="76% verification rate" />
                <StatCard label="Active Listings" value={s.activeListings.toLocaleString()} icon={Package} color="text-purple-500" bg="bg-purple-50 dark:bg-purple-500/10" sub={`${(s.activeListings / 2480).toFixed(1)} avg per provider`} />
                <StatCard label="Provider Revenue" value="₦380M" icon={Wallet} color="text-brand-gold" bg="bg-yellow-50 dark:bg-yellow-500/10" sub="Total payouts (90d)" />
              </div>

              {/* Top providers */}
              <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
                <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                  <Star size={14} className="text-brand-gold" /> Top Providers (by Revenue)
                </h3>
                <div className="space-y-3">
                  {MOCK_TOP_PROVIDERS.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-gold/10 text-brand-gold text-sm font-bold shrink-0">
                        #{i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-brand-charcoal-dark dark:text-white truncate">{p.name}</span>
                          {p.verified && <ShieldCheck size={12} className="text-emerald-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-400">
                          <span>{p.listings} listings</span>
                          <span>{p.bookings} bookings</span>
                          <span className="flex items-center gap-0.5"><Star size={10} className="text-brand-gold" /> {p.rating}</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-brand-charcoal-dark dark:text-white shrink-0">{p.revenue}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Provider metrics */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Avg Response Time" value="2.1 hrs" icon={Clock} color="text-teal-500" bg="bg-teal-50 dark:bg-teal-500/10" />
                <StatCard label="Avg Rating" value="4.6" icon={Star} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-500/10" sub="Across 2,480 providers" />
                <StatCard label="New This Period" value="142" icon={UserPlus} color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-500/10" />
                <StatCard label="Messages Sent" value="8,450" icon={MessageSquare} color="text-rose-500" bg="bg-rose-50 dark:bg-rose-500/10" />
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              FINANCIAL TAB
          ═══════════════════════════════════════════════════ */}
          {tab === 'financial' && (
            <RequirePermission permission="analytics:view_revenue" fallback={
              <div className="p-10 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                <DollarSign size={40} className="mx-auto mb-4 text-gray-200 dark:text-gray-700" />
                <p className="font-semibold text-brand-charcoal-dark dark:text-white">Access Restricted</p>
                <p className="mt-1 text-sm text-gray-400">Financial analytics require revenue viewing permission.</p>
              </div>
            }>
              <div className="space-y-5">
                {/* Revenue headline */}
                <div className="p-5 text-white bg-brand-charcoal-dark rounded-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={16} className="text-brand-gold" />
                    <span className="text-xs tracking-wider text-gray-400 uppercase">Total GMV (90 days)</span>
                  </div>
                  <p className="text-3xl font-bold font-display">{MOCK_FINANCIAL.totalGMV}</p>
                  <div className="flex items-center gap-6 mt-3 text-sm text-gray-400">
                    <span>Commission: {MOCK_FINANCIAL.totalCommissions}</span>
                    <span>Paystack Fees: {MOCK_FINANCIAL.paystackFees}</span>
                    <span className="text-emerald-400 font-semibold">Net: {MOCK_FINANCIAL.netRevenue}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatCard label="Total Payouts" value={MOCK_FINANCIAL.totalPayouts} icon={Wallet} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
                  <StatCard label="Pending Payouts" value={MOCK_FINANCIAL.pendingPayouts} icon={Clock} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-500/10" />
                  <StatCard label="Escrow Held" value={MOCK_FINANCIAL.escrowHeld} icon={CreditCard} color="text-purple-500" bg="bg-purple-50 dark:bg-purple-500/10" />
                  <StatCard label="Refunds" value={MOCK_FINANCIAL.refundsProcessed} icon={Repeat} color="text-rose-500" bg="bg-rose-50 dark:bg-rose-500/10" />
                </div>

                {/* Revenue chart */}
                <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
                  <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                    <TrendingUp size={14} className="text-brand-gold" /> Monthly Revenue (₦M)
                  </h3>
                  <div className="flex items-end h-40 gap-3">
                    {MOCK_FINANCIAL.revenueByMonth.map(d => (
                      <div key={d.month} className="flex flex-col items-center flex-1 gap-1">
                        <div className="relative w-full transition-all rounded-t-lg bg-emerald-400/30 hover:bg-emerald-400/50 group"
                          style={{ height: `${maxRevMonth > 0 ? (d.value / maxRevMonth) * 100 : 0}%` }}>
                          <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            ₦{d.value}M
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400">{d.month}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <StatCard label="Avg Transaction" value={MOCK_FINANCIAL.avgTransactionSize} icon={CreditCard} color="text-teal-500" bg="bg-teal-50 dark:bg-teal-500/10" />
                  <StatCard label="Successful Payments" value={MOCK_FINANCIAL.successfulPayments.toLocaleString()} icon={ShieldCheck} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
                  <StatCard label="Failed Payments" value={MOCK_FINANCIAL.failedPayments.toString()} icon={AlertCircle} color="text-red-500" bg="bg-red-50 dark:bg-red-500/10" sub={`${((MOCK_FINANCIAL.failedPayments / MOCK_FINANCIAL.successfulPayments) * 100).toFixed(1)}% failure rate`} />
                </div>
              </div>
            </RequirePermission>
          )}

          {/* ═══════════════════════════════════════════════════
              MARKETPLACE TAB
          ═══════════════════════════════════════════════════ */}
          {tab === 'marketplace' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total Listings" value={s.totalListings.toLocaleString()} trend={s.listingsTrend} up={s.listingsUp} icon={Package} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" />
                <StatCard label="Active" value={s.activeListings.toLocaleString()} icon={ShieldCheck} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" />
                <StatCard label="New This Period" value={s.newListings.toLocaleString()} icon={UserPlus} color="text-purple-500" bg="bg-purple-50 dark:bg-purple-500/10" />
                <StatCard label="Avg Views/Listing" value="127" icon={Eye} color="text-orange-500" bg="bg-orange-50 dark:bg-orange-500/10" />
              </div>

              {/* Category breakdown */}
              <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
                <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                  <ShoppingCart size={14} className="text-brand-gold" /> Category Breakdown
                </h3>
                <div className="space-y-3">
                  {MOCK_CATEGORIES.map(cat => (
                    <div key={cat.name} className="flex items-center gap-3">
                      <div className="flex items-center gap-2 w-28 shrink-0">
                        <span className={`w-2.5 h-2.5 rounded-sm ${cat.color}`} />
                        <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{cat.name}</span>
                      </div>
                      <div className="flex-1 h-5 overflow-hidden bg-gray-100 rounded-lg dark:bg-white/5">
                        <div className={`h-full rounded-lg ${cat.color}/40 transition-all duration-500`} style={{ width: `${cat.pct}%` }} />
                      </div>
                      <div className="text-right shrink-0 w-40 flex items-center gap-3 justify-end">
                        <span className="text-[11px] text-gray-400">{cat.count.toLocaleString()} listings</span>
                        <span className="text-[11px] text-gray-400">{cat.bookings} bookings</span>
                        <span className="text-xs font-bold text-brand-charcoal-dark dark:text-white">{cat.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location breakdown */}
              <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:p-5">
                <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                  <MapPin size={14} className="text-brand-gold" /> Listings by Location
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[10px] text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-white/10">
                        <th className="py-2 text-left font-semibold">City</th>
                        <th className="py-2 text-right font-semibold">Listings</th>
                        <th className="py-2 text-right font-semibold">Bookings</th>
                        <th className="py-2 text-right font-semibold">Revenue</th>
                        <th className="py-2 text-right font-semibold">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_LOCATIONS.map(loc => (
                        <tr key={loc.name} className="border-b border-gray-50 dark:border-white/5 last:border-0">
                          <td className="py-2.5 text-brand-charcoal-dark dark:text-white font-medium">{loc.name}</td>
                          <td className="py-2.5 text-right text-gray-500">{loc.listings.toLocaleString()}</td>
                          <td className="py-2.5 text-right text-gray-500">{loc.bookings}</td>
                          <td className="py-2.5 text-right text-gray-500">{loc.revenue}</td>
                          <td className="py-2.5 text-right font-bold text-brand-charcoal-dark dark:text-white">{loc.pct}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              COMPETITIVE INTELLIGENCE — Live Internet Data
          ═══════════════════════════════════════════════════ */}
          {tab === 'competitive' && (
            <div className="space-y-4">

              {/* Sub-tab navigation */}
              <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                {COMP_SUB_TABS.map(t => (
                  <button key={t.id} onClick={() => setCompSubTab(t.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all border
                      ${compSubTab === t.id
                        ? 'border-brand-gold bg-brand-gold/5 text-brand-charcoal-dark dark:text-white'
                        : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                      }`}>
                    <t.icon size={12} /> {t.label}
                  </button>
                ))}
              </div>

              {/* Last Updated / Refresh bar */}
              <LastUpdatedBar
                lastUpdated={compLastUpdated} countdown={compCountdown}
                autoRefresh={compAutoRefresh}
                onToggleAutoRefresh={() => setCompAutoRefresh(p => !p)}
                onRefresh={fetchCompetitiveData} loading={compLoading}
              />

              {compLoading && !compData[compSubTab] ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-28 bg-white dark:bg-gray-900 rounded-2xl shadow-card animate-pulse" />
                  ))}
                </div>
              ) : (<>

              {/* ─── LIVE PULSE ──────────────────────────────── */}
              {compSubTab === 'livePulse' && (() => {
                const d = compData.livePulse || {};
                const pctChange = (today, yesterday) => yesterday ? (((today - yesterday) / yesterday) * 100).toFixed(1) : '0';
                const vChange = pctChange(d.websiteVisitsToday, d.websiteVisitsYesterday);
                const instChange = pctChange(d.appInstallsToday?.total, d.appInstallsYesterday?.total);
                const mentChange = pctChange(d.socialMentionsToday, d.socialMentionsYesterday);
                const searchChange = pctChange(d.googleSearchVolumeToday, d.googleSearchVolumeYesterday);
                return (
                  <div className="space-y-5">
                    {/* Hero */}
                    <div className="p-5 text-white bg-brand-charcoal-dark rounded-2xl">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Aurban Live Pulse</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold font-display">{(d.websiteVisitsToday || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400">Website Visits Today</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold font-display">{(d.activeSessions || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400">Active Sessions</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold font-display">{(d.appInstallsToday?.total || 0).toLocaleString()}</p>
                          <p className="text-[10px] text-gray-400">App Installs Today</p>
                        </div>
                      </div>
                    </div>

                    {/* KPI Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <StatCard label="Visits Today" value={(d.websiteVisitsToday || 0).toLocaleString()} trend={`${vChange > 0 ? '+' : ''}${vChange}%`} up={vChange > 0} icon={Eye} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" sub={`vs ${(d.websiteVisitsYesterday || 0).toLocaleString()} yesterday`} />
                      <StatCard label="Active Sessions" value={(d.activeSessions || 0).toLocaleString()} icon={Activity} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" sub="Real-time" />
                      <StatCard label="App Installs Today" value={(d.appInstallsToday?.total || 0).toLocaleString()} trend={`${instChange > 0 ? '+' : ''}${instChange}%`} up={instChange > 0} icon={Download} color="text-purple-500" bg="bg-purple-50 dark:bg-purple-500/10" sub={`iOS: ${d.appInstallsToday?.ios || 0} · Android: ${d.appInstallsToday?.android || 0}`} />
                      <StatCard label="Social Mentions" value={(d.socialMentionsToday || 0).toLocaleString()} trend={`${mentChange > 0 ? '+' : ''}${mentChange}%`} up={mentChange > 0} icon={MessageSquare} color="text-pink-500" bg="bg-pink-50 dark:bg-pink-500/10" sub={`vs ${d.socialMentionsYesterday || 0} yesterday`} />
                      <StatCard label="Google Searches" value={(d.googleSearchVolumeToday || 0).toLocaleString()} trend={`${searchChange > 0 ? '+' : ''}${searchChange}%`} up={searchChange > 0} icon={Search} color="text-orange-500" bg="bg-orange-50 dark:bg-orange-500/10" sub={`vs ${(d.googleSearchVolumeYesterday || 0).toLocaleString()} yesterday`} />
                      <StatCard label="Uptime" value={`${d.uptimePercent || 0}%`} icon={ShieldCheck} color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-500/10" sub={`30-day: ${d.uptimeLast30Days || 0}%`} />
                      <StatCard label="Page Speed (Mobile)" value={d.pageSpeedScore?.mobile || '—'} icon={Smartphone} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-500/10" sub="Google Lighthouse" />
                      <StatCard label="Page Speed (Desktop)" value={d.pageSpeedScore?.desktop || '—'} icon={Monitor} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-500/10" sub="Google Lighthouse" />
                    </div>

                    {/* Today vs Yesterday + System Health */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                        <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                          <BarChart2 size={14} className="text-brand-gold" /> Today vs Yesterday
                        </h3>
                        <div className="space-y-3">
                          {[
                            { label: 'Website Visits', today: d.websiteVisitsToday, yesterday: d.websiteVisitsYesterday },
                            { label: 'App Installs', today: d.appInstallsToday?.total, yesterday: d.appInstallsYesterday?.total },
                            { label: 'Social Mentions', today: d.socialMentionsToday, yesterday: d.socialMentionsYesterday },
                            { label: 'Google Searches', today: d.googleSearchVolumeToday, yesterday: d.googleSearchVolumeYesterday },
                          ].map(item => {
                            const mx = Math.max(item.today || 0, item.yesterday || 0) || 1;
                            return (
                              <div key={item.label}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-500">{item.label}</span>
                                  <span className="font-semibold text-brand-charcoal-dark dark:text-white">{(item.today || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex gap-1 h-3">
                                  <div className="h-full bg-brand-gold/60 rounded" style={{ width: `${((item.today || 0) / mx) * 100}%` }} />
                                  <div className="h-full bg-gray-200 dark:bg-white/10 rounded" style={{ width: `${((item.yesterday || 0) / mx) * 100}%` }} />
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-brand-gold/60" /> Today</span>
                                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-gray-200 dark:bg-white/10" /> Yesterday</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                        <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                          <ShieldCheck size={14} className="text-brand-gold" /> System Health
                        </h3>
                        <div className="space-y-3">
                          {[
                            { label: 'Uptime (Current)', value: `${d.uptimePercent || 0}%`, ok: (d.uptimePercent || 0) > 99.9 },
                            { label: 'SSL Certificate', value: d.sslCertExpiry ? `Expires ${new Date(d.sslCertExpiry).toLocaleDateString()}` : '—', ok: true },
                            { label: 'Indexed Pages', value: (d.indexedPages || 0).toLocaleString(), ok: true },
                            { label: 'Last Crawled', value: d.lastCrawled ? new Date(d.lastCrawled).toLocaleString() : '—', ok: true },
                            { label: 'Avg Load Time', value: d.avgLoadTime || '—', ok: parseFloat(d.avgLoadTime) < 3 },
                          ].map(item => (
                            <div key={item.label} className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">{item.label}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">{item.value}</span>
                                <span className={`w-2 h-2 rounded-full ${item.ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ─── SEARCH & DISCOVERY ────────────────────────── */}
              {compSubTab === 'search' && (() => {
                const d = compData.search || {};
                const monthly = d.googleSearchVolume?.monthly || [];
                const maxVol = Math.max(...monthly.map(m => m.volume), 1);
                return (
                  <div className="space-y-5">
                    {/* Monthly Search Volume Chart */}
                    <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                          <Search size={14} className="text-brand-gold" /> Monthly Google Search Volume — "Aurban"
                        </h3>
                        {d.googleSearchVolume?.trend && (
                          <TrendBadge trend={d.googleSearchVolume.trend} up={d.googleSearchVolume.trendUp} />
                        )}
                      </div>
                      <div className="flex items-end gap-2 h-36">
                        {monthly.map(m => (
                          <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[10px] font-semibold text-brand-charcoal-dark dark:text-white">{m.volume.toLocaleString()}</span>
                            <div className="w-full rounded-t-lg overflow-hidden" style={{ height: `${(m.volume / maxVol) * 100}%` }}>
                              <div className="w-full h-full bg-brand-gold/60 rounded-t-lg" />
                            </div>
                            <span className="text-[9px] text-gray-400">{m.month.split(' ')[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Keyword Rankings Table */}
                    <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                      <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                        <Target size={14} className="text-brand-gold" /> Keyword Rankings
                      </h3>
                      <div className="overflow-x-auto -mx-2">
                        <table className="w-full min-w-[550px] text-xs">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-white/5">
                              <th className="text-left py-2 px-2 font-semibold text-gray-500">Keyword</th>
                              <th className="text-center py-2 px-2 font-semibold text-gray-500">Position</th>
                              <th className="text-center py-2 px-2 font-semibold text-gray-500">Change</th>
                              <th className="text-center py-2 px-2 font-semibold text-gray-500">Monthly Vol.</th>
                              <th className="text-left py-2 px-2 font-semibold text-gray-500">Landing Page</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(d.keywordRankings || []).map(kw => (
                              <tr key={kw.keyword} className="border-b border-gray-50 dark:border-white/5">
                                <td className="py-2.5 px-2 font-semibold text-brand-charcoal-dark dark:text-white">{kw.keyword}</td>
                                <td className="py-2.5 px-2 text-center">
                                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${kw.position <= 3 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : kw.position <= 10 ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>
                                    {kw.position}
                                  </span>
                                </td>
                                <td className="py-2.5 px-2 text-center">
                                  {kw.change !== 0 ? (
                                    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${kw.change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                      {kw.change > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                      {Math.abs(kw.change)}
                                    </span>
                                  ) : <span className="text-gray-400">—</span>}
                                </td>
                                <td className="py-2.5 px-2 text-center text-gray-500">{(kw.volume || 0).toLocaleString()}</td>
                                <td className="py-2.5 px-2 text-gray-400 truncate max-w-[160px]">{kw.url}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* SEO Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {[
                        { label: 'Domain Authority', value: d.seoMetrics?.domainAuthority || '—', change: d.seoMetrics?.domainAuthorityChange, icon: Star, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
                        { label: 'Backlinks', value: (d.seoMetrics?.backlinks || 0).toLocaleString(), change: d.seoMetrics?.backlinksChange, icon: Globe, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                        { label: 'Referring Domains', value: (d.seoMetrics?.referringDomains || 0).toLocaleString(), change: d.seoMetrics?.referringDomainsChange, icon: Globe, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
                        { label: 'Organic Keywords', value: (d.seoMetrics?.organicKeywords || 0).toLocaleString(), icon: Search, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                        { label: 'Organic Traffic', value: (d.seoMetrics?.organicTraffic || 0).toLocaleString(), icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
                      ].map(m => (
                        <div key={m.label} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                          <div className={`w-7 h-7 ${m.bg} rounded-lg flex items-center justify-center mb-2`}>
                            <m.icon size={14} className={m.color} />
                          </div>
                          <p className="text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">{m.value}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{m.label}</p>
                          {m.change && (
                            <p className={`text-[10px] font-semibold mt-1 ${m.change > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {m.change > 0 ? '+' : ''}{typeof m.change === 'number' ? m.change.toLocaleString() : m.change}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Competitor Search Comparison */}
                    <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                      <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                        <Target size={14} className="text-brand-gold" /> Competitor Search Comparison
                      </h3>
                      <div className="space-y-3">
                        {(d.competitorSearchComparison || []).map(c => {
                          const maxCSV = Math.max(...(d.competitorSearchComparison || []).map(x => x.volume), 1);
                          return (
                            <div key={c.name} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className={`font-semibold ${c.name === 'Aurban' ? 'text-brand-gold' : 'text-brand-charcoal-dark dark:text-white'}`}>{c.name}</span>
                                <span className="text-gray-400">Vol: {c.volume.toLocaleString()} | DA: {c.domainAuthority} | Traffic: {c.organicTraffic.toLocaleString()}</span>
                              </div>
                              <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden">
                                <div className="h-full rounded-lg" style={{ width: `${(c.volume / maxCSV) * 100}%`, backgroundColor: c.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ─── TRAFFIC SOURCES ──────────────────────────── */}
              {compSubTab === 'traffic' && (() => {
                const d = compData.traffic || {};
                return (
                  <div className="space-y-5">
                    {/* Total visitors banner */}
                    <div className="p-5 text-white bg-brand-charcoal-dark rounded-2xl">
                      <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Total Visitors</p>
                      <p className="mt-2 text-4xl font-bold font-display">{(d.summary?.totalVisitors || 0).toLocaleString()}</p>
                      <p className="mt-1 text-xs text-gray-400">{d.summary?.period || 'Last 30 days'}</p>
                    </div>

                    {/* Source breakdown */}
                    <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                      <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                        <Globe size={14} className="text-brand-gold" /> Traffic by Source
                      </h3>
                      <div className="space-y-3">
                        {(d.sources || []).map(s => (
                          <div key={s.source}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-semibold text-brand-charcoal-dark dark:text-white">{s.source}</span>
                              <div className="flex items-center gap-3 text-gray-400">
                                <span>{(s.visitors || 0).toLocaleString()} visitors</span>
                                <span>{s.pct}%</span>
                                <span className="text-emerald-500 font-semibold">{s.conversionRate}% conv.</span>
                              </div>
                            </div>
                            <div className="h-2.5 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden">
                              <div className="h-full bg-brand-gold/60 rounded-lg" style={{ width: `${s.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Social Breakdown + Referral Sites */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                        <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                          <Smartphone size={14} className="text-brand-gold" /> Social Media Breakdown
                        </h3>
                        <div className="space-y-3">
                          {(d.socialBreakdown || []).map(s => (
                            <div key={s.platform}>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="font-semibold text-brand-charcoal-dark dark:text-white">{s.platform}</span>
                                <span className="text-gray-400">{(s.visitors || 0).toLocaleString()} ({s.pct}%)</span>
                              </div>
                              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden">
                                <div className="h-full rounded-lg" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                        <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                          <Globe size={14} className="text-brand-gold" /> Top Referral Sites
                        </h3>
                        <div className="space-y-2.5">
                          {(d.referralSites || []).map((r, i) => (
                            <div key={r.site} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="w-5 text-gray-400 font-semibold">{i + 1}.</span>
                                <span className="font-semibold text-brand-charcoal-dark dark:text-white">{r.site}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-400">
                                <span>{(r.visitors || 0).toLocaleString()}</span>
                                <span>({r.pct}%)</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* App Traffic + Email Campaigns */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                        <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                          <Smartphone size={14} className="text-brand-gold" /> App Traffic Split
                        </h3>
                        <div className="flex gap-4">
                          {[
                            { label: 'iOS', ...(d.appTraffic?.ios || {}), color: 'bg-blue-500' },
                            { label: 'Android', ...(d.appTraffic?.android || {}), color: 'bg-emerald-500' },
                          ].map(a => (
                            <div key={a.label} className="flex-1 p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
                              <p className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">{a.pct || 0}%</p>
                              <p className="text-[10px] text-gray-400 mt-1">{a.label}</p>
                              <p className="text-xs font-semibold text-brand-charcoal-dark dark:text-white mt-1">{(a.visitors || 0).toLocaleString()}</p>
                              <p className="text-[10px] text-gray-400">Avg: {a.avgSession || '—'}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                        <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                          <CreditCard size={14} className="text-brand-gold" /> Email Campaign Performance
                        </h3>
                        <div className="overflow-x-auto -mx-2">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-gray-100 dark:border-white/5">
                                <th className="text-left py-1.5 px-2 font-semibold text-gray-500">Campaign</th>
                                <th className="text-center py-1.5 px-2 font-semibold text-gray-500">Sent</th>
                                <th className="text-center py-1.5 px-2 font-semibold text-gray-500">Opened</th>
                                <th className="text-center py-1.5 px-2 font-semibold text-gray-500">Clicked</th>
                                <th className="text-center py-1.5 px-2 font-semibold text-gray-500">Conv.</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(d.emailCampaigns || []).map(e => (
                                <tr key={e.campaign} className="border-b border-gray-50 dark:border-white/5">
                                  <td className="py-2 px-2 font-semibold text-brand-charcoal-dark dark:text-white truncate max-w-[140px]">{e.campaign}</td>
                                  <td className="py-2 px-2 text-center text-gray-500">{(e.sent || 0).toLocaleString()}</td>
                                  <td className="py-2 px-2 text-center text-gray-500">{(e.opened || 0).toLocaleString()}</td>
                                  <td className="py-2 px-2 text-center text-gray-500">{(e.clicked || 0).toLocaleString()}</td>
                                  <td className="py-2 px-2 text-center font-semibold text-emerald-600">{e.conversions || 0}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ─── SOCIAL & APP ─────────────────────────────── */}
              {compSubTab === 'social' && (() => {
                const d = compData.social || {};
                return (
                  <div className="space-y-5">
                    {/* Platform Dashboard Cards */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {(d.platforms || []).map(p => (
                        <div key={p.platform} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card border-l-4" style={{ borderLeftColor: p.color }}>
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{p.platform}</p>
                              <p className="text-[10px] text-gray-400">{p.handle}</p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">{p.followersGrowth}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-gray-400">Followers</p>
                              <p className="font-bold text-brand-charcoal-dark dark:text-white">{(p.followers || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Engagement</p>
                              <p className="font-bold text-brand-charcoal-dark dark:text-white">{p.engagementRate}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Posts/mo</p>
                              <p className="font-bold text-brand-charcoal-dark dark:text-white">{p.postsThisMonth}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Avg Reach</p>
                              <p className="font-bold text-brand-charcoal-dark dark:text-white">{(p.avgReach || 0).toLocaleString()}</p>
                            </div>
                          </div>
                          {p.topPost && (
                            <div className="mt-3 p-2.5 bg-gray-50 dark:bg-white/5 rounded-lg">
                              <p className="text-[10px] text-gray-400 mb-0.5">Top Post ({p.topPost.type})</p>
                              <p className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">{p.topPost.topic}</p>
                              <p className="text-[10px] text-gray-400 mt-0.5">Reach: {(p.topPost.reach || 0).toLocaleString()} · Eng: {p.topPost.engagement}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* App Store Metrics */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        { label: 'iOS App Store', data: d.appStore?.ios, emoji: 'iOS' },
                        { label: 'Google Play Store', data: d.appStore?.android, emoji: 'Android' },
                      ].map(store => store.data && (
                        <div key={store.label} className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                          <h3 className="flex items-center gap-2 mb-3 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                            <Smartphone size={14} className="text-brand-gold" /> {store.label}
                          </h3>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-3xl font-bold font-display text-brand-gold">{store.data.rating}</span>
                            <div className="flex text-brand-gold text-xs">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={14} fill={i < Math.round(store.data.rating) ? 'currentColor' : 'none'} />
                              ))}
                            </div>
                            <span className="text-[10px] text-gray-400">({(store.data.reviews || 0).toLocaleString()} reviews)</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><p className="text-gray-400">Total Downloads</p><p className="font-bold text-brand-charcoal-dark dark:text-white">{(store.data.downloads || 0).toLocaleString()}</p></div>
                            <div><p className="text-gray-400">This Month</p><p className="font-bold text-brand-charcoal-dark dark:text-white">{(store.data.downloadsThisMonth || 0).toLocaleString()}</p></div>
                          </div>
                          <div className="mt-3 p-2.5 bg-gray-50 dark:bg-white/5 rounded-lg">
                            <p className="text-[10px] text-gray-400 mb-0.5">Top Review</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 italic">&quot;{store.data.topReview}&quot;</p>
                          </div>
                          <p className="mt-2 text-[10px] text-gray-400">Version: {store.data.version}</p>
                        </div>
                      ))}
                    </div>

                    {/* Brand Sentiment */}
                    <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                      <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                        <MessageSquare size={14} className="text-brand-gold" /> Brand Mentions & Sentiment
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-4xl font-bold font-display text-brand-gold">{d.brandMentions?.sentimentScore || 0}</span>
                            <div>
                              <p className="text-xs text-gray-400">/100 Sentiment Score</p>
                              <p className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">{(d.brandMentions?.total || 0).toLocaleString()} total mentions</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {[
                              { label: 'Positive', value: d.brandMentions?.positive || 0, total: d.brandMentions?.total || 1, color: 'bg-emerald-500' },
                              { label: 'Neutral', value: d.brandMentions?.neutral || 0, total: d.brandMentions?.total || 1, color: 'bg-gray-400' },
                              { label: 'Negative', value: d.brandMentions?.negative || 0, total: d.brandMentions?.total || 1, color: 'bg-red-500' },
                            ].map(s => (
                              <div key={s.label}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span className="text-gray-500">{s.label}</span>
                                  <span className="font-semibold text-brand-charcoal-dark dark:text-white">{s.value} ({((s.value / s.total) * 100).toFixed(0)}%)</span>
                                </div>
                                <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden">
                                  <div className={`h-full rounded-lg ${s.color}`} style={{ width: `${(s.value / s.total) * 100}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 mb-2">Recent Mentions</p>
                          <div className="space-y-2.5">
                            {(d.brandMentions?.recentMentions || []).map((m, i) => (
                              <div key={i} className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-semibold text-gray-400">{m.source}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                                    m.sentiment === 'positive' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600'
                                      : m.sentiment === 'negative' ? 'bg-red-50 dark:bg-red-500/10 text-red-500'
                                        : 'bg-gray-100 dark:bg-white/10 text-gray-500'
                                  }`}>{m.sentiment}</span>
                                  <span className="text-[10px] text-gray-400 ml-auto">{m.date}</span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300">&quot;{m.text}&quot;</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ─── COMPETITORS ──────────────────────────────── */}
              {compSubTab === 'competitors' && (() => {
                const d = compData.competitors || {};
                const comps = d.competitors || [];
                const features = d.featureMatrix || [];
                return (
                  <div className="space-y-5">
                    {/* Comparison Table */}
                    <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                      <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                        <Target size={14} className="text-brand-gold" /> Head-to-Head Comparison
                      </h3>
                      <div className="overflow-x-auto -mx-2">
                        <table className="w-full min-w-[650px] text-xs">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-white/5">
                              <th className="text-left py-2 px-2 font-semibold text-gray-500">Platform</th>
                              <th className="text-center py-2 px-2 font-semibold text-gray-500">Est. Visits/mo</th>
                              <th className="text-center py-2 px-2 font-semibold text-gray-500">Similarweb Rank</th>
                              <th className="text-center py-2 px-2 font-semibold text-gray-500">Listings</th>
                              <th className="text-center py-2 px-2 font-semibold text-gray-500">Search Vol.</th>
                              <th className="text-center py-2 px-2 font-semibold text-gray-500">App Rating</th>
                              <th className="text-center py-2 px-2 font-semibold text-gray-500">Social</th>
                            </tr>
                          </thead>
                          <tbody>
                            {comps.map(c => (
                              <tr key={c.name} className={`border-b border-gray-50 dark:border-white/5 ${c.isUs ? 'bg-brand-gold/5' : ''}`}>
                                <td className={`py-2.5 px-2 font-bold ${c.isUs ? 'text-brand-gold' : 'text-brand-charcoal-dark dark:text-white'}`}>{c.name}</td>
                                <td className="py-2.5 px-2 text-center text-gray-500">{c.estMonthlyVisits}</td>
                                <td className="py-2.5 px-2 text-center text-gray-500">{c.similarwebRank}</td>
                                <td className="py-2.5 px-2 text-center text-gray-500">{(c.totalListings || 0).toLocaleString()}</td>
                                <td className="py-2.5 px-2 text-center text-gray-500">{(c.googleSearchVolume || 0).toLocaleString()}</td>
                                <td className="py-2.5 px-2 text-center text-gray-500">
                                  iOS {c.appRating?.ios || '—'} / And {c.appRating?.android || '—'}
                                </td>
                                <td className="py-2.5 px-2 text-center text-gray-500">
                                  {Object.values(c.socialFollowers || {}).reduce((a, b) => a + b, 0).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Social Followers Comparison */}
                    <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                      <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                        <Smartphone size={14} className="text-brand-gold" /> Social Followers by Platform
                      </h3>
                      <div className="space-y-4">
                        {['instagram', 'twitter', 'facebook', 'tiktok', 'linkedin'].map(platform => {
                          const maxF = Math.max(...comps.map(c => c.socialFollowers?.[platform] || 0), 1);
                          return (
                            <div key={platform}>
                              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{platform}</p>
                              <div className="space-y-1">
                                {comps.map(c => (
                                  <div key={c.name} className="flex items-center gap-2">
                                    <span className={`text-[10px] w-20 truncate ${c.isUs ? 'text-brand-gold font-bold' : 'text-gray-500'}`}>{c.name}</span>
                                    <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden">
                                      <div className={`h-full rounded-lg ${c.isUs ? 'bg-brand-gold' : 'bg-gray-300 dark:bg-white/20'}`}
                                        style={{ width: `${((c.socialFollowers?.[platform] || 0) / maxF) * 100}%` }} />
                                    </div>
                                    <span className="text-[10px] text-gray-500 w-12 text-right">{(c.socialFollowers?.[platform] || 0).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Feature Advantage Matrix */}
                    <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                      <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                        <Star size={14} className="text-brand-gold" /> Feature Advantage Matrix
                      </h3>
                      <div className="overflow-x-auto -mx-2">
                        <table className="w-full min-w-[550px] text-xs">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-white/5">
                              <th className="text-left py-2 px-2 font-semibold text-gray-500">Feature</th>
                              {comps.map(c => (
                                <th key={c.name} className={`text-center py-2 px-2 font-semibold ${c.isUs ? 'text-brand-gold' : 'text-gray-500'}`}>{c.name}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {features.map(f => (
                              <tr key={f.key} className="border-b border-gray-50 dark:border-white/5">
                                <td className="py-2.5 px-2 text-gray-600 dark:text-gray-300">{f.feature}</td>
                                {comps.map(c => (
                                  <td key={c.name} className={`py-2.5 px-2 text-center ${c.isUs ? 'bg-brand-gold/5' : ''}`}>
                                    {c.features?.[f.key]
                                      ? <CheckCircle2 size={14} className="mx-auto text-emerald-500" />
                                      : <XCircle size={14} className="mx-auto text-gray-300 dark:text-gray-600" />}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Aurban Unique Advantages */}
                    {(() => {
                      const aurban = comps.find(c => c.isUs);
                      const uniqueFeatures = features.filter(f => aurban?.features?.[f.key] && !comps.filter(c => !c.isUs).some(c => c.features?.[f.key]));
                      if (!uniqueFeatures.length) return null;
                      return (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                          <h4 className="flex items-center gap-2 mb-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 size={14} /> Features Only Aurban Has
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {uniqueFeatures.map(f => (
                              <span key={f.key} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-300">{f.feature}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {/* ─── GLOBAL RANK ──────────────────────────────── */}
              {compSubTab === 'globalRank' && (() => {
                const d = compData.globalRank || {};
                const rankings = d.rankings || {};
                return (
                  <div className="space-y-5">
                    {/* Rankings Hero */}
                    <div className="p-5 text-white bg-brand-charcoal-dark rounded-2xl">
                      <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-4">Aurban Global Rankings</p>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {[
                          { label: 'Global Proptech', data: rankings.globalProptech },
                          { label: 'African Proptech', data: rankings.africanProptech },
                          { label: 'Nigerian Proptech', data: rankings.nigerianProptech },
                          { label: 'West African', data: rankings.westAfricanProptech },
                        ].map(r => r.data && (
                          <div key={r.label} className="text-center">
                            <p className="text-3xl font-bold font-display">
                              #{r.data.rank}
                              <span className="text-sm text-gray-400">/{r.data.total}</span>
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">{r.label}</p>
                            <p className="text-[10px] text-emerald-400 mt-0.5">{r.data.percentile}</p>
                            {r.data.change !== 0 && (
                              <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold mt-0.5 ${r.data.change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {r.data.change > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                {Math.abs(r.data.change)} positions
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Trust Score */}
                    <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                      <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                        <ShieldCheck size={14} className="text-brand-gold" /> Trust Score
                      </h3>
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-5xl font-bold font-display text-brand-gold">{d.trustScore?.overall || 0}</span>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden">
                            <div className="h-full bg-brand-gold rounded-lg" style={{ width: `${d.trustScore?.overall || 0}%` }} />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">out of 100</p>
                        </div>
                      </div>
                      <div className="space-y-2.5">
                        {Object.entries(d.trustScore?.breakdown || {}).map(([key, value]) => (
                          <div key={key}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="font-semibold text-brand-charcoal-dark dark:text-white">{value}/100</span>
                            </div>
                            <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden">
                              <div className={`h-full rounded-lg ${value >= 90 ? 'bg-emerald-500' : value >= 80 ? 'bg-brand-gold' : 'bg-amber-500'}`} style={{ width: `${value}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Awards */}
                    <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                      <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                        <Trophy size={14} className="text-brand-gold" /> Awards & Recognition
                      </h3>
                      <div className="space-y-3">
                        {(d.awards || []).map((a, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                            <Award size={18} className="text-brand-gold shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">{a.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{a.org} · {a.year}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Industry Benchmarks */}
                    <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                      <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                        <BarChart2 size={14} className="text-brand-gold" /> Industry Benchmarks
                      </h3>
                      <div className="overflow-x-auto -mx-2">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-white/5">
                              <th className="text-left py-2 px-2 font-semibold text-gray-500">Metric</th>
                              <th className="text-center py-2 px-2 font-semibold text-brand-gold">Aurban</th>
                              <th className="text-center py-2 px-2 font-semibold text-gray-500">Industry Avg</th>
                              <th className="text-center py-2 px-2 font-semibold text-gray-500">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(d.industryBenchmarks || []).map(b => (
                              <tr key={b.metric} className="border-b border-gray-50 dark:border-white/5">
                                <td className="py-2.5 px-2 text-gray-600 dark:text-gray-300">{b.metric}</td>
                                <td className="py-2.5 px-2 text-center font-bold text-brand-charcoal-dark dark:text-white">{b.aurban}</td>
                                <td className="py-2.5 px-2 text-center text-gray-500">{b.industryAvg}</td>
                                <td className="py-2.5 px-2 text-center">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                    b.status === 'above' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'
                                  }`}>{b.status === 'above' ? 'Above Avg' : 'Below Avg'}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })()}

              </>)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
