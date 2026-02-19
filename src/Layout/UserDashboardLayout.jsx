import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Heart, MessageCircle, Clock, Calendar,
  FileText, Settings, User, LogOut, Home, Package, Wrench,
  ChevronLeft, Menu, X,
  PanelLeftClose, PanelLeftOpen, BarChart2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import PWAInstallBanner from '../components/pwa/PWAInstallBanner.jsx';

/* ════════════════════════════════════════════════════════════
   USER DASHBOARD LAYOUT — User sidebar + content wrapper

   Sidebar navigation (user-only):
   • Overview       → /dashboard
   • Wishlist       → /dashboard/wishlist
   • Messages       → /dashboard/messages
   • History        → /dashboard/history
   • Agreements     → /dashboard/agreements
   • Settings       → /dashboard/settings

   Features:
   • Desktop: collapsible fixed sidebar (w-64 ↔ hidden)
   • Mobile: hamburger → slide-in drawer
   • User avatar + name + "Member" badge
   • "Browse Aurban" link → /
   • Logout button
   • Dark mode support
════════════════════════════════════════════════════════════ */

const sidebarLinks = [
  { to: '/dashboard',            icon: LayoutDashboard, labelKey: 'dashboard.overview',    exact: true },
  { to: '/dashboard/wishlist',   icon: Heart,           labelKey: 'dashboard.wishlist'                },
  { to: '/dashboard/messages',   icon: MessageCircle,   labelKey: 'dashboard.messages'                },
  { to: '/dashboard/bookings',   icon: Calendar,        labelKey: 'booking.title'                     },
  { to: '/dashboard/orders',    icon: Package,         labelKey: 'dashboard.orders',  fallback: 'Orders' },
  { to: '/dashboard/pro-bookings', icon: Wrench,       labelKey: 'dashboard.proBookings', fallback: 'Pro Bookings' },
  { to: '/dashboard/analytics', icon: BarChart2,      labelKey: 'dashboard.analytics', fallback: 'Analytics' },
  { to: '/dashboard/history',    icon: Clock,           labelKey: 'dashboard.history'                 },
  { to: '/dashboard/agreements', icon: FileText,        labelKey: 'dashboard.agreements'              },
  { to: '/dashboard/settings',   icon: Settings,        labelKey: 'dashboard.settings'                },
];

export default function UserDashboardLayout({ children }) {
  const { t }            = useTranslation();
  const { user, logout } = useAuth();
  const location         = useLocation();

  const [sidebarOpen, setSidebarOpen]               = useState(false);  // mobile drawer
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true);   // desktop collapse

  const handleLogout = async () => {
    setSidebarOpen(false);
    await logout();
    window.location.href = '/';
  };

  const isLinkActive = (to, exact) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  /* ── Time-based greeting ─────────────────────────────────── */
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'User';

  /* ── Sidebar content (shared between desktop + mobile) ── */
  const SidebarContent = ({ onNavigate }) => (
    <>
      {/* User info */}
      <div className="pb-4 mb-4 border-b border-gray-100 dark:border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center justify-center w-10 h-10 overflow-hidden rounded-full bg-brand-gold/10 shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="object-cover w-10 h-10 rounded-full" />
            ) : (
              <User size={18} className="text-brand-gold" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate text-brand-charcoal-dark dark:text-white">
              {getGreeting()}, {firstName}
            </p>
            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-gold/10 text-brand-gold">
              Member
            </span>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
          {t('dashboard.userDashboard', 'My Dashboard')}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5">
        {sidebarLinks.map(({ to, icon: Icon, labelKey, exact, fallback }) => {
          const active = isLinkActive(to, exact);
          return (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={onNavigate}
              className={
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${active
                  ? 'bg-brand-charcoal-dark dark:bg-white text-white dark:text-gray-900 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-brand-charcoal-dark dark:hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              <span>{t(labelKey, fallback)}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Browse Aurban link */}
      <div className="pt-4 mt-auto space-y-1 border-t border-gray-100 dark:border-white/10">
        <Link to="/" onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
          <Home size={16} /> {t('dashboard.backToAurban', 'Browse Aurban')}
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
          <LogOut size={16} /> {t('nav.logout', 'Sign Out')}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Mobile top bar ────────────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-white/10 px-4 py-2.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1.5 text-sm text-brand-charcoal dark:text-gray-300">
          <ChevronLeft size={16} />
          {t('dashboard.backToAurban', 'Back to Aurban')}
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-500 rounded-xl dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex">

        {/* ── Desktop sidebar (collapsible) ───────────────── */}
        <aside
          className={`sticky top-0 hidden h-screen shrink-0 transition-all duration-300 ease-in-out
            ${desktopSidebarOpen ? 'lg:flex lg:flex-col lg:w-64 p-4 pr-2' : 'lg:w-0'}`}
        >
          <div
            className={`flex flex-col h-full p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card
              scroll-y overflow-y-auto transition-opacity duration-200
              ${desktopSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            {/* Collapse button */}
            <button
              onClick={() => setDesktopSidebarOpen(false)}
              className="self-end mb-2 p-1.5 rounded-lg text-gray-400 hover:text-brand-charcoal-dark dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
            <SidebarContent onNavigate={() => {}} />
          </div>
        </aside>

        {/* ── Desktop expand button (when collapsed) ──────── */}
        {!desktopSidebarOpen && (
          <div className="sticky top-0 z-20 hidden h-screen lg:flex lg:items-start pt-5 pl-3">
            <button
              onClick={() => setDesktopSidebarOpen(true)}
              className="p-2.5 bg-white dark:bg-gray-900 rounded-xl shadow-card text-gray-400
                hover:text-brand-gold hover:bg-brand-gold/5 transition-colors"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        )}

        {/* ── Mobile sidebar drawer ────────────────────────── */}
        {sidebarOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <div className="fixed top-0 bottom-0 left-0 z-50 flex flex-col p-4 overflow-y-auto bg-white shadow-xl w-72 dark:bg-gray-900 lg:hidden animate-slide-in-left">
              <SidebarContent onNavigate={() => setSidebarOpen(false)} />
            </div>
          </>
        )}

        {/* ── Main content ─────────────────────────────────── */}
        <main className="flex-1 min-w-0 p-4 pb-24 md:pb-4 lg:py-6 lg:pr-6 lg:pl-2">
          <div className="lg:p-6 lg:rounded-2xl lg:border lg:border-gray-200/60 dark:lg:border-white/5 lg:bg-gray-50/50 dark:lg:bg-white/[0.01] lg:min-h-[calc(100vh-3rem)]">
            <PWAInstallBanner variant="user" />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
