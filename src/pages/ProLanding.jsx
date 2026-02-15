import { Link } from 'react-router-dom';
import {
  ArrowRight, Search, ShieldCheck, MapPin, KeyRound,
  Eye, Siren, Clock, Wallet, BadgeCheck, BarChart3,
  TrendingUp, Wrench, Paintbrush, Zap, Hammer,
} from 'lucide-react';
import { TIER_CONFIG } from '../data/proConstants.js';

/* ════════════════════════════════════════════════════════════
   AURBAN PRO — Marketing / Landing Page
   Route: /pro/about
════════════════════════════════════════════════════════════ */

const STEPS = [
  {
    num: 1,
    title: 'Browse & Book',
    desc: 'Find verified pros in your area. Compare ratings, reviews, and prices — then book in minutes.',
    Icon: Search,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  },
  {
    num: 2,
    title: 'Secure Payment',
    desc: 'Your payment is held safely in escrow. The provider only gets paid after you are satisfied.',
    Icon: Wallet,
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  },
  {
    num: 3,
    title: 'Service Delivery',
    desc: 'Provider arrives, checks in via GPS and OTP verification so you know the right person is on-site.',
    Icon: MapPin,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
  },
  {
    num: 4,
    title: 'Quality Guarantee',
    desc: 'An observation window lets you test the work before final payment is released to the provider.',
    Icon: Eye,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  },
];

const TIER_ICONS = {
  1: Paintbrush,
  2: Wrench,
  3: Zap,
  4: Hammer,
};

const TRUST_FEATURES = [
  {
    title: 'Escrow Protection',
    desc: 'Funds are held securely until you confirm the job is done right. No more paying upfront and hoping.',
    Icon: Wallet,
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400',
  },
  {
    title: 'Verified Providers',
    desc: 'Every professional is background-checked and identity-verified before they can accept bookings.',
    Icon: BadgeCheck,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  },
  {
    title: 'GPS Check-in',
    desc: 'Confirm the provider has arrived at your location with real-time GPS verification.',
    Icon: MapPin,
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400',
  },
  {
    title: 'OTP Verification',
    desc: 'A one-time code handshake between you and the provider ensures the right person shows up.',
    Icon: KeyRound,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400',
  },
  {
    title: 'Observation Window',
    desc: 'A quality assurance period after work is complete — report issues before balance is released.',
    Icon: Clock,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400',
  },
  {
    title: 'SOS Button',
    desc: 'Emergency help when you need it. One tap connects you with Aurban support in under 5 minutes.',
    Icon: Siren,
    color: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
  },
];

const PROVIDER_BENEFITS = [
  { Icon: BadgeCheck, text: 'Verified badge that builds client trust' },
  { Icon: ShieldCheck, text: 'Escrow protection — guaranteed payment for completed work' },
  { Icon: BarChart3, text: 'Dashboard analytics to track earnings & performance' },
  { Icon: TrendingUp, text: 'Level system — grow from New Pro to Gold Pro' },
];

