import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Eye, MessageCircle, TrendingUp, Wallet,
  PlusCircle, Edit2, Trash2, ToggleLeft, ToggleRight,
  Star, CheckCircle2, ArrowUpRight, Clock, Calendar,
  AlertCircle, FileText, ChevronRight,
  BarChart2, DollarSign, Users, Package,
} from 'lucide-react';
import { useAuth }           from '../context/AuthContext.jsx';
import { isAdminRole }       from '../utils/rbac.js';
import DashboardLayout       from '../Layout/DashboardLayout.jsx';
import * as propertyService  from '../services/property.service.js';

/* ── Sub-page imports ─────────────────────────────────────── */
import ProviderMessages    from './provider/Messages.jsx';
import ProviderAgreements  from './provider/Agreements.jsx';
import ProviderReviews     from './provider/Reviews.jsx';
import ProviderSettings    from './provider/Settings.jsx';
import ProviderProfile     from './provider/Profile.jsx';
import ProviderBookings    from './provider/Bookings.jsx';
import ProviderOrders     from './provider/ProviderOrders.jsx';
import ProviderOrderDetail from './provider/ProviderOrderDetail.jsx';

/* ── Aurban Pro sub-page imports ───────────────────────────── */
import ProviderProBookings    from './provider/ProBookings.jsx';
import ProviderProBookingDetail from './provider/ProBookingDetail.jsx';
import ProviderProListings    from './provider/ProListings.jsx';
import CreateProListing       from './provider/CreateProListing.jsx';
import ProEarnings            from './provider/ProEarnings.jsx';

/* ── Company sub-page imports ─────────────────────────────── */
import CompanyStore           from './provider/CompanyStore.jsx';
import TeamManagement         from '../components/provider/TeamManagement.jsx';

/* ── Admin page imports (lazy-loaded for code splitting) ──── */
const AdminDashboard      = lazy(() => import('./admin/AdminDashboard.jsx'));
const UserManagement      = lazy(() => import('./admin/UserManagement.jsx'));
const ListingModeration   = lazy(() => import('./admin/ListingModeration.jsx'));
const BookingOversight    = lazy(() => import('./admin/BookingOversight.jsx'));
const PaymentManagement   = lazy(() => import('./admin/PaymentManagement.jsx'));
const PlatformAnalytics   = lazy(() => import('./admin/PlatformAnalytics.jsx'));
const AdminReports        = lazy(() => import('./admin/Reports.jsx'));
const PlatformSettings    = lazy(() => import('./admin/PlatformSettings.jsx'));
const AuditLogs           = lazy(() => import('./admin/AuditLogs.jsx'));
const ProviderVerification = lazy(() => import('./admin/ProviderVerification.jsx'));
const SupportTickets      = lazy(() => import('./admin/SupportTickets.jsx'));
const ComplianceKYC       = lazy(() => import('./admin/ComplianceKYC.jsx'));
const AdminManagement     = lazy(() => import('./admin/AdminManagement.jsx'));
const MarketplaceOrders   = lazy(() => import('./admin/MarketplaceOrders.jsx'));
const VendorModeration    = lazy(() => import('./admin/VendorModeration.jsx'));
const DisputeResolution   = lazy(() => import('./admin/DisputeResolution.jsx'));
/* ── Aurban Pro Admin pages ───────────────────────────────── */
const ProEscrowDashboard       = lazy(() => import('./admin/ProEscrowDashboard.jsx'));
const ProSafetyMonitoring      = lazy(() => import('./admin/ProSafetyMonitoring.jsx'));
const ProRectificationMgmt     = lazy(() => import('./admin/ProRectificationManagement.jsx'));
const ProProviderVerification  = lazy(() => import('./admin/ProProviderVerification.jsx'));
const ProSystemConfig          = lazy(() => import('./admin/ProSystemConfig.jsx'));

/* ════════════════════════════════════════════════════════════
   PROVIDER DASHBOARD — Full dashboard for hosts, agents,
   sellers, and service providers.

   Tab-based pages: Overview · Listings · Analytics · Payouts
   Full sub-pages:  Messages · Agreements · Reviews · Settings · Profile

   Wrapped in DashboardLayout (sidebar + content area)
════════════════════════════════════════════════════════════ */

