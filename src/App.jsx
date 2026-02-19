import { Suspense, lazy, useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { LocaleProvider }    from './context/LocaleContext.jsx';
import { PropertyProvider }  from './context/PropertyContext.jsx';
import { MessagingProvider } from './context/MessagingContext.jsx';
import { BookingProvider }  from './context/BookingContext.jsx';
import { CartProvider }    from './context/CartContext.jsx';
import { OrderProvider }   from './context/OrderContext.jsx';
import { ProListingProvider } from './context/ProListingContext.jsx';
import { ProBookingProvider } from './context/ProBookingContext.jsx';
import RTLWrapper           from './components/language/RTLWrapper.jsx';
import Header               from './components/Header.jsx';
import HeaderNavigation     from './components/HeaderNavigation.jsx';
import BottomNav            from './components/BottomNav.jsx';
import Footer               from './components/Footer.jsx';
import ProtectedRoute        from './Routes/ProtectedRoute.jsx';
import DashboardLayout       from './Layout/DashboardLayout.jsx';
import UserDashboardLayout   from './Layout/UserDashboardLayout.jsx';
import ProviderHeader        from './components/ProviderHeader.jsx';
import ProviderBottomNav     from './components/ProviderBottomNav.jsx';
import UserHeader            from './components/UserHeader.jsx';
import UserBottomNav         from './components/UserBottomNav.jsx';
import AdminHeader           from './components/admin/AdminHeader.jsx';
import AdminFooter           from './components/admin/AdminFooter.jsx';
import AdminBottomNav        from './components/admin/AdminBottomNav.jsx';
import EscalationPanel       from './components/admin/EscalationPanel.jsx';
import AdminMessagingPanel   from './components/admin/AdminMessagingPanel.jsx';
import AdminQuickAction     from './components/admin/AdminQuickAction.jsx';
import { getTotalUnread }    from './services/adminMessaging.service.js';
import { ADMIN_ENTRY_PATH } from './utils/rbac.js';
import useAdminSecurity    from './hooks/useAdminSecurity.js';
import useDashboardSecurity from './hooks/useDashboardSecurity.js';

/* ════════════════════════════════════════════════════════════
   APP.JSX — Root application component

   Provider chain:
   Router → AuthProvider → LocaleProvider → PropertyProvider
         → MessagingProvider → RTLWrapper → content

   Layouts:
   • AppLayout     — Header + HeaderNav + Footer + BottomNav (public pages)
   • DashboardLayout — Provider sidebar (provider pages)
   • UserDashboardLayout — User sidebar (user dashboard pages)
     ↳ Imported inside each user dashboard page component

   ═══════════════════════════════════════════════════════════
   AUTH FLOW SEPARATION:
   ─────────────────────────────────────────────────────────
   HEADER  → Login / SignUp = Users/Visitors ONLY
             After login → back to marketplace (/)
             Dashboard → /dashboard/*

   FOOTER  → Provider Login / Register = Providers ONLY
             After login → /provider
             Dashboard → /provider/*
   ═══════════════════════════════════════════════════════════

   Route structure:
   PUBLIC
   • /              → Home
   • /properties    → Property listing grid
   • /property/:id  → Property detail
   • /marketplace   → Products marketplace
   • /product/:id   → Product detail
   • /vendor/:id    → Public vendor store
   • /checkout      → Checkout wizard (protected)
   • /relocation    → Relocation services marketplace
   • /relocation/:id→ Relocation provider detail
   • /shortlets     → Short-term accommodation listings
   • /shared        → Shared/co-living accommodation listings
   • /roommates     → Roommate finder (coming soon)
   • /providers/:id → Provider public profile

   USER AUTH (Header → returns to marketplace)
   • /login            → User login (→ /)
   • /signup           → User sign up (→ /)
   • /forgot-password  → Password recovery
   • /reset-password   → Set new password
   • /verify-email     → Email verification
   • /2fa/setup        → Two-factor setup (protected)
   • /2fa/verify       → Two-factor verification

   PROVIDER AUTH (Footer → goes to /provider)
   • /provider/login   → Provider login (→ /provider)
   • /provider/signup  → Provider registration (→ /provider)
   • /onboarding       → Provider profile completion wizard

   LEGAL
   • /terms                → Terms of service
   • /privacy              → Privacy policy
   • /community-guidelines → Community guidelines

   USER DASHBOARD (protected)
   • /dashboard             → User overview
   • /dashboard/wishlist    → Saved items
   • /dashboard/messages    → User inbox
   • /dashboard/history     → Recently viewed
   • /dashboard/agreements  → Contracts & leases
   • /dashboard/orders      → User marketplace orders
   • /dashboard/orders/:id  → Order detail + tracking
   • /dashboard/settings    → User account settings

   PROVIDER DASHBOARD (protected, provider role required)
   • /provider              → Provider dashboard (overview)
   • /provider/profile      → Provider profile editor
   • /provider/listings     → My listings
   • /provider/analytics    → Full analytics page (standalone)
   • /provider/payouts      → Payout management
   • /provider/messages     → Provider messages
   • /provider/agreements   → Provider agreements
   • /provider/reviews      → Client reviews
   • /provider/settings     → Provider settings (8 sections)
   • /provider/listings/new → Create listing wizard
   • /listings/new          → Create listing wizard (alt route)
   • /listings/new/:type    → Create listing wizard (with type)

   ProviderDashboard.jsx handles internal URL-based routing for:
   messages, agreements, reviews, settings, profile
   (each delegated to its own sub-page component)
   overview, listings, analytics, payouts remain as inline tabs
════════════════════════════════════════════════════════════ */

/* ── Eagerly loaded (critical path) ────────────────────── */
import Home  from './pages/Home.jsx';
import Login from './pages/Login.jsx';

/* ── Lazily loaded (code-split) ────────────────────────── */

// Public pages
const Properties    = lazy(() => import('./pages/Properties.jsx'));
const Property      = lazy(() => import('./pages/Property.jsx'));
const Marketplace          = lazy(() => import('./pages/Marketplace.jsx'));
const ProductDetail        = lazy(() => import('./pages/ProductDetail.jsx'));
const Relocation           = lazy(() => import('./pages/Relocation.jsx'));
const RelocationProvider   = lazy(() => import('./pages/RelocationProvider.jsx'));
const Shortlets            = lazy(() => import('./pages/Shortlets.jsx'));
const SharedAccommodation  = lazy(() => import('./pages/SharedAccommodation.jsx'));

// User auth pages (Header flow → back to marketplace)
const SignUp            = lazy(() => import('./pages/user/SignUp.jsx'));

// Provider auth pages (Footer flow → /provider)
const ProviderLogin     = lazy(() => import('./pages/provider/login.jsx'));
const ProviderSignUp    = lazy(() => import('./pages/provider/SignUp.jsx'));
const RegisterHost      = lazy(() => import('./pages/RegisterHost.jsx'));
const OnboardingPage    = lazy(() => import('./components/onboarding/index.jsx'));

// Shared auth pages
const ForgotPassword    = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword     = lazy(() => import('./pages/ResetPassword.jsx'));
const VerifyEmail       = lazy(() => import('./pages/VerifyEmail.jsx'));
const TwoFactorSetup   = lazy(() => import('./pages/TwoFactorSetup.jsx'));
const TwoFactorVerify  = lazy(() => import('./pages/TwoFactorVerify.jsx'));

// User dashboard pages
const Dashboard     = lazy(() => import('./pages/user/UserDashboard.jsx'));
const Wishlist      = lazy(() => import('./pages/user/Wishlist.jsx'));
const Messages      = lazy(() => import('./pages/user/Messages.jsx'));
const UserHistory   = lazy(() => import('./pages/user/History.jsx'));
const Agreements    = lazy(() => import('./pages/user/Agreements.jsx'));
const UserSettings  = lazy(() => import('./pages/user/Settings.jsx'));
const UserBookings  = lazy(() => import('./pages/user/Bookings.jsx'));
const UserOrders    = lazy(() => import('./pages/user/Orders.jsx'));
const UserOrderDetail = lazy(() => import('./pages/user/OrderDetail.jsx'));
const UserProBookings = lazy(() => import('./pages/user/ProBookings.jsx'));
const UserProBookingDetail = lazy(() => import('./pages/user/ProBookingDetail.jsx'));
const UserAnalytics = lazy(() => import('./pages/user/UserAnalytics.jsx'));

// Legal pages
const Terms               = lazy(() => import('./pages/Terms.jsx'));
const Privacy             = lazy(() => import('./pages/Privacy.jsx'));
const CommunityGuidelines = lazy(() => import('./pages/CommunityGuidelines.jsx'));

// Marketplace flow
const Checkout          = lazy(() => import('./pages/Checkout.jsx'));
const VendorStore       = lazy(() => import('./pages/VendorStore.jsx'));

// Aurban Pro (service marketplace)
const ProServices       = lazy(() => import('./pages/ProServices.jsx'));
const ProServiceDetail  = lazy(() => import('./pages/ProServiceDetail.jsx'));
const ProBooking        = lazy(() => import('./pages/ProBooking.jsx'));
const ProLanding        = lazy(() => import('./pages/ProLanding.jsx'));

// Company storefront (public view)
const CompanyStorePage  = lazy(() => import('./pages/provider/CompanyStore.jsx'));

// Feature pages
const Roommates         = lazy(() => import('./pages/Roommates.jsx'));

// Provider dashboard pages
const ProviderDash      = lazy(() => import('./pages/ProviderDashboard.jsx'));
const ProviderAnalytics = lazy(() => import('./pages/provider/Analytics.jsx'));
const ProviderPublicProfile = lazy(() => import('./pages/ProviderPublicProfile.jsx'));
const CreateListing     = lazy(() => import('./pages/provider/CreateListing.jsx'));

// Admin auth (isolated from user/provider flows)
const AdminLogin        = lazy(() => import('./pages/admin/AdminLogin.jsx'));


/* ═══════════════════════════════════════════════════════════
   THEME INITIALIZER
   Reads saved theme from sessionStorage and applies dark class.
   Runs once on mount, before any render.
═══════════════════════════════════════════════════════════ */
function ThemeInitializer({ children }) {
  if (typeof window !== 'undefined') {
    try {
      const saved = sessionStorage.getItem('aurban_theme');
      if (saved === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (saved === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        }
      }
    } catch { /* ignore */ }
  }
  return children;
}


/* ═══════════════════════════════════════════════════════════
   PAGE LOADER
   Full-screen loading spinner for Suspense fallback.
═══════════════════════════════════════════════════════════ */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-950">
      <div className="text-center">
        <div className="flex items-center justify-center w-10 h-10 mx-auto mb-3 rounded-xl bg-brand-gold animate-pulse">
          <span className="text-sm font-black text-white font-display">A</span>
        </div>
        <p className="text-xs font-medium text-gray-400">Loading...</p>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   APP LAYOUT — Role-aware wrapper for public pages

   Guest        → Header + BottomNav  (login/signup buttons)
   User         → UserHeader + UserBottomNav  (user links)
   Provider     → ProviderHeader + ProviderBottomNav  (provider links)

   HeaderNavigation + Footer are always shown (category nav + desktop footer).
═══════════════════════════════════════════════════════════ */
import { isAdminRole } from './utils/rbac.js';

const PROVIDER_ROLES = [
  'provider', 'admin', 'host', 'agent', 'seller', 'service',
  'super_admin', 'operations_admin', 'moderator',
  'verification_admin', 'support_admin', 'finance_admin', 'compliance_admin',
];

function AppLayout({ children }) {
  const { user } = useAuth();
  const isProvider = user && (PROVIDER_ROLES.includes(user.role) || isAdminRole(user.role));
  const isUser     = user && !isProvider;

  return (
    <>
      {isProvider ? <ProviderHeader /> : isUser ? <UserHeader /> : <Header />}
      <HeaderNavigation />
      <main id="main-content" className="flex-1 min-h-0">
        {children}
      </main>
      <Footer />
      {isProvider ? <ProviderBottomNav /> : isUser ? <UserBottomNav /> : <BottomNav />}
    </>
  );
}


/* ═══════════════════════════════════════════════════════════
   PROVIDER APP LAYOUT
   Wraps provider dashboard pages with ProviderHeader + ProviderBottomNav.
   No user-facing Header, HeaderNavigation, Footer, or BottomNav.
═══════════════════════════════════════════════════════════ */
function ProviderAppLayout({ children }) {
  const { isAdmin } = useAuth();
  const [escalationOpen, setEscalationOpen] = useState(false);
  const [messagingOpen, setMessagingOpen]   = useState(false);
  const messagingUnread = isAdmin ? getTotalUnread() : 0;

  // Anti-screenshot, anti-screenrecord, anti-console on admin panels
  useAdminSecurity({ enabled: isAdmin });

  // Lighter security for non-admin providers (console lockdown, sensitive right-click block)
  useDashboardSecurity({ enabled: import.meta.env.PROD && !isAdmin });

  // Block search engine indexing on all provider/admin pages
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex, nofollow');
    return () => { if (meta.parentNode) meta.parentNode.removeChild(meta); };
  }, []);

  return (
    <>
      {isAdmin ? (
        <AdminHeader
          onToggleEscalation={() => setEscalationOpen(v => !v)}
          escalationCount={3}
          onToggleMessaging={() => setMessagingOpen(v => !v)}
          messagingUnread={messagingUnread}
        />
      ) : (
        <ProviderHeader />
      )}
      <main id="main-content" className="flex-1 min-h-0">
        {children}
      </main>
      {isAdmin ? (
        <>
          <AdminFooter />
          <AdminBottomNav />
          <EscalationPanel isOpen={escalationOpen} onClose={() => setEscalationOpen(false)} />
          <AdminMessagingPanel isOpen={messagingOpen} onClose={() => setMessagingOpen(false)} />
          {!messagingOpen && (
            <AdminQuickAction
              unreadCount={messagingUnread}
              onClick={() => setMessagingOpen(v => !v)}
            />
          )}
        </>
      ) : (
        <ProviderBottomNav />
      )}
    </>
  );
}


