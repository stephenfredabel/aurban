import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ListFilter, Flag, Settings,
  Wallet, BarChart2, Calendar, UserCog,
  ShieldCheck, FileCheck,
  MessageSquare, AlertTriangle,
  ScrollText,
} from 'lucide-react';
import { useAuth }      from '../../context/AuthContext.jsx';
import { useMessaging } from '../../context/MessagingContext.jsx';
import { normalizeRole } from '../../utils/rbac.js';

/* ════════════════════════════════════════════════════════════
   ADMIN BOTTOM NAV — Role-specific mobile tab bar

   Each admin role gets their 5 most relevant pages as tabs.
   Same visual pattern as ProviderBottomNav but with:
   • Role-specific tabs (not generic provider tabs)
   • Dark theme to match admin header
   • No "Add Listing" button
════════════════════════════════════════════════════════════ */

const ADMIN_BOTTOM_TABS = {
  super_admin: [
    { label: 'Dashboard', to: '/provider',                   icon: LayoutDashboard, exact: true },
    { label: 'Users',     to: '/provider/users',             icon: Users },
    { label: 'Admins',    to: '/provider/admin-management',  icon: UserCog },
    { label: 'Reports',   to: '/provider/reports',           icon: Flag },
    { label: 'Settings',  to: '/provider/platform-settings', icon: Settings },
  ],
  finance_admin: [
    { label: 'Dashboard', to: '/provider',            icon: LayoutDashboard, exact: true },
    { label: 'Payments',  to: '/provider/payments',   icon: Wallet },
    { label: 'Analytics', to: '/provider/analytics',  icon: BarChart2 },
    { label: 'Reports',   to: '/provider/reports',    icon: Flag },
    { label: 'Messages',  to: '/provider/messages',   icon: MessageSquare },
  ],
  operations_admin: [
    { label: 'Dashboard', to: '/provider',              icon: LayoutDashboard, exact: true },
    { label: 'Listings',  to: '/provider/moderation',   icon: ListFilter },
    { label: 'Users',     to: '/provider/users',        icon: Users },
    { label: 'Bookings',  to: '/provider/bookings',     icon: Calendar },
    { label: 'Reports',   to: '/provider/reports',      icon: Flag },
  ],
  moderator: [
    { label: 'Dashboard', to: '/provider',             icon: LayoutDashboard, exact: true },
    { label: 'Listings',  to: '/provider/moderation',  icon: ListFilter },
    { label: 'Reports',   to: '/provider/reports',     icon: Flag },
    { label: 'Messages',  to: '/provider/messages',    icon: MessageSquare },
    { label: 'Settings',  to: '/provider/settings',    icon: Settings },
  ],
  verification_admin: [
    { label: 'Dashboard',    to: '/provider',               icon: LayoutDashboard, exact: true },
    { label: 'Verification', to: '/provider/verification',  icon: ShieldCheck },
    { label: 'KYC',          to: '/provider/kyc',           icon: FileCheck },
    { label: 'Messages',     to: '/provider/messages',      icon: MessageSquare },
    { label: 'Settings',     to: '/provider/settings',      icon: Settings },
  ],
  support_admin: [
    { label: 'Dashboard', to: '/provider',            icon: LayoutDashboard, exact: true },
    { label: 'Tickets',   to: '/provider/tickets',    icon: MessageSquare },
    { label: 'Messages',  to: '/provider/messages',   icon: MessageSquare },
    { label: 'Disputes',  to: '/provider/bookings',   icon: AlertTriangle },
    { label: 'Settings',  to: '/provider/settings',   icon: Settings },
  ],
  compliance_admin: [
    { label: 'Dashboard', to: '/provider',          icon: LayoutDashboard, exact: true },
    { label: 'KYC',       to: '/provider/kyc',      icon: FileCheck },
    { label: 'Audit',     to: '/provider/audit',    icon: ScrollText },
    { label: 'Users',     to: '/provider/users',    icon: Users },
    { label: 'Messages',  to: '/provider/messages', icon: MessageSquare },
  ],
};

export default function AdminBottomNav() {
  const { user }        = useAuth();
  const { totalUnread } = useMessaging();
  const { pathname }    = useLocation();
  const role = normalizeRole(user?.role);
  const tabs = ADMIN_BOTTOM_TABS[role] || ADMIN_BOTTOM_TABS.super_admin;

  return (
    <nav
      aria-label="Admin navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-white/5 pb-safe md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-center h-16">
        {tabs.map(({ label, to, icon: Icon, exact }) => {
          const isActive   = exact ? pathname === to : pathname.startsWith(to);
          const isMessages = to === '/provider/messages';
          const badge      = isMessages ? totalUnread : 0;

          return (
            <li key={to + label} className="flex-1">
              <NavLink
                to={to}
                end={exact}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className="relative flex flex-col items-center justify-center h-full gap-1"
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-brand-gold rounded-full" aria-hidden />
                )}

                <div className="relative">
                  <Icon
                    size={22}
                    className={isActive ? 'text-brand-gold' : 'text-gray-500'}
                    fill={isActive ? 'currentColor' : 'none'}
                    strokeWidth={isActive ? 0 : 1.8}
                  />

                  {/* Unread badge */}
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>

                <span className={`text-[10px] font-semibold ${
                  isActive ? 'text-brand-gold' : 'text-gray-500'
                }`}>
                  {label}
                </span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