const TABS = [
  { id: 'overview',    label: 'Overview',    icon: Eye            },
  { id: 'listings',    label: 'Listings',    icon: Package        },
  { id: 'analytics',   label: 'Analytics',   icon: BarChart2      },
  { id: 'payouts',     label: 'Payouts',     icon: Wallet         },
  { id: 'bookings',    label: 'Bookings',    icon: Calendar       },
  { id: 'orders',      label: 'Orders',      icon: Package        },
  { id: 'messages',    label: 'Messages',    icon: MessageCircle  },
  { id: 'agreements',  label: 'Agreements',  icon: FileText       },
  { id: 'reviews',     label: 'Reviews',     icon: Star           },
  { id: 'settings',    label: 'Settings',    icon: FileText       },
];

const TAB_MAP = {
  '': 'overview', 'overview': 'overview', 'listings': 'listings',
  'analytics': 'analytics', 'payouts': 'payouts',
  'bookings': 'bookings', 'orders': 'orders', 'messages': 'messages', 'agreements': 'agreements',
  'reviews': 'reviews', 'settings': 'settings', 'profile': 'profile',
  'pro-bookings': 'pro-bookings', 'pro-listings': 'pro-listings', 'pro-earnings': 'pro-earnings',
  'company-store': 'company-store', 'team': 'team',
};

const ADMIN_TAB_MAP = {
  '': 'overview', 'users': 'users', 'moderation': 'moderation',
  'bookings': 'bookings', 'payments': 'payments', 'analytics': 'analytics',
  'reports': 'reports', 'platform-settings': 'platform-settings',
  'verification': 'verification', 'tickets': 'tickets',
  'kyc': 'kyc', 'audit': 'audit',
  'admin-management': 'admin-management',
  'marketplace-orders': 'marketplace-orders',
  'vendor-moderation': 'vendor-moderation',
  'disputes': 'disputes',
  'pro-escrow': 'pro-escrow',
  'pro-safety': 'pro-safety',
  'pro-rectification': 'pro-rectification',
  'pro-verification': 'pro-verification',
  'pro-config': 'pro-config',
};

const AdminFallback = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-2 rounded-full border-brand-gold border-t-transparent animate-spin" />
  </div>
);

/* ── Mock data (replace with API calls in production) ─────── */
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

