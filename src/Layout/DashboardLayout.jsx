import { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ListFilter, PlusCircle, MessageCircle, Calendar,
  BarChart2, Wallet, FileText, Star, Settings, User,
  ChevronLeft, Menu, X, LogOut, Home,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

/* ════════════════════════════════════════════════════════════
   DASHBOARD LAYOUT — Provider sidebar shell

   Used for: Hosts, Agents, Sellers, Service Providers

   Sidebar navigation:
   • Overview       → /provider
   • Profile        → /provider/profile
   • My Listings    → /provider/listings
   • Add Listing    → /provider/listings/new
   • Messages       → /provider/messages
   • Analytics      → /provider/analytics
   • Payouts        → /provider/payouts
   • Agreements     → /provider/agreements
   • Reviews        → /provider/reviews
   • Settings       → /provider/settings

   Features:
   • Desktop: collapsible fixed sidebar (w-60 ↔ hidden)
   • Mobile: hamburger → slide-in drawer
   • Role-based title
   • User avatar + name + role badge
   • "Back to Aurban" link on mobile
   • Quick link to user dashboard
   • Logout button
   • Dark mode support
════════════════════════════════════════════════════════════ */

const sidebarLinks = [
  { to: '/provider',              icon: LayoutDashboard, label: 'Overview',     exact: true },
  { to: '/provider/profile',      icon: User,            label: 'My Profile'               },
  { to: '/provider/listings',     icon: ListFilter,      label: 'My Listings'              },
  { to: '/provider/listings/new', icon: PlusCircle,      label: 'Add Listing',  highlight: true },
  { to: '/provider/messages',     icon: MessageCircle,   label: 'Messages'                 },
  { to: '/provider/bookings',     icon: Calendar,        label: 'Bookings'                 },
  { to: '/provider/analytics',    icon: BarChart2,       label: 'Analytics'                },
  { to: '/provider/payouts',      icon: Wallet,          label: 'Payouts'                  },
  { to: '/provider/agreements',   icon: FileText,        label: 'Agreements'               },
  { to: '/provider/reviews',      icon: Star,            label: 'Reviews'                  },
  { to: '/provider/settings',     icon: Settings,        label: 'Settings'                 },
];

const roleLabels = {
  host:     'Host Dashboard',
  agent:    'Agent Dashboard',
  seller:   'Seller Dashboard',
  service:  'Service Provider',
  provider: 'Provider Dashboard',
  admin:    'Admin Dashboard',
};

const roleBadgeColors = {
  host:     'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
  agent:    'bg-purple-50 dark:bg-purple-500/10 text-purple-600',
  seller:   'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600',
  service:  'bg-orange-50 dark:bg-orange-500/10 text-orange-600',
  provider: 'bg-brand-gold/10 text-brand-gold',
  admin:    'bg-red-50 dark:bg-red-500/10 text-red-600',
};

export default function DashboardLayout({ children }) {
  const { user, logout }         = useAuth();
  const location                 = useLocation();
  const [sidebarOpen, setSidebarOpen]           = useState(false);   // mobile drawer
  const [desktopSidebarOpen, setDesktopSidebarOpen] = useState(true); // desktop collapse

  const dashTitle  = roleLabels[user?.role] || 'Provider Dashboard';
  const badgeColor = roleBadgeColors[user?.role] || 'bg-brand-gold/10 text-brand-gold';

  const handleLogout = async () => {
    setSidebarOpen(false);
    await logout();
    window.location.href = '/';
  };

  /* ── Check if a link is active ──────────────────────────── */
  const isLinkActive = (to, exact) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

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
              {user?.name || 'Provider'}
            </p>
            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold capitalize ${badgeColor}`}>
              {user?.role || 'provider'}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{dashTitle}</p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5">
        {sidebarLinks.map(({ to, icon: Icon, label, exact, highlight }) => {
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
                  ? 'bg-brand-gold/10 text-brand-gold'
                  : highlight
                    ? 'text-brand-gold hover:bg-brand-gold/5'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-brand-charcoal-dark dark:hover:text-white'
                }`
              }
            >
              <Icon size={18} className={active ? 'text-brand-gold' : highlight ? 'text-brand-gold' : ''} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="pt-4 mt-auto space-y-1 border-t border-gray-100 dark:border-white/10">
        <Link to="/" onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
          <Home size={18} /> Back to Aurban
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
          <LogOut size={18} /> Log Out
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
          Back to Aurban
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
            {/* Collapse button at top-right of sidebar */}
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

        {/* ── Desktop expand button (shown when sidebar is collapsed) */}
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
        <main className="flex-1 min-w-0 p-4 lg:py-6 lg:pr-6 lg:pl-2">
          <div className="lg:p-6 lg:rounded-2xl lg:border lg:border-gray-200/60 dark:lg:border-white/5 lg:bg-gray-50/50 dark:lg:bg-white/[0.01] lg:min-h-[calc(100vh-3rem)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
