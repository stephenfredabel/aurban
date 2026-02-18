import { useTranslation }     from 'react-i18next';
import { Link }               from 'react-router-dom';
import PageSEO                from '../components/seo/PageSEO.jsx';
import { ArrowRight, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth }            from '../context/AuthContext.jsx';
import CarouselSection             from '../components/CarouselSection.jsx';
import PropertyCard                from '../components/PropertyCard.jsx';
import ProductCard                 from '../components/ProductCard.jsx';
import RelocationProviderCard      from '../components/relocation/RelocationProviderCard.jsx';
import { useProperty }             from '../context/PropertyContext.jsx';

/* ── Promo slides (admin can add more) ──────────────────────── */
const PROMO_SLIDES = [
  {
    id: 1,
    title: 'Find Your Dream Home',
    subtitle: 'Explore thousands of verified listings across Nigeria',
    cta: { label: 'Browse Properties', to: '/properties' },
    bg: 'from-brand-charcoal-dark via-gray-800 to-brand-charcoal-dark',
    accent: 'bg-brand-gold',
    image: null, // placeholder — admin can set a real image URL
  },
  {
    id: 2,
    title: 'List Your Property Free',
    subtitle: 'Join 4,200+ providers earning more on Aurban',
    cta: { label: 'Become a Provider', to: '/onboarding' },
    bg: 'from-brand-gold-dark via-brand-gold to-brand-gold-dark',
    accent: 'bg-white',
    image: null,
  },
  {
    id: 3,
    title: 'Trusted Pro Services',
    subtitle: 'Verified plumbers, electricians, cleaners & more — with escrow protection',
    cta: { label: 'Explore Aurban Pro', to: '/pro' },
    bg: 'from-emerald-800 via-emerald-700 to-emerald-900',
    accent: 'bg-emerald-400',
    image: null,
  },
  {
    id: 4,
    title: 'Shop Building Materials',
    subtitle: 'Cement, tiles, furniture — all at the best prices',
    cta: { label: 'Visit Marketplace', to: '/marketplace' },
    bg: 'from-blue-900 via-blue-800 to-blue-900',
    accent: 'bg-blue-400',
    image: null,
  },
  {
    id: 5,
    title: 'Stress-Free Moving',
    subtitle: 'Compare verified movers, get instant quotes, move with confidence',
    cta: { label: 'Find Movers', to: '/relocation' },
    bg: 'from-purple-900 via-purple-800 to-purple-900',
    accent: 'bg-purple-400',
    image: null,
  },
  {
    id: 6,
    title: 'Book Shortlets Instantly',
    subtitle: 'Verified furnished apartments for your next trip or staycation',
    cta: { label: 'Browse Shortlets', to: '/shortlets' },
    bg: 'from-rose-900 via-rose-800 to-rose-900',
    accent: 'bg-rose-400',
    image: null,
  },
  {
    id: 7,
    title: 'Find Your Community',
    subtitle: 'Co-living spaces with verified housemates — safe, affordable, social',
    cta: { label: 'Explore Shared', to: '/shared' },
    bg: 'from-indigo-900 via-indigo-800 to-indigo-900',
    accent: 'bg-indigo-400',
    image: null,
  },
];

const PROVIDER_TYPES = [
  { label: 'Property Agent',    desc: 'List properties for sale or rent',  emoji: '🏠' },
  { label: 'Property Host',     desc: 'Short-lets, holiday & serviced apts', emoji: '🔑' },
  { label: 'Service Provider',  desc: 'Plumbing, electrical, relocation +', emoji: '🔧' },
  { label: 'Marketplace Seller',desc: 'Building materials, furniture +',   emoji: '🛒' },
];

