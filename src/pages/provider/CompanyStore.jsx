import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Building2, MapPin, Star, BadgeCheck, MessageCircle,
  Phone, Package, Home, Wrench, Calendar, Users,
} from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency.js';

/* ── Mock data ─────────────────────────────────────────────── */
const MOCK_COMPANY = {
  id: 'comp1',
  name: 'Veritasi Homes & Properties',
  description:
    'Leading real estate development company with a focus on luxury and affordable housing across Lagos and Abuja. Over 15 years of excellence in the Nigerian real estate industry.',
  logo: null,
  cacVerified: true,
  rcNumber: 'RC-123456',
  location: 'Victoria Island, Lagos',
  yearEstablished: 2009,
  teamSize: '25-50',
  website: 'https://veritasihomes.com',
  stats: { totalListings: 47, avgRating: 4.8, reviewCount: 156, yearsActive: 16 },
};

const MOCK_LISTINGS = [
  { id: 'cl1', title: '4 Bedroom Detached Duplex', category: 'buy', price: 85000000, image: null, type: 'property' },
  { id: 'cl2', title: '3 Bed Apartment, Ikoyi', category: 'rental', price: 5000000, image: null, type: 'property' },
  { id: 'cl3', title: 'Premium Cement (Dangote)', category: 'building_materials', price: 5800, image: null, type: 'product' },
  { id: 'cl4', title: 'Full Home Renovation', category: 'renovation', price: 2500000, image: null, type: 'pro' },
  { id: 'cl5', title: 'Land — 800sqm Lekki', category: 'land', price: 45000000, image: null, type: 'property' },
  { id: 'cl6', title: 'Electrical Wiring Service', category: 'electrical', price: 350000, image: null, type: 'pro' },
];

/* ── Tab config ────────────────────────────────────────────── */
const TABS = [
  { id: 'properties', label: 'Properties', icon: Home },
  { id: 'products',   label: 'Products',   icon: Package },
  { id: 'pro',        label: 'Pro Services', icon: Wrench },
];

/* ── Helpers ───────────────────────────────────────────────── */
function filterByTab(listings, tabId) {
  if (tabId === 'properties') return listings.filter((l) => l.type === 'property');
  if (tabId === 'products')   return listings.filter((l) => l.type === 'product');
  if (tabId === 'pro')        return listings.filter((l) => l.type === 'pro');
  return listings;
}

