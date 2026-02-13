import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation }       from 'react-i18next';
import {
  LayoutDashboard, ListFilter, PlusCircle,
  MessageSquare, Settings,
} from 'lucide-react';
import { useMessaging } from '../context/MessagingContext.jsx';

/* ════════════════════════════════════════════════════════════
   PROVIDER BOTTOM NAV — Mobile tab bar for providers

   Tabs: Overview · Listings · Add · Messages · Settings
   All links point to /provider/* routes only.
   No user-facing tabs (Home, Explore, Saved, Account).

   Used in ProviderAppLayout (replaces the user-facing BottomNav
   for all /provider/* routes).
════════════════════════════════════════════════════════════ */

const TABS = [
  { labelKey: 'dashboard.overview',    to: '/provider',              icon: LayoutDashboard, exact: true },
  { labelKey: 'dashboard.listings',    to: '/provider/listings',     icon: ListFilter                   },
  { labelKey: 'dashboard.add',         to: '/provider/listings/new', icon: PlusCircle,      highlight: true },
  { labelKey: 'dashboard.messages',    to: '/provider/messages',     icon: MessageSquare                },
  { labelKey: 'dashboard.settings',    to: '/provider/settings',     icon: Settings                     },
];

export default function ProviderBottomNav() {
  const { t }           = useTranslation();
  const { totalUnread } = useMessaging();
  const { pathname }    = useLocation();

  return (
    <nav
      aria-label="Provider navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 dark:bg-gray-950 dark:border-white/5 pb-safe md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-center h-16">
        {TABS.map(({ labelKey, to, icon: Icon, exact, highlight }) => {
          const label = t(labelKey, { defaultValue: labelKey.split('.')[1] });
          const isActive  = exact ? pathname === to : pathname.startsWith(to);
          const isMessages = to === '/provider/messages';
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
                  {/* Highlight ring for Add button */}
                  {highlight && !isActive ? (
                    <div className="flex items-center justify-center w-9 h-9 -mt-3 rounded-full bg-brand-gold shadow-md">
                      <Icon size={20} className="text-white" strokeWidth={2.2} />
                    </div>
                  ) : (
                    <Icon
                      size={22}
                      className={isActive ? 'text-brand-gold' : 'text-gray-400'}
                      fill={isActive ? 'currentColor' : 'none'}
                      strokeWidth={isActive ? 0 : 1.8}
                    />
                  )}

                  {/* Unread badge */}
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>

                <span className={`text-[10px] font-semibold capitalize ${
                  highlight && !isActive ? '-mt-0.5 text-brand-gold' :
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
