import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2, LogIn, UserPlus, Mail, Phone,
  MapPin, Shield, ChevronRight,
} from 'lucide-react';
import { useAuth, isProviderRole } from '../context/AuthContext.jsx';
import AurbanLogo from './AurbanLogo.jsx';

/* ════════════════════════════════════════════════════════════
   FOOTER — Site-wide footer

   Contains:
   1. PROVIDER SIGNIN / SIGNUP section (the main provider entry)
   2. Company info & links
   3. Copyright

   Hidden on: auth pages, dashboards, full-screen pages
════════════════════════════════════════════════════════════ */

const LINK_SECTIONS = [
  {
    titleKey: 'footer.explore',
    links: [
      { labelKey: 'nav.rental',       to: '/properties' },
      { labelKey: 'nav.marketplace',  to: '/marketplace' },
      { labelKey: 'nav.pro',          to: '/pro' },
    ],
  },
  {
    titleKey: 'footer.company',
    links: [
      { labelKey: 'footer.aboutAurban', to: '#' },
      { labelKey: 'footer.careers',     to: '#' },
      { labelKey: 'footer.blog',        to: '#' },
      { labelKey: 'footer.press',       to: '#' },
    ],
  },
  {
    titleKey: 'footer.support',
    links: [
      { labelKey: 'footer.helpCentre',    to: '#' },
      { labelKey: 'footer.safety',        to: '#' },
      { labelKey: 'footer.trustSafety',   to: '#' },
      { labelKey: 'footer.accessibility', to: '#' },
    ],
  },
];

export default function Footer() {
  const { t }        = useTranslation();
  const { user }     = useAuth();
  const { pathname } = useLocation();

  const isProvider = user && isProviderRole(user.role);

  /* ── Hide on auth pages, dashboards, provider pages ──────── */
  const hide = [
    '/login', '/signup', '/onboarding',
    '/provider/login', '/provider/signup',
    '/dashboard', '/provider',
  ].some(p => pathname.startsWith(p));
  if (hide) return null;

  return (
    <footer className="hidden mt-12 border-t border-gray-100 md:block bg-gray-50 dark:bg-gray-900 dark:border-white/5">

      {/* ══════════════════════════════════════════════════════
           PROVIDER SECTION — Login / Signup for providers
      ══════════════════════════════════════════════════════ */}
      {!isProvider && (
        <div className="border-b border-gray-100 dark:border-white/5">
          <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 sm:py-10">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left sm:justify-between">

              {/* Left: Copy */}
              <div className="max-w-md">
                <div className="flex items-center justify-center gap-2 mb-2 sm:justify-start">
                  <Building2 size={18} className="text-brand-gold" />
                  <span className="text-xs font-bold tracking-wider uppercase text-brand-gold">
                    {t('provider.portal', 'Provider Portal')}
                  </span>
                </div>
                <h2 className="text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">
                  {t('provider.earnOnAurban', 'Earn on Aurban')}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  {t('provider.earnDesc', 'List properties, offer services, or sell products. Join thousands of providers growing their business.')}
                </p>
              </div>

              {/* Right: CTA buttons */}
              <div className="flex items-center gap-3">
                {user ? (
                  /* Logged-in user who is NOT a provider */
                  <Link to="/provider/signup"
                    className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-all rounded-full bg-brand-charcoal-dark hover:bg-brand-charcoal active:scale-[0.98]">
                    <UserPlus size={16} />
                    {t('provider.becomeProvider', 'Become a Provider')}
                    <ChevronRight size={14} />
                  </Link>
                ) : (
                  /* Guest — show both login and signup */
                  <>
                    <Link to="/provider/login"
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-full hover:bg-gray-50 dark:hover:bg-white/10 transition-all active:scale-[0.98]">
                      <LogIn size={15} />
                      {t('provider.providerLogin', 'Provider Login')}
                    </Link>
                    <Link to="/provider/signup"
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white transition-all rounded-full bg-brand-charcoal-dark hover:bg-brand-charcoal active:scale-[0.98]">
                      <UserPlus size={15} />
                      {t('provider.registerProvider', 'Register as Provider')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
           MAIN FOOTER CONTENT
      ══════════════════════════════════════════════════════ */}
      <div className="px-4 py-8 mx-auto max-w-7xl sm:px-6 sm:py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">

          {/* Brand column */}
          <div className="lg:col-span-2">
            <AurbanLogo size="sm" />
            <p className="max-w-xs mt-3 text-sm leading-relaxed text-gray-400">
              {t('footer.brandDesc', "Nigeria's premium real estate ecosystem. Find properties, connect with service providers, and shop the marketplace — all in one place.")}
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <a href="mailto:hello@aurban.ng" className="flex items-center gap-2 text-xs text-gray-400 transition-colors hover:text-gray-600">
                <Mail size={13} /> hello@aurban.ng
              </a>
              <a href="tel:+2340000000000" className="flex items-center gap-2 text-xs text-gray-400 transition-colors hover:text-gray-600">
                <Phone size={13} /> +234 000 000 0000
              </a>
              <span className="flex items-center gap-2 text-xs text-gray-400">
                <MapPin size={13} /> Lagos, Nigeria
              </span>
            </div>
          </div>

          {/* Link columns */}
          {LINK_SECTIONS.map(({ titleKey, links }) => (
            <div key={titleKey}>
              <h3 className="mb-3 text-xs font-bold tracking-wider uppercase text-brand-charcoal-dark dark:text-white">
                {t(titleKey)}
              </h3>
              <ul className="space-y-2">
                {links.map(({ labelKey, to }) => (
                  <li key={labelKey}>
                    <Link to={to} className="text-sm text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300">
                      {t(labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Copyright bar ──────────────────────────────────── */}
      <div className="px-4 py-4 border-t border-gray-100 dark:border-white/5 sm:px-6">
        <div className="flex flex-col items-center gap-2 mx-auto max-w-7xl sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <Shield size={12} />
            <span>{t('footer.sslSecured', 'SSL Secured')}</span>
            <span>&middot;</span>
            <span>{t('footer.rights', { year: new Date().getFullYear(), defaultValue: `© ${new Date().getFullYear()} Aurban Technologies Ltd.` })}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <Link to="/privacy" className="transition-colors hover:text-gray-600">{t('footer.privacy', 'Privacy')}</Link>
            <Link to="/terms" className="transition-colors hover:text-gray-600">{t('footer.terms', 'Terms')}</Link>
            <Link to="#" className="transition-colors hover:text-gray-600">{t('footer.cookies', 'Cookies')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}