export default function Home() {
  const { t }              = useTranslation();
  const { user }           = useAuth();
  const { properties, products, relocationProviders } = useProperty();

  const trendingProperties  = properties.slice(0, 10);
  const shortletProperties  = properties.filter(p => p.category === 'shortlet').slice(0, 10);
  const sharedProperties    = properties.filter(p => p.category === 'shared').slice(0, 10);
  const stayProperties      = properties.filter(p => p.category === 'stay').slice(0, 10);
  const rentalProperties    = properties.filter(p => ['rental', 'lease'].includes(p.category)).slice(0, 10);
  const landProperties      = properties.filter(p => p.category === 'land').slice(0, 10);
  const featuredProducts    = products.slice(0, 8);
  const isProvider          = ['provider', 'admin', 'host', 'agent', 'seller', 'service'].includes(user?.role);

  /* ── Promo slider state ─────────────────────────────────── */
  const [activeSlide, setActiveSlide] = useState(0);
  const timerRef = useRef(null);
  const slideCount = PROMO_SLIDES.length;

  const goTo = useCallback((idx) => {
    setActiveSlide((idx + slideCount) % slideCount);
  }, [slideCount]);

  // Auto-advance every 5s
  useEffect(() => {
    timerRef.current = setInterval(() => setActiveSlide(i => (i + 1) % slideCount), 5000);
    return () => clearInterval(timerRef.current);
  }, [slideCount]);

  // Reset timer on manual navigation
  const navigate = useCallback((idx) => {
    clearInterval(timerRef.current);
    goTo(idx);
    timerRef.current = setInterval(() => setActiveSlide(i => (i + 1) % slideCount), 5000);
  }, [goTo, slideCount]);

  const slide = PROMO_SLIDES[activeSlide];

  return (
    <div className="pb-36 md:pb-8 dark:bg-gray-950">
      <PageSEO
        title="Rent, Buy & Sell Property in Nigeria"
        description="Africa's #1 real estate platform. Find apartments, houses, shortlets, land and building materials across Lagos, Abuja, Port Harcourt and all of Nigeria."
        url="/"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Aurban',
          url: 'https://aurban.com',
          potentialAction: {
            '@type': 'SearchAction',
            target: { '@type': 'EntryPoint', urlTemplate: 'https://aurban.com/properties?q={search_term_string}' },
            'query-input': 'required name=search_term_string',
          },
        }}
      />

      {/* ── Promotional Slider ───────────────────────────────── */}
      <section className="relative overflow-hidden" aria-label="Promotions">
        {/* Slide */}
        <div
          className={`relative bg-gradient-to-r ${slide.bg} transition-colors duration-700`}
          style={{ minHeight: 0 }}
        >
          {/* Background image (when admin sets one) */}
          {slide.image && (
            <img
              src={slide.image}
              alt=""
              className="absolute inset-0 object-cover w-full h-full mix-blend-overlay opacity-40"
              aria-hidden
            />
          )}

          {/* Dot grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
              backgroundSize:  '28px 28px',
            }}
            aria-hidden
          />

          <div className="relative flex flex-col items-center justify-center px-6 py-14 text-center sm:py-20 lg:py-24">
            <h2
              key={slide.id}
              className="mb-3 text-2xl font-extrabold leading-tight text-white font-display sm:text-4xl lg:text-5xl animate-fade-up"
            >
              {slide.title}
            </h2>
            <p className="max-w-md mx-auto mb-8 text-sm leading-relaxed sm:text-base text-white/80 font-body">
              {slide.subtitle}
            </p>
            <Link
              to={slide.cta.to}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white transition-all rounded-xl bg-brand-gold hover:bg-brand-gold-dark hover:scale-105 shadow-lg"
            >
              {slide.cta.label}
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Left / Right arrows (desktop) */}
          <button
            onClick={() => navigate(activeSlide - 1)}
            className="absolute hidden p-2 -translate-y-1/2 rounded-full left-4 top-1/2 bg-black/20 backdrop-blur-sm text-white/80 hover:bg-black/40 md:flex"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => navigate(activeSlide + 1)}
            className="absolute hidden p-2 -translate-y-1/2 rounded-full right-4 top-1/2 bg-black/20 backdrop-blur-sm text-white/80 hover:bg-black/40 md:flex"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute flex gap-2 -translate-x-1/2 bottom-4 left-1/2">
            {PROMO_SLIDES.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => navigate(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                aria-current={idx === activeSlide ? 'true' : undefined}
                className={`rounded-full transition-all duration-300 ${
                  idx === activeSlide
                    ? 'w-6 h-2 bg-white'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending ────────────────────────────────────────── */}
      <section className="px-0 py-8 mx-auto max-w-7xl lg:px-4">
        <CarouselSection
          title={t('home.trending', { defaultValue: 'Trending' })}
          seeAllTo="/properties"
          items={trendingProperties}
          renderItem={(p) => <PropertyCard property={p} />}
        />
      </section>

      {/* ── Shortlets ──────────────────────────────────────── */}
      {shortletProperties.length > 0 && (
        <section className="px-0 py-8 mx-auto max-w-7xl lg:px-4">
          <CarouselSection
            title={t('home.shortlets', { defaultValue: 'Shortlets' })}
            seeAllTo="/shortlets"
            items={shortletProperties}
            renderItem={(p) => <PropertyCard property={p} />}
          />
        </section>
      )}

      {/* ── Shared Living ──────────────────────────────────── */}
      {sharedProperties.length > 0 && (
        <section className="px-0 py-8 mx-auto max-w-7xl lg:px-4">
          <CarouselSection
            title={t('home.shared', { defaultValue: 'Shared Living' })}
            seeAllTo="/shared"
            items={sharedProperties}
            renderItem={(p) => <PropertyCard property={p} />}
          />
        </section>
      )}

      {/* ── Stay (Long-term Furnished) ─────────────────────── */}
      {stayProperties.length > 0 && (
        <section className="px-0 py-8 mx-auto max-w-7xl lg:px-4">
          <CarouselSection
            title={t('home.stay', { defaultValue: 'Furnished Stays' })}
            seeAllTo="/properties?category=stay"
            items={stayProperties}
            renderItem={(p) => <PropertyCard property={p} />}
          />
        </section>
      )}

      {/* ── Rentals & Leasing ────────────────────────────── */}
      {rentalProperties.length > 0 && (
        <section className="px-0 py-8 mx-auto max-w-7xl lg:px-4">
          <CarouselSection
            title={t('home.rentals', { defaultValue: 'Rentals & Leasing' })}
            seeAllTo="/properties?category=rental"
            items={rentalProperties}
            renderItem={(p) => <PropertyCard property={p} />}
          />
        </section>
      )}

      {/* ── Lands ────────────────────────────────────────── */}
      {landProperties.length > 0 && (
        <section className="px-0 py-8 mx-auto max-w-7xl lg:px-4">
          <CarouselSection
            title={t('home.lands', { defaultValue: 'Lands' })}
            seeAllTo="/properties?category=land"
            items={landProperties}
            renderItem={(p) => <PropertyCard property={p} />}
          />
        </section>
      )}

      {/* ── Marketplace ──────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className="px-0 py-8 mx-auto max-w-7xl lg:px-4">
          <CarouselSection
            title={t('home.marketplace', { defaultValue: 'Marketplace' })}
            seeAllTo="/marketplace"
            items={featuredProducts}
            renderItem={(p) => <ProductCard product={p} />}
          />
        </section>
      )}

      {/* ── Relocation Services ──────────────────────────── */}
      {relocationProviders.length > 0 && (
        <section className="px-0 py-8 mx-auto max-w-7xl lg:px-4">
          <CarouselSection
            title={t('home.relocation', { defaultValue: 'Relocation Services' })}
            seeAllTo="/relocation"
            items={relocationProviders.slice(0, 8)}
            renderItem={(p) => <RelocationProviderCard provider={p} compact />}
          />
        </section>
      )}

      {/* ── Become a Provider CTA ─────────────────────────── */}
      {!isProvider && (
        <section className="px-4 py-6 mx-auto max-w-7xl">
          <div className="p-8 rounded-3xl bg-brand-charcoal-dark">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 bg-brand-gold/20 text-brand-gold text-xs font-bold px-4 py-1.5 rounded-full mb-4">
                <Briefcase size={12} />
                For Agents · Hosts · Pros · Sellers
              </div>
              <h2 className="mb-3 text-2xl font-extrabold text-white font-display sm:text-3xl">
                Grow your business on Aurban
              </h2>
              <p className="max-w-md mx-auto text-sm text-white/60 font-body">
                Join 4,200+ providers earning more by listing on Nigeria's fastest-growing real estate platform.
              </p>
            </div>

            {/* Provider types grid */}
            <div className="grid grid-cols-2 gap-3 mb-8 sm:grid-cols-4">
              {PROVIDER_TYPES.map(({ label, desc, emoji }) => (
                <div key={label} className="p-4 text-center border bg-white/8 rounded-2xl border-white/10">
                  <span className="block mb-2 text-2xl">{emoji}</span>
                  <p className="mb-1 text-xs font-bold text-white">{label}</p>
                  <p className="text-white/50 text-[11px] font-body">{desc}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center">
              <Link
                to="/onboarding"
                className="flex items-center gap-2 px-8 py-4 text-base font-bold text-white transition-colors shadow-lg bg-brand-gold hover:bg-brand-gold-dark rounded-2xl"
              >
                <Briefcase size={18} />
                Become a Provider — it's free
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}