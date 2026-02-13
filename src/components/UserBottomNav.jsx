import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation }       from 'react-i18next';
import {
  Home, Compass, Heart, MessageSquare, User,
} from 'lucide-react';
import { useMessaging } from '../context/MessagingContext.jsx';

/* ════════════════════════════════════════════════════════════
   USER BOTTOM NAV — Mobile tab bar for user dashboard

   Tabs: Home · Explore · Saved · Messages · Account
   All links point to user routes only.
   No "Become a Provider" banner, no guest redirect.

   Used in UserAppLayout (replaces the public BottomNav
   for all /dashboard/* routes).
════════════════════════════════════════════════════════════ */

const TABS = [
  { labelKey: 'nav.home',      to: '/',                     icon: Home,           exact: true },
  { labelKey: 'nav.explore',   to: '/properties',           icon: Compass,        exact: false },
  { labelKey: 'nav.saved',     to: '/dashboard/wishlist',   icon: Heart,          exact: false },
  { labelKey: 'dashboard.messages', to: '/dashboard/messages', icon: MessageSquare, exact: false },
  { labelKey: 'nav.profile',   to: '/dashboard',            icon: User,           exact: true },
];

export default function UserBottomNav() {
  const { t }           = useTranslation();
  const { totalUnread } = useMessaging();
  const { pathname }    = useLocation();

  return (
    <nav
      aria-label="User navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 dark:bg-gray-950 dark:border-white/5 pb-safe md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-center h-16">
        {TABS.map(({ labelKey, to, icon: Icon, exact }) => {
          const label    = t(labelKey, { defaultValue: labelKey.split('.')[1] });
          const isActive = exact ? pathname === to : pathname.startsWith(to);
          const isMessages = to === '/dashboard/messages';
          const badge      = isMessages ? totalUnread : 0;

          return (
            <li key={to} className="flex-1">
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
                    className={isActive ? 'text-brand-gold' : 'text-gray-400'}
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

                <span className={`text-[10px] font-semibold capitalize ${
                  isActive ? 'text-brand-gold' : 'text-gray-400'
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
