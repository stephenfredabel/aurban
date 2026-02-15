import { Link, useLocation } from 'react-router-dom';
import { useTranslation }    from 'react-i18next';

/* ────────────────────────────────────────────────────────────
   HEADER NAVIGATION — Category tab strip below the main header

   RULES:
   • Shows on PUBLIC pages (home, properties, marketplace)
   • HIDDEN on /dashboard/* and /provider/* routes
   • Desktop: centred horizontal tabs
   • Mobile: horizontal scroll strip
──────────────────────────────────────────────────────────── */

export default function HeaderNavigation() {
  const { t }    = useTranslation();
  const location = useLocation();

  /* ── Hide on dashboard / provider routes ────────────────── */
  const isDashboardOrProvider =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/provider');

  if (isDashboardOrProvider) return null;

  const tabs = [
    { label: t('nav.rental',      'Rental'),      to: '/properties?category=rental' },
    { label: t('nav.lease',       'Lease'),        to: '/properties?category=lease'  },
    { label: t('nav.buy',         'Buy'),          to: '/properties?category=buy'    },
    { label: t('nav.land',        'Land'),         to: '/properties?category=land'   },
    { label: t('nav.shortlets',   'Shortlets'),     to: '/shortlets'                  },
    { label: t('nav.shared',      'Shared'),        to: '/shared'                     },
    { label: t('nav.relocation', 'Relocation'),   to: '/relocation'                 },
    { label: t('nav.marketplace', 'Marketplace'),  to: '/marketplace'                },
    { label: t('nav.pro',         'Aurban Pro'),   to: '/pro'                        },
  ];

  const isActive = (tab) => {
    const [path, query] = tab.to.split('?');
    if (query) {
      return location.pathname === path && location.search.includes(query);
    }
    return location.pathname === path;
  };

  return (
    <div className="sticky top-[57px] z-40 bg-white dark:bg-gray-950 border-b border-gray-50 dark:border-white/5">
      <div className="px-4 mx-auto sm:px-6 max-w-7xl">
        <nav
          className="flex items-center justify-center gap-1 py-1.5 overflow-x-auto scroll-x"
          role="navigation"
          aria-label="Category navigation"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tabs.map((tab) => {
            const active = isActive(tab);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={[
                  'px-4 py-2 text-sm font-medium font-body rounded-xl whitespace-nowrap transition-colors shrink-0',
                  active
                    ? 'text-brand-charcoal-dark dark:text-white bg-gray-100 dark:bg-white/10'
                    : 'text-gray-500 dark:text-gray-400 hover:text-brand-charcoal-dark dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5',
                ].join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}