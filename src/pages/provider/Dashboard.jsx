import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Eye, Package, BarChart2, Wallet, Star, TrendingUp,
  TrendingDown, Users, MessageCircle, DollarSign, PlusCircle,
  MoreVertical, ToggleLeft, ToggleRight, Trash2, Edit,
  AlertCircle, CheckCircle, Clock, ArrowUpRight,
  Phone, Shield, Zap, Award, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import DashboardLayout from '../Layout/DashboardLayout.jsx';
import { getProperties } from '../../services/property.service.js';

/* ── Sub-page imports ─────────────────────────────────────── */
import Messages    from './Messages.jsx';
import Agreements  from './Agreements.jsx';
import Reviews     from './Reviews.jsx';
import Settings    from './Settings.jsx';
import Profile from './Profile.jsx';

/* ════════════════════════════════════════════════════════════
   PROVIDER DASHBOARD — URL-aware routing

   Routes handled:
   /provider              → Overview
   /provider/listings     → Listings management
   /provider/messages     → Provider messages
   /provider/analytics    → Analytics (inline summary)
   /provider/payouts      → Payout management
   /provider/agreements   → Contracts & agreements
   /provider/reviews      → Review management
   /provider/settings     → Comprehensive settings
   /provider/profile      → Provider profile editor
════════════════════════════════════════════════════════════ */

/* ── Mock data ────────────────────────────────────────────── */
const MOCK_LISTINGS = [
  { id: 'l1', title: '3 Bedroom Flat in Lekki Phase 1', category: 'rental', price: 2500000, priceUnit: '/yr', location: 'Lekki, Lagos', views: 342, inquiries: 12, active: true, image: null },
  { id: 'l2', title: 'Land for Sale — 500sqm Ibeju-Lekki', category: 'land', price: 15000000, priceUnit: '', location: 'Ibeju-Lekki, Lagos', views: 198, inquiries: 5, active: true, image: null },
  { id: 'l3', title: 'Shared Apartment — Male Only', category: 'shared', price: 450000, priceUnit: '/yr', location: 'Yaba, Lagos', views: 87, inquiries: 3, active: false, image: null },
];

const CATEGORY_EMOJI = {
  rental: '🏠', shortlet: '🏨', buy: '🏡', land: '🗺️',
  shared: '👥', lease: '📋', service: '🔧', product: '📦',
};

function formatMoney(n) {
  if (n >= 1_000_000) return '₦' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '₦' + (n / 1_000).toFixed(0) + 'K';
  return '₦' + n.toLocaleString();
}

/* ── Resolve current sub-page from URL ────────────────────── */
function getPageFromPath(pathname) {
  const segments = pathname.replace(/^\/provider\/?/, '').split('/').filter(Boolean);
  if (segments.length === 0) return 'overview';
  return segments[0]; // listings, messages, analytics, payouts, agreements, reviews, settings, profile
}