export default function ProLanding() {
  const tiers = Object.entries(TIER_CONFIG);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">

      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-charcoal-dark via-gray-900 to-brand-charcoal-dark">
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden
        />

        <div className="relative px-6 py-16 mx-auto text-center max-w-4xl lg:py-28">
          <div className="inline-flex items-center gap-2 bg-brand-gold/20 text-brand-gold text-xs font-bold px-4 py-1.5 rounded-full mb-6">
            <ShieldCheck size={14} />
            Escrow-Protected Services
          </div>

          <h1 className="mb-4 text-3xl font-extrabold leading-tight text-white font-display sm:text-5xl lg:text-6xl">
            Aurban <span className="text-brand-gold">Pro</span>
          </h1>

          <p className="max-w-xl mx-auto mb-3 text-lg font-semibold text-white/90 sm:text-xl">
            Professional home services you can trust
          </p>

          <p className="max-w-lg mx-auto mb-10 text-sm leading-relaxed text-white/60 font-body sm:text-base">
            Every booking is protected by escrow, verified providers are background-checked,
            and an observation window guarantees quality before you pay.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/pro"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold text-white transition-all rounded-2xl bg-brand-gold hover:bg-brand-gold-dark hover:scale-105 shadow-lg"
            >
              Browse Services
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold transition-all border-2 rounded-2xl text-white/90 border-white/20 hover:border-white/40 hover:bg-white/5"
            >
              Become a Pro
            </Link>
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section className="px-6 py-16 mx-auto max-w-6xl lg:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white sm:text-3xl">
            How It Works
          </h2>
          <p className="max-w-md mx-auto text-sm text-gray-500 dark:text-white/50 font-body">
            From booking to quality guarantee — every step is designed to protect you.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ num, title, desc, Icon, color }) => (
            <div
              key={num}
              className="relative p-6 transition-shadow bg-white border border-gray-100 dark:bg-white/5 dark:border-white/10 rounded-2xl shadow-card hover:shadow-lg"
            >
              <span className="absolute text-6xl font-extrabold pointer-events-none -top-2 right-4 font-display text-gray-100 dark:text-white/5">
                {num}
              </span>
              <div className={`flex items-center justify-center w-11 h-11 mb-4 rounded-xl ${color}`}>
                <Icon size={20} />
              </div>
              <h3 className="mb-2 text-sm font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                {title}
              </h3>
              <p className="text-xs leading-relaxed text-gray-500 dark:text-white/50 font-body">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tier System ───────────────────────────────────────── */}
      <section className="px-6 py-16 bg-gray-50 dark:bg-gray-900/40 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white sm:text-3xl">
              Service Tiers
            </h2>
            <p className="max-w-lg mx-auto text-sm text-gray-500 dark:text-white/50 font-body">
              Different jobs need different protections. Our tier system matches observation
              windows and commitment fees to the complexity of the work.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map(([key, tier]) => {
              const TierIcon = TIER_ICONS[key] || Wrench;
              return (
                <div
                  key={key}
                  className="relative p-6 overflow-hidden bg-white border border-gray-100 dark:bg-white/5 dark:border-white/10 rounded-2xl shadow-card"
                >
                  <div className={`absolute top-0 left-0 w-full h-1 ${tier.badgeColor}`} />
                  <div className={`flex items-center justify-center w-11 h-11 mb-4 rounded-xl ${tier.iconBg}`}>
                    <TierIcon size={20} className={tier.badgeColor.replace('bg-', 'text-')} />
                  </div>
                  <h3 className="mb-1 text-sm font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                    {tier.label}
                  </h3>
                  <p className="mb-4 text-xs leading-relaxed text-gray-500 dark:text-white/50 font-body">
                    {tier.desc}
                  </p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                        Observation
                      </p>
                      <p className="text-lg font-extrabold text-brand-charcoal-dark dark:text-white font-display">
                        {tier.observationDays}
                        <span className="ml-0.5 text-xs font-semibold text-gray-400"> days</span>
                      </p>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                        Commitment
                      </p>
                      <p className="text-lg font-extrabold text-brand-charcoal-dark dark:text-white font-display">
                        {tier.commitmentFeePercent}
                        <span className="ml-0.5 text-xs font-semibold text-gray-400">%</span>
                      </p>
                    </div>
                  </div>
                  {tier.hasMilestones && (
                    <div className="mt-3 inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full">
                      Milestone payments
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Trust & Safety ────────────────────────────────────── */}
      <section className="px-6 py-16 mx-auto max-w-6xl lg:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white sm:text-3xl">
            Trust & Safety
          </h2>
          <p className="max-w-md mx-auto text-sm text-gray-500 dark:text-white/50 font-body">
            Six layers of protection so you can hire with confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TRUST_FEATURES.map(({ title, desc, Icon, color }) => (
            <div
              key={title}
              className="p-6 transition-shadow bg-white border border-gray-100 dark:bg-white/5 dark:border-white/10 rounded-2xl shadow-card hover:shadow-lg"
            >
              <div className={`flex items-center justify-center w-11 h-11 mb-4 rounded-xl ${color}`}>
                <Icon size={20} />
              </div>
              <h3 className="mb-2 text-sm font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                {title}
              </h3>
              <p className="text-xs leading-relaxed text-gray-500 dark:text-white/50 font-body">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── For Providers ─────────────────────────────────────── */}
      <section className="px-6 py-16 bg-gray-50 dark:bg-gray-900/40 lg:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="p-8 sm:p-12 rounded-3xl bg-brand-charcoal-dark">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 bg-brand-gold/20 text-brand-gold text-xs font-bold px-4 py-1.5 rounded-full mb-4">
                <Wrench size={12} />
                For Professionals
              </div>
              <h2 className="mb-3 text-2xl font-extrabold text-white font-display sm:text-3xl">
                Grow your business on Aurban Pro
              </h2>
              <p className="max-w-md mx-auto text-sm text-white/60 font-body">
                Join hundreds of verified professionals earning more with guaranteed payments
                and a growing client base.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2">
              {PROVIDER_BENEFITS.map(({ Icon, text }) => (
                <div
                  key={text}
                  className="flex items-start gap-3 p-4 border bg-white/8 rounded-2xl border-white/10"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-gold/20 shrink-0">
                    <Icon size={16} className="text-brand-gold" />
                  </div>
                  <p className="text-sm font-semibold leading-snug text-white/80 font-body">
                    {text}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center">
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold text-white transition-colors shadow-lg bg-brand-gold hover:bg-brand-gold-dark rounded-2xl"
              >
                Register as a Pro
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer CTA ────────────────────────────────────────── */}
      <section className="px-6 py-16 mx-auto text-center max-w-4xl lg:py-24">
        <h2 className="mb-3 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white sm:text-3xl">
          Ready to get started?
        </h2>
        <p className="max-w-md mx-auto mb-8 text-sm text-gray-500 dark:text-white/50 font-body">
          Whether you need a professional or you are one — Aurban Pro has you covered.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/pro"
            className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold text-white transition-all rounded-2xl bg-brand-gold hover:bg-brand-gold-dark hover:scale-105 shadow-lg"
          >
            Browse Services
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold transition-all border-2 rounded-2xl text-brand-charcoal-dark dark:text-white border-gray-200 dark:border-white/20 hover:border-brand-gold dark:hover:border-white/40"
          >
            Become a Pro
          </Link>
        </div>
      </section>
    </div>
  );
}