export default function ProviderDashboard() {
  const { user }              = useAuth();
  const location              = useLocation();
  const navigate              = useNavigate();
  const isAdmin               = isAdminRole(user?.role);

  /* ── Derive tab directly from URL (no state sync needed) ── */
  const segment = location.pathname.replace('/provider', '').replace(/^\//, '') || '';
  const baseSegment = segment.split('/')[0];
  const tab     = isAdmin
    ? (ADMIN_TAB_MAP[baseSegment] || ADMIN_TAB_MAP[segment] || 'overview')
    : (TAB_MAP[baseSegment] || TAB_MAP[segment] || 'overview');

  const [listings, setListings]             = useState(MOCK_LISTINGS);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingFilter, setListingFilter]   = useState('all');
  const [deleteConfirm, setDeleteConfirm]   = useState(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('30d');

  // Fetch listings from API (fall back to mock)
  useEffect(() => {
    let cancelled = false;
    async function fetchListings() {
      setListingsLoading(true);
      try {
        const res = await propertyService.getProperties();
        if (!cancelled && res.success && res.properties) {
          setListings(res.properties);
        }
      } catch { /* keep MOCK_LISTINGS */ }
      if (!cancelled) setListingsLoading(false);
    }
    fetchListings();
    return () => { cancelled = true; };
  }, []);

  // Redirect /provider/new → /listings/new
  useEffect(() => {
    if (segment === 'new') {
      navigate('/listings/new', { replace: true });
    }
  }, [segment, navigate]);

  /* ── Admin page routing (lazy-loaded) ─────────────────────── */
  if (isAdmin) {
    const adminPage = (() => {
      switch (tab) {
        case 'overview':           return <AdminDashboard />;
        case 'users':              return <UserManagement />;
        case 'moderation':         return <ListingModeration />;
        case 'bookings':           return <BookingOversight />;
        case 'payments':           return <PaymentManagement />;
        case 'analytics':          return <PlatformAnalytics />;
        case 'reports':            return <AdminReports />;
        case 'platform-settings':  return <PlatformSettings />;
        case 'verification':       return <ProviderVerification />;
        case 'tickets':            return <SupportTickets />;
        case 'kyc':                return <ComplianceKYC />;
        case 'audit':              return <AuditLogs />;
        case 'admin-management':   return <AdminManagement />;
        case 'marketplace-orders': return <MarketplaceOrders />;
        case 'vendor-moderation':  return <VendorModeration />;
        case 'disputes':           return <DisputeResolution />;
        case 'pro-escrow':         return <ProEscrowDashboard />;
        case 'pro-safety':         return <ProSafetyMonitoring />;
        case 'pro-rectification':  return <ProRectificationMgmt />;
        case 'pro-verification':   return <ProProviderVerification />;
        case 'pro-config':         return <ProSystemConfig />;
        default:                   return <AdminDashboard />;
      }
    })();
    return (
      <DashboardLayout>
        <Suspense fallback={<AdminFallback />}>
          {adminPage}
        </Suspense>
      </DashboardLayout>
    );
  }

  /* ── Listing actions ────────────────────────────────────── */
  const toggleListing = (id) => {
    setListings((prev) => prev.map((l) => l.id === id ? { ...l, active: !l.active } : l));
  };

  const deleteListing = (id) => {
    setListings((prev) => prev.filter((l) => l.id !== id));
    setDeleteConfirm(null);
  };

  /* ── Filtered listings ──────────────────────────────────── */
  const filteredListings = useMemo(() => {
    if (listingFilter === 'all') return listings;
    if (listingFilter === 'active') return listings.filter((l) => l.active);
    if (listingFilter === 'paused') return listings.filter((l) => !l.active);
    return listings;
  }, [listings, listingFilter]);

  /* ── Stats ──────────────────────────────────────────────── */
  const totalViews     = listings.reduce((s, l) => s + l.views, 0);
  const totalInquiries = listings.reduce((s, l) => s + l.inquiries, 0);
  const activeCount    = listings.filter((l) => l.active).length;

  /* ── Delegate to full sub-pages ──────────────────────────── */
  if (tab === 'bookings')   return <DashboardLayout><ProviderBookings /></DashboardLayout>;
  if (tab === 'orders' || segment.startsWith('orders/')) {
    const orderId = segment.startsWith('orders/') ? segment.split('/')[1] : null;
    return <DashboardLayout>{orderId ? <ProviderOrderDetail /> : <ProviderOrders />}</DashboardLayout>;
  }
  /* ── Aurban Pro sub-pages ────────────────────────────────── */
  if (tab === 'pro-bookings' || segment.startsWith('pro-bookings/')) {
    const proBookingId = segment.startsWith('pro-bookings/') ? segment.split('/')[1] : null;
    return <DashboardLayout>{proBookingId ? <ProviderProBookingDetail /> : <ProviderProBookings />}</DashboardLayout>;
  }
  if (tab === 'pro-listings' || segment.startsWith('pro-listings/')) {
    const isNew = segment === 'pro-listings/new';
    return <DashboardLayout>{isNew ? <CreateProListing /> : <ProviderProListings />}</DashboardLayout>;
  }
  if (tab === 'pro-earnings') return <DashboardLayout><ProEarnings /></DashboardLayout>;

  /* ── Company sub-pages ─────────────────────────────────────── */
  if (tab === 'company-store') return <DashboardLayout><CompanyStore preview /></DashboardLayout>;
  if (tab === 'team')          return <DashboardLayout><TeamManagement /></DashboardLayout>;

  if (tab === 'messages')   return <DashboardLayout><ProviderMessages /></DashboardLayout>;
  if (tab === 'agreements') return <DashboardLayout><ProviderAgreements /></DashboardLayout>;
  if (tab === 'reviews')    return <DashboardLayout><ProviderReviews /></DashboardLayout>;
  if (tab === 'settings')   return <DashboardLayout><ProviderSettings /></DashboardLayout>;
  if (tab === 'profile')    return <DashboardLayout><ProviderProfile /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-5">

        {/* ── Provider header card ────────────────────────── */}
        <div className="relative p-5 overflow-hidden text-white bg-brand-charcoal-dark rounded-2xl">
          <div className="absolute top-0 rounded-full right-4 w-28 h-28 bg-brand-gold/10 -translate-y-1/3" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center justify-center w-12 h-12 overflow-hidden rounded-2xl bg-white/10 shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="object-cover w-12 h-12 rounded-2xl" />
                ) : (
                  <span className="text-lg font-bold font-display text-brand-gold">
                    {(user?.name || 'P')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate font-display">{user?.name || 'Provider'}</h1>
                {user?.businessName && (
                  <p className="text-xs text-gray-400 truncate">{user.businessName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Star size={12} className="text-brand-gold" /> 4.8 (23 reviews)</span>
              <span className="flex items-center gap-1"><Clock size={12} /> Responds within 2hrs</span>
            </div>
          </div>
        </div>

        {/* ── Tab bar ─────────────────────────────────────── */}
        <div className="flex gap-2 pb-1 overflow-x-auto scroll-x">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => navigate(id === 'overview' ? '/provider' : `/provider/${id}`)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium shrink-0 transition-all
                ${tab === id
                  ? 'bg-white dark:bg-gray-900 text-brand-charcoal-dark dark:text-white shadow-sm'
                  : 'text-gray-400 hover:text-brand-charcoal dark:hover:text-gray-300'
                }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════
            OVERVIEW TAB
        ════════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="space-y-4">

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Total Views',     value: totalViews.toLocaleString(),     icon: Eye,            color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' },
                { label: 'Inquiries',        value: totalInquiries.toString(),       icon: MessageCircle,  color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600' },
                { label: 'Active Listings',  value: activeCount.toString(),          icon: Package,        color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' },
                { label: 'Balance',          value: formatMoney(85000),              icon: Wallet,         color: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${color}`}>
                    <Icon size={17} />
                  </div>
                  <p className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Desktop: two-column layout for verification + activity */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

              {/* Left column: Verification + Quick action */}
              <div className="space-y-4">
                <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                  <h3 className="mb-3 text-sm font-semibold text-brand-charcoal-dark dark:text-white">Verification Status</h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Email verified',    done: true  },
                      { label: 'Phone verified',    done: true  },
                      { label: 'ID uploaded',       done: false },
                      { label: 'Business docs',     done: false },
                    ].map(({ label, done }) => (
                      <div key={label} className="flex items-center gap-3 py-2">
                        {done ? (
                          <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full dark:border-gray-600 shrink-0" />
                        )}
                        <span className={`text-sm ${done ? 'text-gray-500 dark:text-gray-400' : 'text-brand-charcoal-dark dark:text-white font-medium'}`}>{label}</span>
                        {!done && (
                          <button className="ml-auto text-xs font-medium text-brand-gold hover:underline">
                            Complete →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Link to="/provider/new"
                  className="flex items-center justify-center gap-2 py-4 font-semibold transition-colors bg-brand-gold text-brand-charcoal-dark rounded-2xl shadow-card hover:bg-brand-gold-dark">
                  <PlusCircle size={20} /> Add New Listing
                </Link>
              </div>

              {/* Right column: Recent activity */}
              <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card h-fit">
                <h3 className="mb-3 text-sm font-semibold text-brand-charcoal-dark dark:text-white">Recent Activity</h3>
                {listings.length > 0 ? (
                  <div className="space-y-3">
                    {[
                      { text: 'New inquiry on "3 Bedroom Flat in Lekki Phase 1"', time: '2h ago', icon: MessageCircle, color: 'text-purple-500' },
                      { text: 'Your listing "Land for Sale" was viewed 15 times', time: '5h ago', icon: Eye, color: 'text-blue-500' },
                      { text: 'Payout of ₦85,000 processed', time: '1d ago', icon: Wallet, color: 'text-green-500' },
                    ].map(({ text, time, icon: Icon, color }, i) => (
                      <div key={i} className="flex items-start gap-3 py-2">
                        <Icon size={16} className={`${color} shrink-0 mt-0.5`} />
                        <div className="min-w-0">
                          <p className="text-sm text-brand-charcoal dark:text-gray-300">{text}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-sm text-center text-gray-400">No recent activity</p>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            LISTINGS TAB
        ════════════════════════════════════════════════════ */}
        {tab === 'listings' && (
          <div className="space-y-4">

            {/* Filter pills */}
            <div className="flex items-center gap-2 pb-1 overflow-x-auto scroll-x">
              {[
                { id: 'all',    label: 'All',    count: listings.length },
                { id: 'active', label: 'Active', count: listings.filter((l) => l.active).length },
                { id: 'paused', label: 'Paused', count: listings.filter((l) => !l.active).length },
              ].map(({ id, label, count }) => (
                <button key={id} onClick={() => setListingFilter(id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium shrink-0 transition-all border
                    ${listingFilter === id
                      ? 'border-brand-gold bg-brand-gold/5 dark:bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                      : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                    }`}>
                  {label}
                  <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center
                    ${listingFilter === id ? 'bg-brand-gold text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>
                    {count}
                  </span>
                </button>
              ))}

              {/* Add listing shortcut */}
              <Link to="/provider/new"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium shrink-0 bg-brand-gold text-brand-charcoal-dark hover:bg-brand-gold-dark transition-colors ml-auto">
                <PlusCircle size={14} /> Add New
              </Link>
            </div>

            {/* Listing cards */}
            {filteredListings.length === 0 ? (
              <div className="p-10 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                <Package size={40} className="mx-auto mb-4 text-gray-200 dark:text-gray-700" />
                <p className="font-semibold text-brand-charcoal-dark dark:text-white">No listings found</p>
                <p className="mt-1 text-sm text-gray-400">Add your first listing to get started</p>
                <Link to="/provider/new" className="inline-block mt-5 text-sm btn-primary">Add Listing</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredListings.map((listing) => (
                  <div key={listing.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                    <div className="flex items-start gap-3">
                      {/* Thumbnail placeholder */}
                      <div className="flex items-center justify-center w-16 h-16 text-2xl bg-gray-100 rounded-xl dark:bg-white/5 shrink-0">
                        {CATEGORY_EMOJI[listing.category] || '📋'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${listing.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-xs text-gray-400 capitalize">{listing.category}</span>
                        </div>
                        <h4 className="text-sm font-semibold truncate text-brand-charcoal-dark dark:text-white">{listing.title}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{listing.location}</p>
                        <p className="mt-1 text-sm font-bold text-brand-charcoal-dark dark:text-white">
                          {formatMoney(listing.price)}<span className="text-xs font-normal text-gray-400">{listing.priceUnit}</span>
                        </p>

                        {/* Stats row */}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Eye size={12} /> {listing.views} views</span>
                          <span className="flex items-center gap-1"><MessageCircle size={12} /> {listing.inquiries} inquiries</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-white/10">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <Edit2 size={12} /> Edit
                      </button>
                      <button
                        onClick={() => toggleListing(listing.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        {listing.active ? <><ToggleRight size={12} className="text-green-500" /> Pause</> : <><ToggleLeft size={12} /> Resume</>}
                      </button>

                      {deleteConfirm === listing.id ? (
                        <div className="flex items-center gap-2 ml-auto">
                          <span className="text-xs text-red-500">Delete?</span>
                          <button onClick={() => deleteListing(listing.id)}
                            className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600">Yes</button>
                          <button onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 text-xs font-medium text-gray-400 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5">No</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(listing.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors ml-auto">
                          <Trash2 size={12} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            ANALYTICS TAB
        ════════════════════════════════════════════════════ */}
        {tab === 'analytics' && (
          <div className="space-y-4">

            {/* Period selector */}
            <div className="flex gap-2">
              {['7d', '30d', '90d'].map((p) => (
                <button key={p} onClick={() => setAnalyticsPeriod(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all
                    ${analyticsPeriod === p
                      ? 'bg-white dark:bg-gray-900 text-brand-charcoal-dark dark:text-white shadow-sm'
                      : 'text-gray-400 hover:text-brand-charcoal dark:hover:text-gray-300'
                    }`}>
                  {p === '7d' ? 'Last 7 Days' : p === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                </button>
              ))}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Views',       value: totalViews.toLocaleString(),   change: '+12%', up: true  },
                { label: 'Inquiries',   value: totalInquiries.toString(),     change: '+8%',  up: true  },
                { label: 'Conversion',  value: totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(1) + '%' : '0%', change: '+2%', up: true },
              ].map(({ label, value, change, up }) => (
                <div key={label} className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="mt-1 text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">{value}</p>
                  <p className={`text-xs mt-1 flex items-center gap-0.5 ${up ? 'text-green-500' : 'text-red-500'}`}>
                    <ArrowUpRight size={12} className={up ? '' : 'rotate-90'} /> {change}
                  </p>
                </div>
              ))}
            </div>

            {/* Views bar chart (pure CSS) */}
            <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
              <h3 className="mb-4 text-sm font-semibold text-brand-charcoal-dark dark:text-white">Views Over Time</h3>
              <div className="flex items-end h-32 gap-2">
                {[45, 62, 38, 78, 55, 90, 72].map((val, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 gap-1">
                    <div
                      className="relative w-full transition-all rounded-t-lg bg-brand-gold/20 dark:bg-brand-gold/30 hover:bg-brand-gold/40 group"
                      style={{ height: `${(val / 100) * 100}%` }}
                    >
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        {val}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-listing breakdown */}
            <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
              <h3 className="mb-3 text-sm font-semibold text-brand-charcoal-dark dark:text-white">Per Listing Breakdown</h3>
              <div className="space-y-3">
                {listings.map((l) => {
                  const maxViews = Math.max(...listings.map((x) => x.views), 1);
                  const pct = (l.views / maxViews) * 100;
                  return (
                    <div key={l.id}>
                      <div className="flex items-center justify-between mb-1 text-sm">
                        <span className="truncate text-brand-charcoal dark:text-gray-300 max-w-[70%]">{l.title}</span>
                        <span className="text-xs text-gray-400 shrink-0">{l.views} views</span>
                      </div>
                      <div className="h-2 overflow-hidden bg-gray-100 rounded-full dark:bg-white/5">
                        <div className="h-full transition-all duration-500 rounded-full bg-brand-gold" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            PAYOUTS TAB
        ════════════════════════════════════════════════════ */}
        {tab === 'payouts' && (
          <div className="space-y-4">

            {/* Balance cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="p-5 text-white bg-brand-charcoal-dark rounded-2xl">
                <p className="text-xs tracking-wider text-gray-400 uppercase">Available Balance</p>
                <p className="mt-2 text-3xl font-bold font-display">₦85,000</p>
                <button className="mt-4 bg-brand-gold text-brand-charcoal-dark font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-brand-gold-dark transition-colors">
                  Withdraw Funds
                </button>
              </div>
              <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                <p className="text-xs tracking-wider text-gray-400 uppercase">Pending / Escrow</p>
                <p className="mt-2 text-3xl font-bold font-display text-brand-charcoal-dark dark:text-white">₦12,000</p>
                <p className="mt-2 text-xs text-gray-400">Funds held until service completion</p>
              </div>
            </div>

            {/* Lifetime earnings */}
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl">
              <DollarSign size={20} className="text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Lifetime Earnings</p>
                <p className="text-lg font-bold font-display text-emerald-800 dark:text-emerald-300">₦1,250,000</p>
              </div>
            </div>

            {/* Transaction history */}
            <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
              <h3 className="mb-3 text-sm font-semibold text-brand-charcoal-dark dark:text-white">Transaction History</h3>
              <div className="space-y-3">
                {[
                  { desc: 'Withdrawal to GTBank ****4521', amount: '-₦80,000', date: 'Feb 10, 2026', status: 'completed' },
                  { desc: 'Payment: 3 Bed Flat inquiry',   amount: '+₦45,000', date: 'Feb 8, 2026',  status: 'completed' },
                  { desc: 'Payment: Land viewing fee',      amount: '+₦15,000', date: 'Feb 5, 2026',  status: 'pending'   },
                  { desc: 'Withdrawal to GTBank ****4521', amount: '-₦120,000', date: 'Jan 28, 2026', status: 'completed' },
                ].map((tx, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-white/5 last:border-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tx.amount.startsWith('+') ? 'bg-green-50 dark:bg-green-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                      {tx.amount.startsWith('+')
                        ? <ArrowUpRight size={14} className="text-green-500 rotate-45" />
                        : <ArrowUpRight size={14} className="text-red-500 rotate-[135deg]" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate text-brand-charcoal dark:text-gray-300">{tx.desc}</p>
                      <p className="text-xs text-gray-400">{tx.date}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${tx.amount.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>{tx.amount}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium
                        ${tx.status === 'completed' ? 'bg-green-50 dark:bg-green-500/10 text-green-600' : 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600'}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payout settings note */}
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
        {/* Messages, Agreements, Reviews, Settings, Profile
            are now rendered as full sub-pages via early returns above */}
      </div>
    </DashboardLayout>
  );
}