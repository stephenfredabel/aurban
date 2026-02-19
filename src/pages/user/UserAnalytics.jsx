import { useState, useEffect } from 'react';
import {
  Eye, MessageCircle, Heart, ShoppingCart,
  TrendingUp, TrendingDown, ArrowUpRight,
  BarChart2, MapPin, Clock, Star,
  Package, Calendar, Wallet, Activity,
  Home, Search, CheckCircle2, Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

/* ════════════════════════════════════════════════════════════
   USER ANALYTICS — Personal activity, spending & market insights

   Sections:
   1. Activity Overview — views, inquiries, saves, orders
   2. Spending Analytics — monthly chart, category breakdown
   3. Market Insights — area price trends, popular categories
   4. Engagement — provider response rates, conversion, reviews
════════════════════════════════════════════════════════════ */

/* ── Mock data (replace with API calls in production) ─────── */
const MOCK_ACTIVITY = {
  '7d':  { propertiesViewed: 23, inquiriesSent: 4, itemsSaved: 8, ordersPlaced: 1, totalSpend: 45000 },
  '30d': { propertiesViewed: 87, inquiriesSent: 14, itemsSaved: 26, ordersPlaced: 3, totalSpend: 185000 },
  '90d': { propertiesViewed: 234, inquiriesSent: 42, itemsSaved: 67, ordersPlaced: 8, totalSpend: 520000 },
};

const MOCK_ACTIVITY_PREV = {
  '7d':  { propertiesViewed: 19, inquiriesSent: 3, itemsSaved: 5, ordersPlaced: 0, totalSpend: 0 },
  '30d': { propertiesViewed: 72, inquiriesSent: 11, itemsSaved: 20, ordersPlaced: 2, totalSpend: 125000 },
  '90d': { propertiesViewed: 198, inquiriesSent: 35, itemsSaved: 52, ordersPlaced: 6, totalSpend: 380000 },
};

const MOCK_SPENDING_MONTHLY = [
  { month: 'Sep', amount: 45000 },
  { month: 'Oct', amount: 78000 },
  { month: 'Nov', amount: 62000 },
  { month: 'Dec', amount: 125000 },
  { month: 'Jan', amount: 95000 },
  { month: 'Feb', amount: 115000 },
];

const MOCK_SPENDING_CATEGORY = [
  { category: 'Building Materials', amount: 285000, orders: 4, pct: 55, color: 'bg-brand-gold' },
  { category: 'Rentals / Deposits', amount: 120000, orders: 1, pct: 23, color: 'bg-blue-500' },
  { category: 'Pro Services', amount: 75000, orders: 2, pct: 14, color: 'bg-purple-500' },
  { category: 'Furniture', amount: 40000, orders: 1, pct: 8, color: 'bg-emerald-500' },
];

const MOCK_MARKET_INSIGHTS = [
  { area: 'Lekki Phase 1, Lagos', category: 'Rental', avgPrice: '₦1.8M/yr', trend: '+5%', up: true, newListings: 12 },
  { area: 'Yaba, Lagos', category: 'Shared', avgPrice: '₦450K/yr', trend: '+2%', up: true, newListings: 8 },
  { area: 'Ibeju-Lekki, Lagos', category: 'Land', avgPrice: '₦12M', trend: '-3%', up: false, newListings: 24 },
  { area: 'Wuse 2, Abuja', category: 'Rental', avgPrice: '₦2.5M/yr', trend: '+8%', up: true, newListings: 6 },
];

const MOCK_POPULAR_CATEGORIES = [
  { name: 'Rentals', pct: 35, searches: 42 },
  { name: 'Building Materials', pct: 28, searches: 34 },
  { name: 'Land', pct: 18, searches: 22 },
  { name: 'Shortlets', pct: 12, searches: 15 },
  { name: 'Services', pct: 7, searches: 9 },
];

const MOCK_ENGAGEMENT = {
  providerResponseRate: 78,
  avgProviderResponseTime: '2.4 hours',
  inquiriesSent: 42,
  bookingsCompleted: 5,
  reviewsGiven: 3,
  avgRatingGiven: 4.6,
  savedToInquiryRate: 21,
  inquiryToBookingRate: 12,
};

/* ── Helpers ──────────────────────────────────────────────── */
function formatMoney(n) {
  if (n >= 1_000_000) return '₦' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '₦' + (n / 1_000).toFixed(0) + 'K';
  return '₦' + n.toLocaleString();
}

function pctChange(curr, prev) {
  if (!prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

export default function UserAnalytics() {
  useAuth();
  const [period, setPeriod] = useState('30d');
  const [activeSection, setActiveSection] = useState('activity');
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = 'Analytics — Aurban'; }, []);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(t);
  }, [period, activeSection]);

  const activity = MOCK_ACTIVITY[period] || MOCK_ACTIVITY['30d'];
  const prev = MOCK_ACTIVITY_PREV[period] || MOCK_ACTIVITY_PREV['30d'];
  const maxSpend = Math.max(...MOCK_SPENDING_MONTHLY.map(d => d.amount));
  const engagement = MOCK_ENGAGEMENT;

  const sections = [
    { id: 'activity',    label: 'Activity',       icon: BarChart2 },
    { id: 'spending',    label: 'Spending',        icon: Wallet },
    { id: 'market',      label: 'Market Insights', icon: TrendingUp },
    { id: 'engagement',  label: 'Engagement',      icon: Activity },
  ];

  return (
    <div className="pb-8 space-y-5">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
            Analytics
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Your activity, spending patterns & market intelligence
          </p>
        </div>
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

      {/* ── Section tabs ──────────────────────────────────────── */}
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

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-gray-900 rounded-2xl shadow-card animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* ══════════════════════════════════════════════════════
              ACTIVITY SECTION
          ══════════════════════════════════════════════════════ */}
          {activeSection === 'activity' && (
            <div className="space-y-5">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Properties Viewed', value: activity.propertiesViewed, prev: prev.propertiesViewed, icon: Eye, color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' },
                  { label: 'Inquiries Sent', value: activity.inquiriesSent, prev: prev.inquiriesSent, icon: MessageCircle, color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600' },
                  { label: 'Items Saved', value: activity.itemsSaved, prev: prev.itemsSaved, icon: Heart, color: 'bg-rose-50 dark:bg-rose-500/10 text-rose-500' },
                  { label: 'Orders Placed', value: activity.ordersPlaced, prev: prev.ordersPlaced, icon: ShoppingCart, color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' },
                ].map(({ label, value, prev: p, icon: Icon, color }) => {
                  const change = pctChange(value, p);
                  return (
                    <div key={label} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${color}`}>
                        <Icon size={15} />
                      </div>
                      <p className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">{value}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{label}</p>
                      <div className={`flex items-center gap-0.5 mt-1.5 text-[11px] font-semibold
                        ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {change >= 0 ? <ArrowUpRight size={12} /> : <TrendingDown size={12} />}
                        {Math.abs(change)}% vs prev
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total spend card */}
              <div className="p-5 text-white bg-brand-charcoal-dark rounded-2xl">
                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Total Spend ({period})</p>
                <p className="mt-2 text-3xl font-bold font-display">{formatMoney(activity.totalSpend)}</p>
                {prev.totalSpend > 0 && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-emerald-400">
                    <ArrowUpRight size={12} />
                    {pctChange(activity.totalSpend, prev.totalSpend)}% vs previous period
                  </div>
                )}
              </div>

              {/* Quick insights */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
                  <Search size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <p className="font-semibold mb-0.5">Search Activity</p>
                    <p>You viewed {activity.propertiesViewed} properties and saved {activity.itemsSaved} of them. Your save rate is {activity.propertiesViewed > 0 ? Math.round((activity.itemsSaved / activity.propertiesViewed) * 100) : 0}%.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-700 dark:text-emerald-300">
                    <p className="font-semibold mb-0.5">Conversion</p>
                    <p>You converted {activity.inquiriesSent > 0 ? Math.round((activity.ordersPlaced / activity.inquiriesSent) * 100) : 0}% of inquiries into orders.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              SPENDING SECTION
          ══════════════════════════════════════════════════════ */}
          {activeSection === 'spending' && (
            <div className="space-y-5">
              {/* Monthly spending chart */}
              <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                  <BarChart2 size={14} className="text-brand-gold" /> Monthly Spending
                </h3>
                <div className="flex items-end h-40 gap-3">
                  {MOCK_SPENDING_MONTHLY.map((d) => (
                    <div key={d.month} className="flex flex-col items-center flex-1 gap-1">
                      <div
                        className="relative w-full transition-all rounded-t-lg bg-brand-gold/25 dark:bg-brand-gold/30 hover:bg-brand-gold/40 group"
                        style={{ height: `${maxSpend > 0 ? (d.amount / maxSpend) * 100 : 0}%` }}
                      >
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatMoney(d.amount)}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">{d.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spending by category */}
              <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                  <Package size={14} className="text-brand-gold" /> Spending by Category
                </h3>
                <div className="space-y-3">
                  {MOCK_SPENDING_CATEGORY.map((cat) => (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{cat.category}</span>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>{cat.orders} orders</span>
                          <span className="font-bold text-brand-charcoal-dark dark:text-white">{formatMoney(cat.amount)}</span>
                        </div>
                      </div>
                      <div className="h-2 overflow-hidden bg-gray-100 rounded-full dark:bg-white/5">
                        <div className={`h-full rounded-full ${cat.color} transition-all duration-500`} style={{ width: `${cat.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Average order value */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                  <p className="text-[11px] text-gray-400">Average Order Value</p>
                  <p className="mt-1 text-2xl font-bold font-display text-brand-charcoal-dark dark:text-white">
                    {activity.ordersPlaced > 0 ? formatMoney(Math.round(activity.totalSpend / activity.ordersPlaced)) : '—'}
                  </p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                  <p className="text-[11px] text-gray-400">Total Orders</p>
                  <p className="mt-1 text-2xl font-bold font-display text-brand-charcoal-dark dark:text-white">
                    {activity.ordersPlaced}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">In the last {period === '7d' ? '7 days' : period === '30d' ? '30 days' : '90 days'}</p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              MARKET INSIGHTS SECTION
          ══════════════════════════════════════════════════════ */}
          {activeSection === 'market' && (
            <div className="space-y-5">
              {/* Area price trends */}
              <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                <h3 className="flex items-center gap-2 mb-1 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                  <MapPin size={14} className="text-brand-gold" /> Price Trends in Your Areas
                </h3>
                <p className="text-[11px] text-gray-400 mb-4">Based on your saved properties and search history</p>
                <div className="space-y-4">
                  {MOCK_MARKET_INSIGHTS.map((area) => (
                    <div key={area.area} className="p-3 border border-gray-100 dark:border-white/10 rounded-xl">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <p className="text-sm font-medium text-brand-charcoal-dark dark:text-white">{area.area}</p>
                          <p className="text-[10px] text-gray-400">{area.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{area.avgPrice}</p>
                          <span className={`text-[10px] font-semibold flex items-center gap-0.5 justify-end
                            ${area.up ? 'text-emerald-500' : 'text-red-500'}`}>
                            {area.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {area.trend}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Home size={10} /> {area.newListings} new listings this month
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular categories from your searches */}
              <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                  <Search size={14} className="text-brand-gold" /> Your Top Categories
                </h3>
                <div className="space-y-3">
                  {MOCK_POPULAR_CATEGORIES.map((cat) => (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{cat.name}</span>
                        <span className="text-xs font-bold text-brand-charcoal-dark dark:text-white">{cat.searches} searches</span>
                      </div>
                      <div className="h-2 overflow-hidden bg-gray-100 rounded-full dark:bg-white/5">
                        <div className="h-full transition-all duration-500 rounded-full bg-brand-gold/60" style={{ width: `${cat.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tip */}
              <div className="flex items-start gap-3 p-4 bg-brand-gold/5 rounded-2xl">
                <Zap size={16} className="text-brand-gold shrink-0 mt-0.5" />
                <div className="text-xs text-brand-charcoal dark:text-gray-300">
                  <p className="font-semibold mb-0.5">Market Tip</p>
                  <p>Properties in Lekki Phase 1 are trending upward (+5%). If you're looking to rent in this area, consider locking in prices soon. Set up alerts to be notified when new listings match your criteria.</p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════
              ENGAGEMENT SECTION
          ══════════════════════════════════════════════════════ */}
          {activeSection === 'engagement' && (
            <div className="space-y-5">
              {/* Engagement KPI cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                  <div className="flex items-center justify-center w-8 h-8 mb-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">
                    <MessageCircle size={15} />
                  </div>
                  <p className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">{engagement.providerResponseRate}%</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Provider Response Rate</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                  <div className="flex items-center justify-center w-8 h-8 mb-2.5 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600">
                    <Clock size={15} />
                  </div>
                  <p className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">{engagement.avgProviderResponseTime}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Avg Response Time</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                  <div className="flex items-center justify-center w-8 h-8 mb-2.5 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-600">
                    <Calendar size={15} />
                  </div>
                  <p className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">{engagement.bookingsCompleted}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Bookings Completed</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                  <div className="flex items-center justify-center w-8 h-8 mb-2.5 rounded-lg bg-brand-gold/10 text-brand-gold">
                    <Star size={15} />
                  </div>
                  <p className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">{engagement.reviewsGiven}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Reviews Given</p>
                </div>
              </div>

              {/* Conversion funnel */}
              <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                  <Activity size={14} className="text-brand-gold" /> Your Conversion Funnel
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Properties Viewed', value: activity.propertiesViewed, pct: 100 },
                    { label: 'Items Saved', value: activity.itemsSaved, pct: activity.propertiesViewed > 0 ? Math.round((activity.itemsSaved / activity.propertiesViewed) * 100) : 0 },
                    { label: 'Inquiries Sent', value: activity.inquiriesSent, pct: activity.propertiesViewed > 0 ? Math.round((activity.inquiriesSent / activity.propertiesViewed) * 100) : 0 },
                    { label: 'Orders / Bookings', value: activity.ordersPlaced, pct: activity.propertiesViewed > 0 ? Math.round((activity.ordersPlaced / activity.propertiesViewed) * 100) : 0 },
                  ].map((step) => {
                    const width = Math.max(step.pct, 4);
                    return (
                      <div key={step.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{step.label}</span>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="font-bold text-brand-charcoal-dark dark:text-white">{step.value}</span>
                            <span className="text-[10px]">({step.pct}%)</span>
                          </div>
                        </div>
                        <div className="relative h-6 overflow-hidden bg-gray-100 rounded-lg dark:bg-white/5">
                          <div
                            className="h-full transition-all duration-700 rounded-lg bg-brand-gold/30"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Average rating given */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={14} className="text-brand-gold" />
                    <span className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">Avg Rating Given</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold font-display text-brand-gold">{engagement.avgRatingGiven}</p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={12} className={i < Math.round(engagement.avgRatingGiven) ? 'text-brand-gold fill-brand-gold' : 'text-gray-200'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Based on {engagement.reviewsGiven} reviews you've written</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">Inquiry Success Rate</span>
                  </div>
                  <p className="text-3xl font-bold font-display text-emerald-500">{engagement.inquiryToBookingRate}%</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {engagement.bookingsCompleted} of {engagement.inquiriesSent} inquiries led to a booking
                  </p>
                </div>
              </div>

              {/* Tips */}
              <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                <h3 className="flex items-center gap-2 mb-3 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                  <Zap size={14} className="text-brand-gold" /> Tips to Get Better Deals
                </h3>
                <div className="space-y-2.5">
                  {[
                    { tip: 'Send detailed inquiries with your requirements — providers respond 40% faster', done: false },
                    { tip: 'Save listings to compare before reaching out', done: true },
                    { tip: 'Book viewings/inspections early in the week for best availability', done: false },
                    { tip: 'Leave reviews after transactions — reviewed buyers get priority responses', done: engagement.reviewsGiven >= 3 },
                    { tip: 'Set up price alerts for areas you\'re watching', done: false },
                  ].map(({ tip, done }) => (
                    <div key={tip} className="flex items-start gap-3 py-1.5">
                      {done
                        ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                        : <div className="w-4 h-4 mt-0.5 border-2 border-gray-300 rounded-full dark:border-gray-600 shrink-0" />
                      }
                      <span className={`text-sm ${done ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