function categoryLabel(cat) {
  return cat
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ════════════════════════════════════════════════════════════
   COMPANY STORE — Public-facing storefront / provider preview
════════════════════════════════════════════════════════════ */
export default function CompanyStore({ preview = false }) {
  const { companyId } = useParams();
  const { format }    = useCurrency();

  /* In a real implementation these would come from an API call keyed
     by companyId (or from provider context when preview === true).
     For now we use mock data. */
  const company  = MOCK_COMPANY;
  const listings = MOCK_LISTINGS;

  const [activeTab, setActiveTab] = useState('properties');
  const filtered = filterByTab(listings, activeTab);

  const currentYear = new Date().getFullYear();
  const yearsActive = company.stats.yearsActive
    ?? (currentYear - company.yearEstablished);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-charcoal-dark">
      {/* ── Preview banner (provider dashboard only) ──────── */}
      {preview && (
        <div className="px-4 py-2 text-xs font-medium text-center text-brand-charcoal-dark bg-brand-gold">
          Preview Mode — This is how customers see your store
        </div>
      )}

      <div className="max-w-5xl px-4 py-8 mx-auto sm:px-6 lg:px-8">
        {/* ═══════════════════════════════════════════════════
           COMPANY BANNER
        ═══════════════════════════════════════════════════ */}
        <div className="p-6 bg-white border border-gray-100 dark:bg-gray-900 rounded-2xl dark:border-white/10 shadow-card sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            {/* Logo / placeholder */}
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 shrink-0">
              {company.logo ? (
                <img
                  src={company.logo}
                  alt={company.name}
                  className="object-cover w-full h-full rounded-2xl"
                />
              ) : (
                <Building2 size={32} className="text-brand-gold" />
              )}
            </div>

            {/* Info block */}
            <div className="flex-1 min-w-0">
              {/* Name + badge */}
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold sm:text-2xl font-display text-brand-charcoal-dark dark:text-white">
                  {company.name}
                </h1>
                {company.cacVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full">
                    <BadgeCheck size={12} className="text-emerald-500" />
                    Verified Company
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {company.description}
              </p>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-gray-400 dark:text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin size={12} className="shrink-0" />
                  {company.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="shrink-0" />
                  Est. {company.yearEstablished}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} className="shrink-0" />
                  {company.teamSize} team
                </span>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                {[
                  { label: 'Listings', value: company.stats.totalListings },
                  {
                    label: 'Rating',
                    value: company.stats.avgRating,
                    extra: (
                      <Star size={12} className="text-brand-gold fill-brand-gold" />
                    ),
                    suffix: ` (${company.stats.reviewCount})`,
                  },
                  { label: 'Years Active', value: yearsActive },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 text-center bg-gray-50 dark:bg-white/5 rounded-xl"
                  >
                    <div className="flex items-center justify-center gap-1">
                      {s.extra}
                      <span className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
                        {s.value}
                      </span>
                      {s.suffix && (
                        <span className="text-[10px] text-gray-400">{s.suffix}</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Contact buttons */}
              {!preview && (
                <div className="flex gap-2 mt-5">
                  <button className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors rounded-full bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark">
                    <MessageCircle size={14} />
                    Send Message
                  </button>
                  <button className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-600 transition-colors bg-gray-100 rounded-full dark:bg-white/10 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20">
                    <Phone size={14} />
                    Call
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
           TABBED LISTINGS
        ═══════════════════════════════════════════════════ */}
        <div className="mt-6">
          {/* Tab bar */}
          <div className="flex gap-1 p-1 overflow-x-auto bg-gray-100 dark:bg-white/5 rounded-xl scrollbar-hide">
            {TABS.map((t) => {
              const Icon   = t.icon;
              const active = activeTab === t.id;
              const count  = filterByTab(listings, t.id).length;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all
                    ${active
                      ? 'bg-white dark:bg-gray-800 text-brand-charcoal-dark dark:text-white shadow-sm'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                >
                  <Icon size={14} />
                  {t.label}
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium
                      ${active
                        ? 'bg-brand-gold/10 text-brand-gold'
                        : 'bg-gray-200 dark:bg-white/10 text-gray-400'
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Listing grid */}
          <div className="mt-4">
            {filtered.length === 0 ? (
              <div className="py-16 text-center bg-white border border-gray-100 dark:bg-gray-900 rounded-2xl dark:border-white/10">
                <Package size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  No listings in this category yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {filtered.map((item) => (
                  <div
                    key={item.id}
                    className="overflow-hidden transition-shadow bg-white border border-gray-100 dark:bg-gray-900 rounded-2xl dark:border-white/10 shadow-card hover:shadow-md group"
                  >
                    {/* Image placeholder */}
                    <div className="relative h-32 bg-gradient-to-br from-brand-gold/20 to-brand-gold/5 sm:h-40">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full">
                          <span className="text-3xl font-black font-display text-brand-gold/30">
                            A
                          </span>
                        </div>
                      )}

                      {/* Category badge */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-medium bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-brand-charcoal-dark dark:text-gray-200 rounded-full capitalize shadow-sm">
                        {categoryLabel(item.category)}
                      </span>
                    </div>

                    {/* Card body */}
                    <div className="p-3">
                      <h3 className="text-sm font-semibold leading-snug font-display text-brand-charcoal-dark dark:text-white line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm font-bold font-display text-brand-gold">
                        {format(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