/* ═══════════════════════════════════════════════════════════
   USER APP LAYOUT
   Wraps user dashboard pages with UserHeader + UserBottomNav.
   No provider-facing content, no public Header/Footer/BottomNav.
═══════════════════════════════════════════════════════════ */
function UserAppLayout({ children }) {
  useDashboardSecurity({ enabled: import.meta.env.PROD });

  return (
    <>
      <UserHeader />
      <main id="main-content" className="flex-1 min-h-0">
        {children}
      </main>
      <UserBottomNav />
    </>
  );
}


/* ═══════════════════════════════════════════════════════════
   404 PAGE
═══════════════════════════════════════════════════════════ */
function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <div className="mb-4 text-6xl">🔍</div>
      <h1 className="text-3xl font-bold font-display text-brand-charcoal-dark dark:text-white">404</h1>
      <p className="mt-2 text-gray-400">This page does not exist on Aurban.</p>
      <a href="/" className="inline-block mt-6 text-sm btn-primary">Go Home</a>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   APP — Root component
═══════════════════════════════════════════════════════════ */
export default function App() {
  return (
    <HelmetProvider>
    <Router>
      <ThemeInitializer>
        <AuthProvider>
          <LocaleProvider>
            <PropertyProvider>
              <MessagingProvider>
              <BookingProvider>
              <CartProvider>
              <OrderProvider>
              <ProListingProvider>
              <ProBookingProvider>
              <RTLWrapper>
                <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950 font-body text-brand-charcoal dark:text-white
                  xl:max-w-[1440px] xl:mx-auto xl:shadow-[0_0_40px_rgba(0,0,0,0.06)] xl:border-x xl:border-gray-200/60
                  dark:xl:shadow-[0_0_40px_rgba(0,0,0,0.3)] dark:xl:border-white/5">

                  {/* Skip to content — accessibility */}
                  <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]
                      focus:px-4 focus:py-2 focus:bg-brand-gold focus:text-white focus:rounded-xl focus:text-sm focus:font-bold"
                  >
                    Skip to content
                  </a>

                  <Suspense fallback={<PageLoader />}>
                    <Routes>

                      {/* ══ PUBLIC PAGES ══════════════════════════ */}
                      <Route path="/"             element={<AppLayout><Home /></AppLayout>} />
                      <Route path="/properties"   element={<AppLayout><Properties /></AppLayout>} />
                      <Route path="/property/:id" element={<AppLayout><Property /></AppLayout>} />
                      <Route path="/marketplace"  element={<AppLayout><Marketplace /></AppLayout>} />
                      <Route path="/product/:id"  element={<AppLayout><ProductDetail /></AppLayout>} />
                      <Route path="/relocation"     element={<AppLayout><Relocation /></AppLayout>} />
                      <Route path="/relocation/:id" element={<AppLayout><RelocationProvider /></AppLayout>} />
                      <Route path="/shortlets"      element={<AppLayout><Shortlets /></AppLayout>} />
                      <Route path="/shared"         element={<AppLayout><SharedAccommodation /></AppLayout>} />
                      <Route path="/vendor/:id"     element={<AppLayout><VendorStore /></AppLayout>} />
                      <Route path="/company/:id"    element={<AppLayout><CompanyStorePage /></AppLayout>} />
                      <Route path="/pro"            element={<AppLayout><ProServices /></AppLayout>} />
                      <Route path="/pro/about"      element={<AppLayout><ProLanding /></AppLayout>} />
                      <Route path="/pro/:id"        element={<AppLayout><ProServiceDetail /></AppLayout>} />
                      <Route path="/pro/book/:id"   element={
                        <ProtectedRoute>
                          <AppLayout><ProBooking /></AppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/checkout"       element={
                        <ProtectedRoute>
                          <AppLayout><Checkout /></AppLayout>
                        </ProtectedRoute>
                      } />

                      {/* ══ USER AUTH (Header flow — no layout) ══
                           These are for end-users/visitors ONLY.
                           Login/SignUp buttons live in the Header.
                           After login → back to marketplace (/)
                      ═════════════════════════════════════════════ */}
                      <Route path="/login"      element={<Login />} />
                      <Route path="/signup"     element={<SignUp />} />

                      {/* ══ PROVIDER AUTH (Footer flow — no layout) ═
                           These are for providers ONLY.
                           Login/Register buttons live in the Footer.
                           After login → /provider dashboard
                      ═════════════════════════════════════════════ */}
                      <Route path="/provider/login"   element={<ProviderLogin />} />
                      <Route path="/provider/signup" element={<ProviderSignUp />} />
                      <Route path="/onboarding" element={
                        <ProtectedRoute requiredRole="provider">
                          <OnboardingPage />
                        </ProtectedRoute>
                      } />

                      {/* ══ ADMIN AUTH (isolated — no layout, no marketplace links) ══
                           Admins ONLY. Completely separate from user/provider flows.
                           Non-obvious path to prevent discovery via URL scanning.
                           After login  → /provider (admin dashboard)
                           After logout → ADMIN_ENTRY_PATH (back here)
                      ═════════════════════════════════════════════════ */}
                      <Route path={ADMIN_ENTRY_PATH} element={<AdminLogin />} />

                      {/* ══ SHARED AUTH PAGES ═════════════════════ */}
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password"  element={<ResetPassword />} />
                      <Route path="/verify-email"    element={<VerifyEmail />} />
                      <Route path="/2fa/setup"       element={
                        <ProtectedRoute><TwoFactorSetup /></ProtectedRoute>
                      } />
                      <Route path="/2fa/verify"      element={<TwoFactorVerify />} />

                      {/* ══ USER DASHBOARD ═══════════════════════
                           For users/visitors ONLY (role: 'user').
                           UserAppLayout adds UserHeader + UserBottomNav.
                           UserDashboardLayout adds collapsible sidebar.
                      ═════════════════════════════════════════════ */}
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <UserAppLayout><UserDashboardLayout><Dashboard /></UserDashboardLayout></UserAppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/dashboard/wishlist" element={
                        <ProtectedRoute>
                          <UserAppLayout><UserDashboardLayout><Wishlist /></UserDashboardLayout></UserAppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/dashboard/messages" element={
                        <ProtectedRoute>
                          <UserAppLayout><UserDashboardLayout><Messages /></UserDashboardLayout></UserAppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/dashboard/history" element={
                        <ProtectedRoute>
                          <UserAppLayout><UserDashboardLayout><UserHistory /></UserDashboardLayout></UserAppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/dashboard/agreements" element={
                        <ProtectedRoute>
                          <UserAppLayout><UserDashboardLayout><Agreements /></UserDashboardLayout></UserAppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/dashboard/settings" element={
                        <ProtectedRoute>
                          <UserAppLayout><UserDashboardLayout><UserSettings /></UserDashboardLayout></UserAppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/dashboard/bookings" element={
                        <ProtectedRoute>
                          <UserAppLayout><UserDashboardLayout><UserBookings /></UserDashboardLayout></UserAppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/dashboard/orders" element={
                        <ProtectedRoute>
                          <UserAppLayout><UserDashboardLayout><UserOrders /></UserDashboardLayout></UserAppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/dashboard/orders/:id" element={
                        <ProtectedRoute>
                          <UserAppLayout><UserDashboardLayout><UserOrderDetail /></UserDashboardLayout></UserAppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/dashboard/pro-bookings" element={
                        <ProtectedRoute>
                          <UserAppLayout><UserDashboardLayout><UserProBookings /></UserDashboardLayout></UserAppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/dashboard/pro-bookings/:id" element={
                        <ProtectedRoute>
                          <UserAppLayout><UserDashboardLayout><UserProBookingDetail /></UserDashboardLayout></UserAppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/dashboard/analytics" element={
                        <ProtectedRoute>
                          <UserAppLayout><UserDashboardLayout><UserAnalytics /></UserDashboardLayout></UserAppLayout>
                        </ProtectedRoute>
                      } />

                      {/* ══ LEGAL PAGES ════════════════════════════ */}
                      <Route path="/terms"                element={<AppLayout><Terms /></AppLayout>} />
                      <Route path="/privacy"              element={<AppLayout><Privacy /></AppLayout>} />
                      <Route path="/community-guidelines" element={<AppLayout><CommunityGuidelines /></AppLayout>} />

                      {/* ══ FEATURE PAGES ══════════════════════════ */}
                      <Route path="/roommates" element={<AppLayout><Roommates /></AppLayout>} />

                      {/* ══ PROVIDER PUBLIC PROFILE ═════════════════ */}
                      <Route path="/providers/:id" element={<AppLayout><ProviderPublicProfile /></AppLayout>} />

                      {/* ══ PROVIDER DASHBOARD ═══════════════════
                           For providers ONLY (role: provider/host/agent/seller/service).
                           Reached via Footer login → /provider

                           ROUTING STRATEGY:
                           ─────────────────
                           1. Specific routes FIRST for standalone pages
                              that have their own layout wrapping
                              (Analytics full page, CreateListing wizard)

                           2. Wildcard route LAST — catches everything else
                              and delegates to ProviderDashboard.jsx which
                              handles internal URL-based sub-page routing:
                              • /provider           → Overview (inline tab)
                              • /provider/listings   → Listings (inline tab)
                              • /provider/payouts    → Payouts (inline tab)
                              • /provider/messages   → ProviderMessages
                              • /provider/agreements → ProviderAgreements
                              • /provider/reviews    → ProviderReviews
                              • /provider/settings   → ProviderSettings
                              • /provider/profile    → ProviderProfileEdit

                           ProviderDashboard wraps each sub-page in
                           DashboardLayout internally, so no wrapper here.
                      ═════════════════════════════════════════════ */}

                      {/* ── Provider Analytics (standalone full page) ─
                           This is the expanded analytics view with charts,
                           separate from the inline summary tab. Wrapped
                           in DashboardLayout here since it's standalone. */}
                      <Route path="/provider/analytics" element={
                        <ProtectedRoute requiredRole="provider">
                          <ProviderAppLayout>
                            <DashboardLayout>
                              <ProviderAnalytics />
                            </DashboardLayout>
                          </ProviderAppLayout>
                        </ProtectedRoute>
                      } />

                      {/* ── Create Listing (standalone wizard) ───── */}
                      <Route path="/provider/listings/new" element={
                        <ProtectedRoute requiredRole="provider">
                          <ProviderAppLayout>
                            <DashboardLayout>
                              <CreateListing />
                            </DashboardLayout>
                          </ProviderAppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/listings/new" element={
                        <ProtectedRoute requiredRole="provider">
                          <ProviderAppLayout>
                            <DashboardLayout>
                              <CreateListing />
                            </DashboardLayout>
                          </ProviderAppLayout>
                        </ProtectedRoute>
                      } />
                      <Route path="/listings/new/:type" element={
                        <ProtectedRoute requiredRole="provider">
                          <ProviderAppLayout>
                            <DashboardLayout>
                              <CreateListing />
                            </DashboardLayout>
                          </ProviderAppLayout>
                        </ProtectedRoute>
                      } />

                      {/* ── Provider Dashboard (wildcard catch-all) ──
                           IMPORTANT: This MUST come after all specific
                           /provider/* routes above. React Router v6
                           ranks routes by specificity, so explicit paths
                           like /provider/analytics always win over the
                           wildcard. This catches:
                           /provider, /provider/messages, /provider/settings,
                           /provider/agreements, /provider/reviews,
                           /provider/profile, /provider/listings, /provider/payouts
                      ───────────────────────────────────────────── */}
                      <Route path="/provider/*" element={
                        <ProtectedRoute requiredRole="provider">
                          <ProviderAppLayout><ProviderDash /></ProviderAppLayout>
                        </ProtectedRoute>
                      } />

                      {/* ══ 404 ══════════════════════════════════ */}
                      <Route path="*" element={<AppLayout><NotFound /></AppLayout>} />

                    </Routes>
                  </Suspense>
                </div>
              </RTLWrapper>
              </ProBookingProvider>
              </ProListingProvider>
              </OrderProvider>
              </CartProvider>
              </BookingProvider>
              </MessagingProvider>
            </PropertyProvider>
          </LocaleProvider>
        </AuthProvider>
      </ThemeInitializer>
    </Router>
    </HelmetProvider>
  );
}