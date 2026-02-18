import { NavLink, Link, useLocation } from 'react-router-dom';
import { useTranslation }             from 'react-i18next';
import { Home, Search, Heart, MessageSquare, User } from 'lucide-react';
import { useAuth }                    from '../context/AuthContext.jsx';
import { useProperty }                from '../context/PropertyContext.jsx';
import { useMessaging }               from '../context/MessagingContext.jsx';
import AurbanLogo                     from './AurbanLogo.jsx';

/* ────────────────────────────────────────────────────────────
   BOTTOM NAV — Fixed mobile tab bar

   Visible on: public pages, dashboard pages
   Hidden on:  auth pages, onboarding, messages thread
──────────────────────────────────────────────────────────── */

const TABS = [
  { labelKey: 'nav.home',     to: '/',                   icon: Home          },
  { labelKey: 'nav.explore',  to: '/properties',         icon: Search        },
  { labelKey: 'nav.saved',    to: '/dashboard/wishlist',  icon: Heart         },
  { labelKey: 'nav.messages', to: '/dashboard/messages',  icon: MessageSquare },
  { labelKey: 'nav.account',  to: '/dashboard',           icon: User          },
];

export default function BottomNav() {
  const { t }          = useTranslation();
  const { user }       = useAuth();
  const { wishlist }   = useProperty();
  const { totalUnread } = useMessaging();
  const { pathname }   = useLocation();

  /* ── Hide on auth / onboarding / full-screen pages ──────── */
  const hide = ['/onboarding', '/login', '/signup', '/register', '/dashboard/messages', '/forgot-password', '/reset-password', '/verify-email', '/2fa']
    .some(p => pathname.startsWith(p));
  if (hide) return null;

  const isProvider = ['provider', 'admin', 'host', 'agent', 'seller', 'service'].includes(user?.role);

  return (
    <>
      {/* ── Become a Provider banner (non-providers, mobile) ── */}
      {!isProvider && !user && (
        <div className="fixed left-0 right-0 z-40 px-4 pb-2 pointer-events-none bottom-16 md:hidden">
          <Link to="/provider/signup"
            className="pointer-events-auto flex items-center justify-between px-5 py-3 rounded-2xl
              bg-brand-charcoal-dark text-white shadow-lg border border-white/10
              active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <AurbanLogo size="xs" variant="white" />
              <div>
                <p className="text-sm font-bold leading-tight">Become a Provider</p>
                <p className="text-[11px] text-white/50 font-body mt-0.5">List · Offer services · Sell</p>
              </div>
            </div>
            <span className="ml-3 text-sm font-bold text-brand-gold shrink-0">Start →</span>
          </Link>
        </div>
      )}

      {/* ── Tab bar ────────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 dark:bg-brand-charcoal-dark dark:border-white/5 pb-safe md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="flex items-center h-16">
          {TABS.map(({ labelKey, to, icon: Icon }) => {
            const isActive   = to === '/' ? pathname === '/' : pathname.startsWith(to);
            const isWishlist = to === '/dashboard/wishlist';
            const isMessages = to === '/dashboard/messages';
            const badge = isWishlist
              ? (wishlist?.length > 0 ? wishlist.length : 0)
              : isMessages
              ? totalUnread
              : 0;
            const actualTo = (to.startsWith('/dashboard') && !user) ? '/login' : to;

            return (
              <li key={to} className="flex-1">
                <NavLink
                  to={actualTo}
                  aria-label={t(labelKey, { defaultValue: labelKey.split('.')[1] })}
                  aria-current={isActive ? 'page' : undefined}
                  className="relative flex flex-col items-center justify-center h-full gap-1"
                >
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
                    {badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none">
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold font-body capitalize ${isActive ? 'text-brand-gold' : 'text-gray-400'}`}>
                    {t(labelKey, { defaultValue: labelKey.split('.')[1] })}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}