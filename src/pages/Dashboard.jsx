import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, Heart, MessageCircle, FileText, Search,
  Clock, TrendingUp, ChevronRight, Briefcase,
  MapPin, Bell, Star, Home, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import UserDashboardLayout from '../Layout/UserDashboardLayout.jsx';

/* ════════════════════════════════════════════════════════════
   DASHBOARD — User overview / home page
   
   Smart redirect:
   • Providers → /provider (their dashboard)
   • Regular users → this page (user overview)
   
   Shows:
   • Welcome greeting
   • Quick stats (saved, messages, viewed, agreements)
   • Recent activity feed
   • Quick search shortcuts
   • Active agreements summary
   • Recommended listings (stub)
════════════════════════════════════════════════════════════ */

/* ── Mock activity data ───────────────────────────────────── */
const MOCK_ACTIVITY = [
  { id: 1, type: 'inquiry_reply', title: 'Tunde Properties replied to your inquiry', subtitle: '3 Bedroom Flat in Lekki Phase 1', time: '2h ago', icon: MessageCircle, color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10' },
  { id: 2, type: 'price_drop', title: 'Price dropped on a saved listing', subtitle: 'Land for Sale — 500sqm Ibeju-Lekki (₦18M → ₦15M)', time: '5h ago', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' },
  { id: 3, type: 'agreement', title: 'New agreement ready for review', subtitle: 'Interior Design Contract — Décor Masters NG', time: '1d ago', icon: FileText, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10' },
  { id: 4, type: 'new_listing', title: 'New listing in your preferred area', subtitle: '2 Bedroom in Victoria Island — ₦3.5M/yr', time: '2d ago', icon: Home, color: 'text-brand-gold bg-brand-gold/10' },
];

const QUICK_SEARCHES = [
  { label: '2 Bed in Lekki', query: '/properties?beds=2&state=Lagos&area=Lekki' },
  { label: 'Land in Ibeju', query: '/properties?type=land&state=Lagos&area=Ibeju-Lekki' },
  { label: 'Shortlets Lagos', query: '/properties?type=shortlet&state=Lagos' },
  { label: 'Plumbers', query: '/services?category=plumber' },
];

export default function Dashboard() {
  const { user }  = useAuth();
  const navigate   = useNavigate();

  /* ── Provider redirect ──────────────────────────────────── */
  const isProvider = ['provider', 'admin', 'host', 'agent', 'seller', 'service'].includes(user?.role);

  useEffect(() => {
    if (isProvider) navigate('/provider', { replace: true });
  }, [isProvider, navigate]);

  if (isProvider) return null;

  /* ── Greet by time of day ───────────────────────────────── */
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <UserDashboardLayout>
      <div className="space-y-5">

        {/* ── Welcome card ────────────────────────────────── */}
        <div className="relative p-5 overflow-hidden text-white bg-brand-charcoal-dark rounded-2xl">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-brand-gold/5 -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 w-20 h-20 translate-y-1/2 rounded-full right-12 bg-white/5" />
          <div className="relative z-10">
            <p className="text-sm text-gray-400">{greeting},</p>
            <h1 className="font-display text-xl font-bold mt-0.5">
              {user?.name?.split(' ')[0] || 'Welcome'} 👋
            </h1>
            <p className="mt-2 text-xs text-gray-500">Your Aurban activity at a glance</p>
          </div>
        </div>

        {/* ── Quick stats ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Saved', value: '5', icon: Heart, color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10', to: '/dashboard/wishlist' },
            { label: 'Messages', value: '3', icon: MessageCircle, color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10', to: '/dashboard/messages', badge: 3 },
            { label: 'Viewed', value: '8', icon: Eye, color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10', to: '/dashboard/history' },
            { label: 'Agreements', value: '2', icon: FileText, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10', to: '/dashboard/agreements' },
          ].map(({ label, value, icon: Icon, color, to, badge }) => (
            <Link key={label} to={to}
              className="p-4 transition-shadow bg-white dark:bg-gray-900 rounded-2xl shadow-card hover:shadow-card-hover group">
              <div className="flex items-center justify-between mb-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                  <Icon size={15} />
                </div>
                {badge && (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-brand-gold text-white text-[9px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">{value}</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[11px] text-gray-400">{label}</p>
                <ChevronRight size={12} className="text-gray-300 transition-colors group-hover:text-brand-gold" />
              </div>
            </Link>
          ))}
        </div>

        {/* ── Quick search shortcuts ──────────────────────── */}
        <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Quick Search</h2>
            <Link to="/properties" className="text-[11px] text-brand-gold font-semibold flex items-center gap-0.5 hover:underline">
              Browse All <ArrowRight size={10} />
            </Link>
          </div>
          <div className="flex gap-2 pb-1 overflow-x-auto scroll-x">
            {QUICK_SEARCHES.map((qs) => (
              <Link key={qs.label} to={qs.query}
                className="shrink-0 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-brand-gold hover:text-brand-gold transition-colors flex items-center gap-1.5">
                <Search size={11} />
                {qs.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Recent activity ─────────────────────────────── */}
        <div className="overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <div className="flex items-center justify-between p-4 pb-2">
            <h2 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Recent Activity</h2>
            <Bell size={14} className="text-gray-300" />
          </div>

          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {MOCK_ACTIVITY.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-charcoal-dark dark:text-white">{item.title}</p>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{item.subtitle}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{item.time}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Become a provider CTA (for non-providers) ───── */}
        {!isProvider && (
          <div className="p-5 border bg-gradient-to-r from-brand-gold/10 to-brand-gold/5 dark:from-brand-gold/10 dark:to-transparent rounded-2xl border-brand-gold/20">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand-gold/10 shrink-0">
                <Briefcase size={18} className="text-brand-gold" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Become a Provider</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-3">
                  List properties, offer services, or sell products on Aurban. Reach thousands of potential clients.
                </p>
                <Link to="/onboarding"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-gold hover:underline">
                  Get Started <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
}