export default function ProviderDashboard() {
  const { user }     = useAuth();
  const location     = useLocation();
  const navigate     = useNavigate();
  const currentPage  = getPageFromPath(location.pathname);

  const [listings, setListings]           = useState(MOCK_LISTINGS);
  const [listingFilter, setListingFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');
  const [actionMenu, setActionMenu]       = useState(null);

  /* ── Fetch real listings when available ───────────────────── */
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const res = await getProperties({ providerId: user.id, limit: 50 });
        if (res.success && res.properties?.length) setListings(res.properties.map(p => ({
          id: p.id, title: p.title, category: p.type || p.category || 'rental',
          price: p.price || 0, priceUnit: p.price_unit || '', location: p.location || '',
          views: p.views || 0, inquiries: p.inquiries || 0, active: p.active !== false,
          image: p.image || p.images?.[0] || null,
        })));
      } catch { /* keep mock fallback */ }
    })();
  }, [user?.id]);

  /* ── Listing actions ────────────────────────────────────── */
  const toggleListing = (id) => {
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, active: !l.active } : l));
    setActionMenu(null);
  };
  const deleteListing = (id) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
    setDeleteConfirm(null);
    setActionMenu(null);
  };

  const filtered = listingFilter === 'all' ? listings
    : listingFilter === 'active' ? listings.filter((l) => l.active)
    : listings.filter((l) => !l.active);

  const totalViews     = listings.reduce((s, l) => s + l.views, 0);
  const totalInquiries = listings.reduce((s, l) => s + l.inquiries, 0);
  const activeCount    = listings.filter((l) => l.active).length;

  /* ── Delegate to sub-pages ──────────────────────────────── */
  if (currentPage === 'messages')   return <DashboardLayout><Messages /></DashboardLayout>;
  if (currentPage === 'agreements') return <DashboardLayout><Agreements /></DashboardLayout>;
  if (currentPage === 'reviews')    return <DashboardLayout><Reviews /></DashboardLayout>;
  if (currentPage === 'settings')   return <DashboardLayout><Settings /></DashboardLayout>;
  if (currentPage === 'profile')    return <DashboardLayout><Profile /></DashboardLayout>;

  /* ═══════════════════════════════════════════════════════════
     TAB-BASED PAGES: Overview, Listings, Analytics, Payouts
     These remain inline for quick switching
  ═══════════════════════════════════════════════════════════ */
  const TAB_MAP = { overview: 0, listings: 1, analytics: 2, payouts: 3 };
  const tabKey = TAB_MAP[currentPage] !== undefined ? currentPage : 'overview';

  const TABS = [
    { id: 'overview',  label: 'Overview',  icon: Eye,      path: '/provider' },
    { id: 'listings',  label: 'Listings',  icon: Package,  path: '/provider/listings' },
    { id: 'analytics', label: 'Analytics', icon: BarChart2, path: '/provider/analytics' },
    { id: 'payouts',   label: 'Payouts',   icon: Wallet,   path: '/provider/payouts' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* ── Welcome Banner ─────────────────────────────── */}
        <div className="p-5 text-white bg-gradient-to-br from-brand-charcoal-dark to-gray-800 rounded-2xl">
          <h1 className="text-lg font-bold font-display">
            Welcome back, {user?.name?.split(' ')[0] || 'Provider'} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-300">
            {activeCount} active listing{activeCount !== 1 ? 's' : ''} · {totalViews.toLocaleString()} total views
          </p>
          <div className="flex gap-2 mt-3">
            <Link to="/provider/listings/new"
              className="bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark text-xs font-semibold px-4 py-2.5 rounded-full transition-all active:scale-[0.97] flex items-center gap-1.5">
              <PlusCircle size={14} /> Add Listing
            </Link>
            <Link to="/provider/profile"
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-full transition-all active:scale-[0.97] flex items-center gap-1.5">
              <Edit size={14} /> Edit Profile
            </Link>
          </div>
        </div>

        {/* ── Tab bar ────────────────────────────────────── */}
        <div className="flex gap-1 p-1 overflow-x-auto bg-gray-100 dark:bg-white/5 rounded-xl scrollbar-hide">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tabKey === t.id;
            return (
              <Link key={t.id} to={t.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                  ${active
                    ? 'bg-white dark:bg-gray-800 text-brand-charcoal-dark dark:text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}>
                <Icon size={14} />
                {t.label}
              </Link>
            );
          })}
        </div>

        {/* ══════════════════ OVERVIEW TAB ═══════════════════ */}
        {tabKey === 'overview' && (
          <div className="space-y-5">
            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: 'Active Listings', value: activeCount, icon: Package, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                { label: 'Total Views', value: totalViews.toLocaleString(), icon: Eye, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', trend: '+12%' },
                { label: 'Inquiries', value: totalInquiries, icon: MessageCircle, color: 'text-brand-gold', bg: 'bg-yellow-50 dark:bg-yellow-500/10', trend: '+8%' },
                { label: 'Est. Revenue', value: '₦3.2M', icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10' },
              ].map((s, i) => (
                <div key={i} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                  <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>
                    <s.icon size={16} className={s.color} />
                  </div>
                  <p className="text-lg font-bold text-brand-charcoal-dark dark:text-white">{s.value}</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-gray-400">{s.label}</p>
                    {s.trend && (
                      <span className="text-[10px] text-emerald-500 font-medium flex items-center">
                        <TrendingUp size={10} /> {s.trend}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                { label: 'Messages', count: 3, icon: MessageCircle, path: '/provider/messages', color: 'text-blue-500' },
                { label: 'Reviews', count: 5, icon: Star, path: '/provider/reviews', color: 'text-brand-gold' },
                { label: 'Agreements', count: 2, icon: Shield, path: '/provider/agreements', color: 'text-emerald-500' },
                { label: 'Profile', icon: Edit, path: '/provider/profile', color: 'text-purple-500' },
              ].map((a, i) => (
                <Link key={i} to={a.path}
                  className="p-4 transition-shadow bg-white dark:bg-gray-900 rounded-2xl shadow-card hover:shadow-md group">
                  <div className="flex items-center justify-between">
                    <a.icon size={18} className={a.color} />
                    {a.count && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {a.count}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-brand-charcoal-dark dark:text-white">{a.label}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5 group-hover:text-brand-gold transition-colors">
                    View <ChevronRight size={12} />
                  </div>
                </Link>
              ))}
            </div>

            {/* Recent listings preview */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Recent Listings</h3>
                <Link to="/provider/listings" className="text-xs font-medium text-brand-gold hover:text-brand-gold-dark">
                  View all →
                </Link>
              </div>
              <div className="space-y-2">
                {listings.slice(0, 3).map((l) => (
                  <div key={l.id} className="flex items-center gap-3 p-2 transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-white/5">
                    <div className="flex items-center justify-center w-10 h-10 text-lg bg-gray-100 rounded-lg dark:bg-white/10 shrink-0">
                      {CATEGORY_EMOJI[l.category] || '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-brand-charcoal-dark dark:text-white">{l.title}</p>
                      <p className="text-xs text-gray-400">{l.location} · {l.views} views</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${l.active ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-gray-100 dark:bg-white/10 text-gray-400'}`}>
                      {l.active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Provider tier */}
            <div className="p-4 border bg-gradient-to-r from-brand-gold/10 to-yellow-50 dark:from-brand-gold/5 dark:to-transparent rounded-2xl border-brand-gold/20">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-gold">
                  <Award size={18} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Verified Provider</p>
                  <p className="text-xs text-gray-500">Complete your profile to reach Pro tier</p>
                </div>
                <Link to="/provider/settings" className="text-xs font-medium text-brand-gold hover:text-brand-gold-dark">
                  Upgrade →
                </Link>
              </div>
              <div className="h-2 mt-3 overflow-hidden rounded-full bg-white/60 dark:bg-white/5">
                <div className="h-full rounded-full bg-brand-gold" style={{ width: '65%' }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">65% complete — Add bank details & CAC document to reach Pro</p>
            </div>
          </div>
        )}

        {/* ══════════════════ LISTINGS TAB ═══════════════════ */}
        {tabKey === 'listings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {['all', 'active', 'paused'].map((f) => (
                  <button key={f} onClick={() => setListingFilter(f)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors capitalize
                      ${listingFilter === f ? 'bg-brand-charcoal-dark text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200'}`}>
                    {f} {f === 'all' ? `(${listings.length})` : f === 'active' ? `(${activeCount})` : `(${listings.length - activeCount})`}
                  </button>
                ))}
              </div>
              <Link to="/provider/listings/new"
                className="bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark text-xs font-semibold px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                <PlusCircle size={12} /> Add
              </Link>
            </div>

            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Package size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-400">No {listingFilter !== 'all' ? listingFilter + ' ' : ''}listings</p>
                <Link to="/provider/listings/new" className="inline-block mt-2 text-xs font-medium text-brand-gold">
                  Add your first listing →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((l) => (
                  <div key={l.id} className="relative p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                    <div className="flex gap-3">
                      <div className="flex items-center justify-center w-16 h-16 text-2xl bg-gray-100 dark:bg-white/10 rounded-xl shrink-0">
                        {CATEGORY_EMOJI[l.category] || '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">{l.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{l.location}</p>
                          </div>
                          <div className="relative">
                            <button onClick={() => setActionMenu(actionMenu === l.id ? null : l.id)}
                              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                              <MoreVertical size={14} className="text-gray-400" />
                            </button>
                            {actionMenu === l.id && (
                              <>
                                <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
                                <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-white/10 py-1 min-w-[140px]">
                                  <button onClick={() => { navigate(`/provider/listings/${l.id}/edit`); setActionMenu(null); }}
                                    className="flex items-center w-full gap-2 px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5">
                                    <Edit size={12} /> Edit
                                  </button>
                                  <button onClick={() => toggleListing(l.id)}
                                    className="flex items-center w-full gap-2 px-3 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5">
                                    {l.active ? <ToggleLeft size={12} /> : <ToggleRight size={12} />}
                                    {l.active ? 'Pause' : 'Activate'}
                                  </button>
                                  <button onClick={() => { setDeleteConfirm(l.id); setActionMenu(null); }}
                                    className="flex items-center w-full gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                                    <Trash2 size={12} /> Delete
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm font-bold text-brand-gold">{formatMoney(l.price)}{l.priceUnit}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${l.active ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-gray-100 dark:bg-white/10 text-gray-400'}`}>
                            {l.active ? 'Active' : 'Paused'}
                          </span>
                        </div>
                        <div className="flex gap-4 mt-2">
                          <span className="flex items-center gap-1 text-xs text-gray-400"><Eye size={11} /> {l.views}</span>
                          <span className="flex items-center gap-1 text-xs text-gray-400"><MessageCircle size={11} /> {l.inquiries}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete confirmation */}
                    {deleteConfirm === l.id && (
                      <div className="flex items-center justify-between p-3 mt-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
                        <p className="text-xs text-red-600">Delete this listing?</p>
                        <div className="flex gap-2">
                          <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1 text-xs text-gray-600 bg-white rounded-lg shadow-sm dark:bg-gray-800">Cancel</button>
                          <button onClick={() => deleteListing(l.id)} className="px-3 py-1 text-xs text-white bg-red-500 rounded-lg">Delete</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════ ANALYTICS TAB ═══════════════════ */}
        {tabKey === 'analytics' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              {['7d', '30d', '90d'].map((p) => (
                <button key={p} onClick={() => setAnalyticsPeriod(p)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors
                    ${analyticsPeriod === p ? 'bg-brand-charcoal-dark text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500'}`}>
                  {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Profile Views', value: '1,247', change: '+15%', up: true },
                { label: 'Listing Views', value: totalViews.toLocaleString(), change: '+12%', up: true },
                { label: 'Inquiries', value: totalInquiries.toString(), change: '+8%', up: true },
                { label: 'Response Rate', value: '94%', change: '-2%', up: false },
                { label: 'Avg Response Time', value: '2.3hrs', change: '-18%', up: true },
                { label: 'Conversion Rate', value: '23%', change: '+5%', up: true },
              ].map((s, i) => (
                <div key={i} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className="mt-1 text-lg font-bold text-brand-charcoal-dark dark:text-white">{s.value}</p>
                  <span className={`text-[10px] font-medium flex items-center gap-0.5 mt-1 ${s.up ? 'text-emerald-500' : 'text-red-500'}`}>
                    {s.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {s.change}
                  </span>
                </div>
              ))}
            </div>

            <Link to="/provider/analytics"
              className="block py-3 text-sm font-medium text-center bg-white text-brand-gold hover:text-brand-gold-dark dark:bg-gray-900 rounded-2xl shadow-card">
              View Full Analytics Dashboard →
            </Link>
          </div>
        )}

        {/* ══════════════════ PAYOUTS TAB ═══════════════════ */}
        {tabKey === 'payouts' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                <p className="text-xs text-gray-400">Available Balance</p>
                <p className="mt-1 text-xl font-bold text-emerald-600">₦1,250,000</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                <p className="text-xs text-gray-400">Pending</p>
                <p className="mt-1 text-xl font-bold text-brand-gold">₦450,000</p>
              </div>
            </div>

            <button className="w-full py-3 text-sm font-semibold transition-colors bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark rounded-xl">
              Request Withdrawal
            </button>

            <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
              <h3 className="mb-3 text-sm font-semibold text-brand-charcoal-dark dark:text-white">Recent Transactions</h3>
              <div className="space-y-2">
                {[
                  { label: 'Rental payment — 3BR Lekki', amount: '+₦625,000', status: 'completed', date: 'Feb 10' },
                  { label: 'Service booking — Plumbing', amount: '+₦85,000', status: 'completed', date: 'Feb 8' },
                  { label: 'Withdrawal to GTBank', amount: '-₦500,000', status: 'completed', date: 'Feb 5' },
                  { label: 'Product sale — Generator', amount: '+₦350,000', status: 'pending', date: 'Feb 3' },
                ].map((tx, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5">
                    <div>
                      <p className="text-sm text-brand-charcoal-dark dark:text-white">{tx.label}</p>
                      <p className="text-[10px] text-gray-400">{tx.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${tx.amount.startsWith('+') ? 'text-emerald-600' : 'text-red-500'}`}>{tx.amount}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                        ${tx.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600'}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl">
              <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Payout Settings</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                  Configure your bank details and withdrawal preferences in{' '}
                  <Link to="/provider/settings" className="font-medium underline">Provider Settings</Link>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}