import { useState, useMemo, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Eye, Users, MessageCircle, TrendingUp, TrendingDown,
  Search, Heart, MousePointerClick, BarChart2, PieChart,
  ArrowUpRight, ArrowDownRight, Calendar, ChevronDown,
  Star, Clock, Zap, Target, Award, Crown,
  MapPin, Smartphone, Monitor, Globe, ExternalLink,
  AlertCircle, Info, ChevronRight, Filter,
  DollarSign, Percent, Activity, Layers,
  Shield, CheckCircle2, XCircle, Minus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { sanitize } from '../../utils/security.js';

/* ════════════════════════════════════════════════════════════
   PROVIDER ANALYTICS — Comprehensive dashboard analytics
   
   5 Tiers:
   1. Core Metrics (views, inquiries, conversion, saves)
   2. Audience Intelligence (location, device, peak hours)
   3. Competitive Intelligence (area comparison, quality score)
   4. Revenue Analytics (earnings, projections, per-listing)
   5. Engagement Analytics (response rate, reviews, shares)
   
   Sections:
   • KPI Cards
   • Performance Chart (views + inquiries over time)
   • Listing Breakdown Table
   • Audience & Device Insights
   • Peak Hours Heatmap
   • Search & Discovery Stats
   • Competitive Positioning
   • Listing Quality Score
   • Revenue Overview
   • Funnel Analysis
════════════════════════════════════════════════════════════ */

/* ── Mock data (replace with API calls in production) ─────── */

const MOCK_KPI = {
  '7d':  { views: 1284, uniqueVisitors: 876, inquiries: 42, saves: 67, searchAppearances: 3420, ctr: 4.2, conversionRate: 3.27, avgTimeOnListing: 48, shares: 15 },
  '30d': { views: 5890, uniqueVisitors: 3912, inquiries: 187, saves: 312, searchAppearances: 14850, ctr: 4.8, conversionRate: 3.17, avgTimeOnListing: 52, shares: 68 },
  '90d': { views: 16420, uniqueVisitors: 11230, inquiries: 534, saves: 890, searchAppearances: 42100, ctr: 5.1, conversionRate: 3.25, avgTimeOnListing: 45, shares: 189 },
};

const MOCK_CHART_DATA = {
  '7d': [
    { label: 'Mon', views: 145, inquiries: 5 },
    { label: 'Tue', views: 198, inquiries: 8 },
    { label: 'Wed', views: 167, inquiries: 4 },
    { label: 'Thu', views: 234, inquiries: 9 },
    { label: 'Fri', views: 189, inquiries: 7 },
    { label: 'Sat', views: 210, inquiries: 6 },
    { label: 'Sun', views: 141, inquiries: 3 },
  ],
  '30d': [
    { label: 'W1', views: 1284, inquiries: 42 },
    { label: 'W2', views: 1520, inquiries: 51 },
    { label: 'W3', views: 1410, inquiries: 45 },
    { label: 'W4', views: 1676, inquiries: 49 },
  ],
  '90d': [
    { label: 'Jan', views: 4890, inquiries: 156 },
    { label: 'Feb', views: 5420, inquiries: 187 },
    { label: 'Mar', views: 6110, inquiries: 191 },
  ],
};

const MOCK_LISTINGS_PERF = [
  { id: 'l1', title: '3 Bedroom Flat in Lekki Phase 1', category: 'rental', views: 2340, inquiries: 78, saves: 134, ctr: 5.2, conversion: 3.33, qualityScore: 87, rank: 3, avgPrice: 2800000, yourPrice: 2500000, status: 'active' },
  { id: 'l2', title: 'Land for Sale — 500sqm Ibeju-Lekki', category: 'land', views: 1890, inquiries: 45, saves: 98, ctr: 4.8, conversion: 2.38, qualityScore: 72, rank: 8, avgPrice: 18000000, yourPrice: 15000000, status: 'active' },
  { id: 'l3', title: 'Shared Apartment — Male Only', category: 'shared', views: 980, inquiries: 32, saves: 56, ctr: 3.9, conversion: 3.27, qualityScore: 64, rank: 15, avgPrice: 500000, yourPrice: 450000, status: 'paused' },
  { id: 'l4', title: '4 Bed Duplex — Banana Island', category: 'buy', views: 3200, inquiries: 22, saves: 210, ctr: 6.1, conversion: 0.69, qualityScore: 94, rank: 1, avgPrice: 450000000, yourPrice: 420000000, status: 'active' },
];

const MOCK_AUDIENCE = {
  locations: [
    { name: 'Lagos', pct: 45 },
    { name: 'Abuja', pct: 22 },
    { name: 'Port Harcourt', pct: 8 },
    { name: 'Ibadan', pct: 6 },
    { name: 'Diaspora (UK/US)', pct: 12 },
    { name: 'Others', pct: 7 },
  ],
  devices: { mobile: 72, desktop: 23, tablet: 5 },
  referrals: [
    { source: 'Aurban Search', pct: 48, icon: Search },
    { source: 'Google', pct: 22, icon: Globe },
    { source: 'Social Media', pct: 15, icon: ExternalLink },
    { source: 'Direct Link', pct: 10, icon: MousePointerClick },
    { source: 'WhatsApp', pct: 5, icon: MessageCircle },
  ],
};

const MOCK_PEAK_HOURS = [
  // [hour, mon, tue, wed, thu, fri, sat, sun] — values 0-10 intensity
  ['6AM',  1, 1, 1, 1, 1, 2, 1],
  ['8AM',  3, 4, 3, 4, 3, 3, 2],
  ['10AM', 5, 6, 5, 6, 5, 7, 4],
  ['12PM', 7, 7, 6, 7, 7, 8, 5],
  ['2PM',  8, 8, 8, 9, 8, 6, 4],
  ['4PM',  6, 7, 7, 7, 6, 5, 3],
  ['6PM',  9, 9, 8, 9, 8, 7, 5],
  ['8PM', 10, 10, 9, 10, 9, 8, 7],
  ['10PM', 7, 7, 6, 7, 6, 6, 5],
];

const MOCK_FUNNEL = {
  searchImpressions: 14850,
  clicks: 5890,
  views: 5890,
  saves: 312,
  inquiries: 187,
  responses: 172,
  dealsClosed: 8,
};

const MOCK_REVENUE = {
  totalEarnings: 1250000,
  thisMonth: 285000,
  lastMonth: 210000,
  pending: 45000,
  projected: 340000,
};

const MOCK_QUALITY = {
  overall: 82,
  photos: 90,
  description: 75,
  responseTime: 88,
  pricing: 78,
  completeness: 80,
  reviews: 85,
};

/* ── Helpers ──────────────────────────────────────────────── */
function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatMoney(n) {
  if (n >= 1000000) return '₦' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '₦' + (n / 1000).toFixed(0) + 'K';
  return '₦' + n.toLocaleString();
}

function pctChange(current, previous) {
  if (!previous) return 0;
  return ((current - previous) / previous * 100).toFixed(1);
}

function getScoreColor(score) {
  if (score >= 85) return 'text-emerald-500';
  if (score >= 70) return 'text-brand-gold';
  if (score >= 50) return 'text-orange-500';
  return 'text-red-500';
}

function getScoreBg(score) {
  if (score >= 85) return 'bg-emerald-500';
  if (score >= 70) return 'bg-brand-gold';
  if (score >= 50) return 'bg-orange-500';
  return 'bg-red-500';
}

function getScoreLabel(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Needs Work';
  return 'Poor';
}

function getHeatColor(intensity) {
  // 0 = light, 10 = most intense gold
  if (intensity <= 1) return 'bg-gray-100 dark:bg-white/5';
  if (intensity <= 3) return 'bg-brand-gold/10';
  if (intensity <= 5) return 'bg-brand-gold/25';
  if (intensity <= 7) return 'bg-brand-gold/45';
  if (intensity <= 9) return 'bg-brand-gold/70';
  return 'bg-brand-gold';
}

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* ════════════════════════════════════════════════════════════
   MAIN ANALYTICS COMPONENT
════════════════════════════════════════════════════════════ */
export default function Analytics() {
  const { user } = useAuth();

  /* ── Period selector ────────────────────────────────────── */
  const [period, setPeriod] = useState('30d');
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedListing, setExpandedListing] = useState(null);
  const [sortBy, setSortBy] = useState('views');

  const kpi = MOCK_KPI[period];
  const chartData = MOCK_CHART_DATA[period];
  const maxViews = Math.max(...chartData.map((d) => d.views));
  const maxInquiries = Math.max(...chartData.map((d) => d.inquiries));

  /* ── Previous period comparison ─────────────────────────── */
  const prevPeriodKey = period === '7d' ? '7d' : period === '30d' ? '7d' : '30d';
  const prevKpi = MOCK_KPI[prevPeriodKey];
  const viewsChange = pctChange(kpi.views, prevKpi.views);
  const inquiriesChange = pctChange(kpi.inquiries, prevKpi.inquiries);
  const savesChange = pctChange(kpi.saves, prevKpi.saves);
  const ctrChange = pctChange(kpi.ctr, prevKpi.ctr);

  /* ── Sorted listings ────────────────────────────────────── */
  const sortedListings = useMemo(() => {
    return [...MOCK_LISTINGS_PERF].sort((a, b) => {
      if (sortBy === 'views') return b.views - a.views;
      if (sortBy === 'inquiries') return b.inquiries - a.inquiries;
      if (sortBy === 'conversion') return b.conversion - a.conversion;
      if (sortBy === 'quality') return b.qualityScore - a.qualityScore;
      if (sortBy === 'rank') return a.rank - b.rank;
      return 0;
    });
  }, [sortBy]);

  /* ── Funnel percentages ─────────────────────────────────── */
  const funnel = MOCK_FUNNEL;
  const funnelSteps = [
    { label: 'Search Impressions', value: funnel.searchImpressions, pct: 100 },
    { label: 'Listing Clicks', value: funnel.clicks, pct: ((funnel.clicks / funnel.searchImpressions) * 100).toFixed(1) },
    { label: 'Full Views', value: funnel.views, pct: ((funnel.views / funnel.searchImpressions) * 100).toFixed(1) },
    { label: 'Saved / Wishlisted', value: funnel.saves, pct: ((funnel.saves / funnel.searchImpressions) * 100).toFixed(1) },
    { label: 'Inquiries Sent', value: funnel.inquiries, pct: ((funnel.inquiries / funnel.searchImpressions) * 100).toFixed(1) },
    { label: 'You Responded', value: funnel.responses, pct: ((funnel.responses / funnel.inquiries) * 100).toFixed(1) },
    { label: 'Deals Closed', value: funnel.dealsClosed, pct: ((funnel.dealsClosed / funnel.searchImpressions) * 100).toFixed(2) },
  ];

  /* ── Section navigation tabs ────────────────────────────── */
  const sections = [
    { id: 'overview',    label: 'Overview',     icon: BarChart2 },
    { id: 'listings',    label: 'Per Listing',  icon: Layers },
    { id: 'audience',    label: 'Audience',     icon: Users },
    { id: 'competitive', label: 'Competitive',  icon: Target },
    { id: 'revenue',     label: 'Revenue',      icon: DollarSign },
    { id: 'funnel',      label: 'Funnel',       icon: Filter },
  ];

  return (
    <div className="pb-8 space-y-5">

      {/* ── Page header ───────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
            Analytics
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Track performance across all your listings
          </p>
        </div>

        {/* Period selector */}
        <div className="flex gap-1.5 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
          {[
            { id: '7d', label: '7 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' },
          ].map((p) => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all
                ${period === p.id
                  ? 'bg-white dark:bg-gray-800 text-brand-charcoal-dark dark:text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section tabs ──────────────────────────────────── */}
      <div className="flex gap-1.5 overflow-x-auto scroll-x pb-1">
        {sections.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveSection(id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all
              ${activeSection === id
                ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900 shadow-sm'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}>
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          OVERVIEW SECTION
      ══════════════════════════════════════════════════════ */}
      {activeSection === 'overview' && (
        <>
          {/* ── KPI Cards ─────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total Views', value: formatNum(kpi.views), change: viewsChange, icon: Eye, color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' },
              { label: 'Inquiries', value: formatNum(kpi.inquiries), change: inquiriesChange, icon: MessageCircle, color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600' },
              { label: 'Saves', value: formatNum(kpi.saves), change: savesChange, icon: Heart, color: 'bg-rose-50 dark:bg-rose-500/10 text-rose-500' },
              { label: 'Click Rate', value: kpi.ctr + '%', change: ctrChange, icon: MousePointerClick, color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' },
            ].map(({ label, value, change, icon: Icon, color }) => (
              <div key={label} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${color}`}>
                  <Icon size={15} />
                </div>
                <p className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">{value}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
                <div className={`flex items-center gap-0.5 mt-1.5 text-[11px] font-semibold
                  ${Number(change) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {Number(change) >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(change)}% vs prev
                </div>
              </div>
            ))}
          </div>

          {/* ── Secondary KPIs ────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Unique Visitors', value: formatNum(kpi.uniqueVisitors), icon: Users },
              { label: 'Search Appearances', value: formatNum(kpi.searchAppearances), icon: Search },
              { label: 'Avg. Time on Listing', value: kpi.avgTimeOnListing + 's', icon: Clock },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl p-3.5 shadow-card flex items-center gap-3">
                <Icon size={16} className="text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{value}</p>
                  <p className="text-[10px] text-gray-400 truncate">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Performance Chart ─────────────────────────── */}
          <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Views & Inquiries</h3>
              <div className="flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-brand-gold/40" /> Views
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" /> Inquiries
                </span>
              </div>
            </div>

            {/* Bar chart */}
            <div className="flex items-end h-40 gap-2">
              {chartData.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-1 group">
                  <div className="w-full flex items-end gap-0.5 h-32">
                    {/* Views bar */}
                    <div className="relative flex-1">
                      <div
                        className="relative w-full transition-all bg-brand-gold/25 dark:bg-brand-gold/30 rounded-t-md hover:bg-brand-gold/40"
                        style={{ height: `${(d.views / maxViews) * 100}%` }}
                      >
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {d.views}
                        </span>
                      </div>
                    </div>
                    {/* Inquiries bar */}
                    <div className="relative flex-1">
                      <div
                        className="relative w-full transition-all bg-purple-500/70 rounded-t-md hover:bg-purple-500"
                        style={{ height: `${maxInquiries > 0 ? (d.inquiries / maxInquiries) * 100 : 0}%`, minHeight: d.inquiries > 0 ? '4px' : '0' }}
                      >
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {d.inquiries}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Conversion Rate Spotlight ─────────────────── */}
          <div className="relative p-5 overflow-hidden text-white bg-brand-charcoal-dark rounded-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-brand-gold/5 -translate-y-1/3 translate-x-1/3" />
            <div className="relative z-10">
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Conversion Rate</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-bold font-display">{kpi.conversionRate}%</span>
                <span className="text-sm text-gray-400">views → inquiries</span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                For every 100 people who view your listings, {kpi.conversionRate} send an inquiry. Industry average is 2.5%.
              </p>
              <div className="h-2 mt-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full transition-all duration-700 rounded-full bg-brand-gold" style={{ width: `${Math.min(kpi.conversionRate * 10, 100)}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>0%</span>
                <span className="font-semibold text-brand-gold">You: {kpi.conversionRate}%</span>
                <span>10%</span>
              </div>
            </div>
          </div>

          {/* ── Listing Quality Score ─────────────────────── */}
          <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Listing Quality Score</h3>
              <div className="flex items-center gap-1.5">
                <span className={`font-display text-2xl font-bold ${getScoreColor(MOCK_QUALITY.overall)}`}>
                  {MOCK_QUALITY.overall}
                </span>
                <span className="text-xs text-gray-400">/100</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { label: 'Photo Quality', score: MOCK_QUALITY.photos, tip: 'High-res, well-lit photos boost engagement 3x' },
                { label: 'Description', score: MOCK_QUALITY.description, tip: 'Add more detail — aim for 150+ words' },
                { label: 'Response Time', score: MOCK_QUALITY.responseTime, tip: 'You respond in ~2hrs — great!' },
                { label: 'Pricing Competitiveness', score: MOCK_QUALITY.pricing, tip: 'Your prices are slightly above area average' },
                { label: 'Profile Completeness', score: MOCK_QUALITY.completeness, tip: 'Upload ID and business docs to reach 100%' },
                { label: 'Review Score', score: MOCK_QUALITY.reviews, tip: '4.8★ average — keep it up!' },
              ].map(({ label, score, tip }) => (
                <div key={label} className="group">
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{label}</span>
                    <span className={`font-semibold text-xs ${getScoreColor(score)}`}>
                      {score}/100 · {getScoreLabel(score)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${getScoreBg(score)}`} style={{ width: `${score}%` }} />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    💡 {tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          PER LISTING SECTION
      ══════════════════════════════════════════════════════ */}
      {activeSection === 'listings' && (
        <>
          {/* Sort controls */}
          <div className="flex items-center gap-2 pb-1 overflow-x-auto scroll-x">
            <span className="text-xs text-gray-400 shrink-0">Sort by:</span>
            {[
              { id: 'views', label: 'Views' },
              { id: 'inquiries', label: 'Inquiries' },
              { id: 'conversion', label: 'Conversion' },
              { id: 'quality', label: 'Quality' },
              { id: 'rank', label: 'Rank' },
            ].map((s) => (
              <button key={s.id} onClick={() => setSortBy(s.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all border
                  ${sortBy === s.id
                    ? 'border-brand-gold bg-brand-gold/5 text-brand-charcoal-dark dark:text-white'
                    : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-300'
                  }`}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Listing cards */}
          <div className="space-y-3">
            {sortedListings.map((listing) => (
              <div key={listing.id} className="overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                {/* Main row */}
                <button
                  onClick={() => setExpandedListing(expandedListing === listing.id ? null : listing.id)}
                  className="flex items-center w-full gap-3 p-4 text-left"
                >
                  {/* Rank badge */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold
                    ${listing.rank <= 3
                      ? 'bg-brand-gold/10 text-brand-gold'
                      : listing.rank <= 10
                        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                    }`}>
                    #{listing.rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${listing.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">{listing.category}</span>
                    </div>
                    <h4 className="text-sm font-semibold truncate text-brand-charcoal-dark dark:text-white">{listing.title}</h4>
                  </div>

                  {/* Quick stats */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{formatNum(listing.views)}</p>
                      <p className="text-[10px] text-gray-400">views</p>
                    </div>
                    <ChevronDown size={16} className={`text-gray-300 transition-transform ${expandedListing === listing.id ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded details */}
                {expandedListing === listing.id && (
                  <div className="px-4 pt-0 pb-4 border-t border-gray-50 dark:border-white/5 animate-fade-up">
                    {/* Stats grid */}
                    <div className="grid grid-cols-4 gap-2 my-3">
                      {[
                        { label: 'Views', value: formatNum(listing.views), icon: Eye },
                        { label: 'Inquiries', value: listing.inquiries, icon: MessageCircle },
                        { label: 'Saves', value: listing.saves, icon: Heart },
                        { label: 'CTR', value: listing.ctr + '%', icon: MousePointerClick },
                      ].map(({ label, value, icon: Icon }) => (
                        <div key={label} className="bg-gray-50 dark:bg-white/5 rounded-xl p-2.5 text-center">
                          <Icon size={13} className="mx-auto mb-1 text-gray-400" />
                          <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{value}</p>
                          <p className="text-[9px] text-gray-400">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Quality score */}
                    <div className="flex items-center justify-between py-2.5 border-t border-gray-50 dark:border-white/5">
                      <span className="text-xs text-gray-500">Quality Score</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getScoreBg(listing.qualityScore)}`} style={{ width: `${listing.qualityScore}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${getScoreColor(listing.qualityScore)}`}>{listing.qualityScore}</span>
                      </div>
                    </div>

                    {/* Price comparison */}
                    <div className="flex items-center justify-between py-2.5 border-t border-gray-50 dark:border-white/5">
                      <span className="text-xs text-gray-500">Area Avg Price</span>
                      <div className="text-right">
                        <span className="text-xs text-gray-400">{formatMoney(listing.avgPrice)}</span>
                        <span className="mx-1.5 text-gray-300">→</span>
                        <span className={`text-xs font-bold ${listing.yourPrice <= listing.avgPrice ? 'text-emerald-500' : 'text-orange-500'}`}>
                          {formatMoney(listing.yourPrice)}
                          {listing.yourPrice < listing.avgPrice ? ' ↓ Below avg' : listing.yourPrice > listing.avgPrice ? ' ↑ Above avg' : ' = At avg'}
                        </span>
                      </div>
                    </div>

                    {/* Conversion */}
                    <div className="flex items-center justify-between py-2.5 border-t border-gray-50 dark:border-white/5">
                      <span className="text-xs text-gray-500">Conversion Rate</span>
                      <span className={`text-xs font-bold ${listing.conversion >= 3 ? 'text-emerald-500' : listing.conversion >= 2 ? 'text-brand-gold' : 'text-orange-500'}`}>
                        {listing.conversion}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          AUDIENCE SECTION
      ══════════════════════════════════════════════════════ */}
      {activeSection === 'audience' && (
        <>
          {/* ── Viewer Locations ───────────────────────────── */}
          <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
              <MapPin size={14} className="text-brand-gold" /> Where Your Viewers Are
            </h3>
            <div className="space-y-2.5">
              {MOCK_AUDIENCE.locations.map(({ name, pct }) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{name}</span>
                    <span className="text-xs font-bold text-brand-charcoal-dark dark:text-white">{pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden bg-gray-100 rounded-full dark:bg-white/5">
                    <div className="h-full transition-all duration-700 rounded-full bg-brand-gold/60" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Diaspora highlight */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-start gap-2.5">
              <Globe size={14} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>12% diaspora viewers.</strong> Consider adding virtual tour videos and accepting international payment methods to convert this audience.
              </p>
            </div>
          </div>

          {/* ── Device Split ───────────────────────────────── */}
          <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">Device Breakdown</h3>
            <div className="flex gap-3">
              {[
                { label: 'Mobile', pct: MOCK_AUDIENCE.devices.mobile, icon: Smartphone, color: 'bg-brand-gold' },
                { label: 'Desktop', pct: MOCK_AUDIENCE.devices.desktop, icon: Monitor, color: 'bg-blue-500' },
                { label: 'Tablet', pct: MOCK_AUDIENCE.devices.tablet, icon: Monitor, color: 'bg-purple-500' },
              ].map(({ label, pct, icon: Icon, color }) => (
                <div key={label} className="flex-1 text-center">
                  <div className="relative flex items-end justify-center w-full h-24 p-2 overflow-hidden bg-gray-50 dark:bg-white/5 rounded-xl">
                    <div className={`w-full ${color}/20 rounded-lg transition-all duration-700`} style={{ height: `${pct}%` }}>
                      <div className={`w-full h-full ${color} rounded-lg opacity-60`} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Icon size={14} className="text-gray-400 mx-auto mb-0.5" />
                    <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{pct}%</p>
                    <p className="text-[10px] text-gray-400">{label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl flex items-start gap-2.5">
              <Smartphone size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>72% mobile users.</strong> Ensure your photos load fast and look great on small screens. Vertical photos perform better on mobile.
              </p>
            </div>
          </div>

          {/* ── Referral Sources ───────────────────────────── */}
          <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">How People Find You</h3>
            <div className="space-y-2">
              {MOCK_AUDIENCE.referrals.map(({ source, pct, icon: Icon }) => (
                <div key={source} className="flex items-center gap-3 py-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 shrink-0">
                    <Icon size={14} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{source}</span>
                      <span className="text-xs font-bold text-brand-charcoal-dark dark:text-white">{pct}%</span>
                    </div>
                    <div className="h-1 overflow-hidden bg-gray-100 rounded-full dark:bg-white/5">
                      <div className="h-full rounded-full bg-brand-gold" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Peak Hours Heatmap ─────────────────────────── */}
          <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="mb-1 text-sm font-semibold text-brand-charcoal-dark dark:text-white">Peak Viewing Hours</h3>
            <p className="text-[11px] text-gray-400 mb-4">Darker = more viewers. Be online during peak hours to respond faster.</p>

            {/* Header row */}
            <div className="flex gap-1 mb-1">
              <div className="w-10 shrink-0" />
              {DAYS_SHORT.map((d) => (
                <div key={d} className="flex-1 text-center text-[9px] font-semibold text-gray-400">{d}</div>
              ))}
            </div>

            {/* Heatmap rows */}
            <div className="space-y-1">
              {MOCK_PEAK_HOURS.map(([hour, ...vals]) => (
                <div key={hour} className="flex gap-1">
                  <div className="w-10 shrink-0 text-[9px] text-gray-400 flex items-center">{hour}</div>
                  {vals.map((v, i) => (
                    <div key={i} className={`flex-1 h-6 rounded-md ${getHeatColor(v)} transition-colors group relative`}>
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] bg-gray-800 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {v * 10}% activity
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-1 mt-3">
              <span className="text-[9px] text-gray-400">Low</span>
              {[2, 4, 6, 8, 10].map((v) => (
                <div key={v} className={`w-4 h-2.5 rounded-sm ${getHeatColor(v)}`} />
              ))}
              <span className="text-[9px] text-gray-400">High</span>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          COMPETITIVE SECTION
      ══════════════════════════════════════════════════════ */}
      {activeSection === 'competitive' && (
        <>
          {/* Market position overview */}
          <div className="p-5 text-white bg-brand-charcoal-dark rounded-2xl">
            <p className="mb-3 text-xs font-semibold tracking-wider text-gray-400 uppercase">Your Market Position</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Award size={20} className="text-brand-gold mx-auto mb-1.5" />
                <p className="text-2xl font-bold font-display">#3</p>
                <p className="text-[10px] text-gray-400">Avg Search Rank</p>
              </div>
              <div className="text-center">
                <Target size={20} className="text-emerald-400 mx-auto mb-1.5" />
                <p className="text-2xl font-bold font-display">Top 15%</p>
                <p className="text-[10px] text-gray-400">Provider Tier</p>
              </div>
              <div className="text-center">
                <Crown size={20} className="text-purple-400 mx-auto mb-1.5" />
                <p className="text-2xl font-bold font-display">82</p>
                <p className="text-[10px] text-gray-400">Quality Score</p>
              </div>
            </div>
          </div>

          {/* Area price comparison */}
          <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="mb-1 text-sm font-semibold text-brand-charcoal-dark dark:text-white">Price Comparison by Area</h3>
            <p className="text-[11px] text-gray-400 mb-4">How your pricing compares to similar listings</p>

            <div className="space-y-4">
              {sortedListings.filter((l) => l.status === 'active').map((listing) => {
                const diff = ((listing.yourPrice - listing.avgPrice) / listing.avgPrice * 100).toFixed(0);
                const isBelow = listing.yourPrice <= listing.avgPrice;
                return (
                  <div key={listing.id}>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate mb-1.5">{listing.title}</p>
                    <div className="relative h-8 overflow-hidden rounded-lg bg-gray-50 dark:bg-white/5">
                      {/* Average price marker */}
                      <div className="absolute top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-white/20 z-10" style={{ left: '50%' }} />
                      {/* Your price bar */}
                      <div
                        className={`absolute top-1 bottom-1 rounded-md ${isBelow ? 'bg-emerald-500/60' : 'bg-orange-500/60'}`}
                        style={{
                          left: isBelow ? `${50 + Number(diff) / 2}%` : '50%',
                          width: `${Math.abs(Number(diff)) / 2}%`,
                          minWidth: '8px',
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-400">Area avg: {formatMoney(listing.avgPrice)}</span>
                      <span className={`text-[10px] font-bold ${isBelow ? 'text-emerald-500' : 'text-orange-500'}`}>
                        Your price: {formatMoney(listing.yourPrice)} ({diff}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How to improve */}
          <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="flex items-center gap-2 mb-3 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
              <Zap size={14} className="text-brand-gold" /> How to Climb Rankings
            </h3>
            <div className="space-y-2.5">
              {[
                { label: 'Complete ID verification', impact: 'High', done: false, icon: Shield },
                { label: 'Add 10+ photos per listing', impact: 'High', done: true, icon: Camera },
                { label: 'Write 200+ word descriptions', impact: 'Medium', done: false, icon: FileText },
                { label: 'Respond to inquiries within 1 hour', impact: 'High', done: true, icon: Clock },
                { label: 'Add virtual tour video', impact: 'Medium', done: false, icon: Play },
                { label: 'Get 5+ reviews from clients', impact: 'High', done: false, icon: Star },
                { label: 'Enable fee transparency', impact: 'Medium', done: true, icon: DollarSign },
                { label: 'Keep prices within area average', impact: 'Low', done: true, icon: Target },
              ].map(({ label, impact, done, icon: Icon }) => (
                <div key={label} className="flex items-center gap-3 py-1.5">
                  {done
                    ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    : <div className="w-4 h-4 border-2 border-gray-300 rounded-full dark:border-gray-600 shrink-0" />
                  }
                  <span className={`text-sm flex-1 ${done ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>{label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                    ${impact === 'High' ? 'bg-red-50 dark:bg-red-500/10 text-red-500'
                      : impact === 'Medium' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                    }`}>
                    {impact}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-3">
              Complete high-impact actions first. Each action improves your quality score and search ranking.
            </p>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          REVENUE SECTION
      ══════════════════════════════════════════════════════ */}
      {activeSection === 'revenue' && (
        <>
          {/* Revenue cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 p-5 text-white bg-brand-charcoal-dark rounded-2xl sm:col-span-1">
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">This Month</p>
              <p className="mt-2 text-3xl font-bold font-display">{formatMoney(MOCK_REVENUE.thisMonth)}</p>
              <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400">
                <ArrowUpRight size={12} />
                +{pctChange(MOCK_REVENUE.thisMonth, MOCK_REVENUE.lastMonth)}% vs last month
              </div>
            </div>
            <div className="col-span-2 p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card sm:col-span-1">
              <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Projected</p>
              <p className="mt-2 text-3xl font-bold font-display text-brand-charcoal-dark dark:text-white">{formatMoney(MOCK_REVENUE.projected)}</p>
              <p className="text-[11px] text-gray-400 mt-1">Based on current trajectory</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-card">
              <p className="text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">{formatMoney(MOCK_REVENUE.totalEarnings)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Lifetime Earnings</p>
            </div>
            <div className="p-4 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-card">
              <p className="text-lg font-bold font-display text-brand-gold">{formatMoney(MOCK_REVENUE.pending)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Pending / Escrow</p>
            </div>
            <div className="p-4 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-card">
              <p className="text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">{formatMoney(MOCK_REVENUE.lastMonth)}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Last Month</p>
            </div>
          </div>

          {/* Revenue per listing */}
          <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">Revenue per Listing</h3>
            <div className="space-y-3">
              {sortedListings.map((l) => {
                const mockRevenue = Math.round(l.inquiries * 15000 * (l.conversion / 100));
                const maxRev = Math.max(...sortedListings.map((x) => Math.round(x.inquiries * 15000 * (x.conversion / 100))), 1);
                return (
                  <div key={l.id}>
                    <div className="flex items-center justify-between mb-1 text-sm">
                      <span className="truncate text-gray-600 dark:text-gray-400 max-w-[65%]">{l.title}</span>
                      <span className="font-bold text-brand-charcoal-dark dark:text-white shrink-0">{formatMoney(mockRevenue)}</span>
                    </div>
                    <div className="h-2 overflow-hidden bg-gray-100 rounded-full dark:bg-white/5">
                      <div className="h-full transition-all duration-500 rounded-full bg-emerald-500/60" style={{ width: `${(mockRevenue / maxRev) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue insight */}
          <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
            <TrendingUp size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-700 dark:text-emerald-300">
              <p className="font-semibold mb-0.5">Revenue Insight</p>
              <p>Your earnings are growing {pctChange(MOCK_REVENUE.thisMonth, MOCK_REVENUE.lastMonth)}% month-over-month. At this rate, you could hit {formatMoney(MOCK_REVENUE.projected * 12)} in annual earnings. Consider adding more listings in high-demand areas like Lekki and Ikoyi.</p>
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          FUNNEL SECTION
      ══════════════════════════════════════════════════════ */}
      {activeSection === 'funnel' && (
        <>
          <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="mb-1 text-sm font-semibold text-brand-charcoal-dark dark:text-white">Conversion Funnel</h3>
            <p className="text-[11px] text-gray-400 mb-5">Track how viewers move from discovering your listing to closing a deal</p>

            <div className="space-y-1">
              {funnelSteps.map((step, i) => {
                const maxWidth = 100;
                const width = i === 0 ? maxWidth : Math.max(8, (step.value / funnelSteps[0].value) * maxWidth);
                const dropoff = i > 0 ? ((funnelSteps[i - 1].value - step.value) / funnelSteps[i - 1].value * 100).toFixed(0) : 0;
                return (
                  <div key={step.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 dark:text-gray-400">{step.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-brand-charcoal-dark dark:text-white">{formatNum(step.value)}</span>
                        {i > 0 && (
                          <span className="text-[9px] text-red-400">-{dropoff}%</span>
                        )}
                      </div>
                    </div>
                    <div className="relative mb-2 h-7">
                      <div
                        className="relative h-full overflow-hidden transition-all duration-700 rounded-lg bg-brand-gold/20 dark:bg-brand-gold/15"
                        style={{ width: `${width}%` }}
                      >
                        <div className="absolute inset-0 rounded-lg bg-brand-gold/30" style={{ width: `${Math.min(100, Number(step.pct))}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Funnel insights */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <Percent size={14} className="text-brand-gold" />
                <span className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">Response Rate</span>
              </div>
              <p className="text-3xl font-bold font-display text-emerald-500">
                {((funnel.responses / funnel.inquiries) * 100).toFixed(0)}%
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                You responded to {funnel.responses} of {funnel.inquiries} inquiries
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={14} className="text-purple-500" />
                <span className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">Close Rate</span>
              </div>
              <p className="text-3xl font-bold text-purple-500 font-display">
                {((funnel.dealsClosed / funnel.inquiries) * 100).toFixed(1)}%
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                {funnel.dealsClosed} deals from {funnel.inquiries} inquiries
              </p>
            </div>
          </div>

          {/* Biggest drop-off */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 dark:text-amber-300">
              <p className="font-semibold mb-0.5">Biggest Drop-off: Views → Saves ({((1 - funnel.saves / funnel.views) * 100).toFixed(0)}% lost)</p>
              <p>Most visitors view but don't save. Improve your cover photos, add more detail to descriptions, and ensure your pricing is competitive to encourage more saves.</p>
            </div>
          </div>

          {/* Tips */}
          <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="flex items-center gap-2 mb-3 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
              <Zap size={14} className="text-brand-gold" /> Improve Your Funnel
            </h3>
            <div className="space-y-3">
              {[
                { stage: 'Search → Click', tip: 'Use descriptive titles with area name + property type. Add the best photo as cover.', metric: 'CTR: ' + kpi.ctr + '%' },
                { stage: 'Click → Save', tip: 'First 3 photos decide if users save. Show living room, bedroom, and kitchen first.', metric: 'Save rate: ' + ((funnel.saves / funnel.views) * 100).toFixed(1) + '%' },
                { stage: 'Save → Inquiry', tip: 'Enable inspection booking and add WhatsApp contact for instant communication.', metric: 'Inquiry rate: ' + ((funnel.inquiries / funnel.saves) * 100).toFixed(1) + '%' },
                { stage: 'Inquiry → Close', tip: 'Respond within 1 hour. Offer flexible inspection times. Be transparent about all fees.', metric: 'Close rate: ' + ((funnel.dealsClosed / funnel.inquiries) * 100).toFixed(1) + '%' },
              ].map(({ stage, tip, metric }) => (
                <div key={stage} className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">{stage}</span>
                    <span className="text-[10px] font-mono text-gray-400">{metric}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}