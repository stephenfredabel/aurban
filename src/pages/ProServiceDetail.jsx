import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronLeft, Star, MapPin, BadgeCheck, MessageSquare,
  Clock, Shield, Phone, Calendar, Wrench,
} from 'lucide-react';
import { useProListing } from '../context/ProListingContext.jsx';
import { useCurrency } from '../hooks/useCurrency.js';
import { PRO_SERVICE_CATEGORY_MAP } from '../data/proServiceCategoryFields.js';
import { PRO_PRICING_MODES, TIER_CONFIG } from '../data/proConstants.js';
import ProTierBadge from '../components/pro/ProTierBadge.jsx';
import ProProviderBadge from '../components/pro/ProProviderBadge.jsx';
import EscrowExplainer from '../components/pro/EscrowExplainer.jsx';

/* ════════════════════════════════════════════════════════════
   PRO SERVICE DETAIL PAGE
   Route: /pro/:id
════════════════════════════════════════════════════════════ */

export default function ProServiceDetail() {
  const { id } = useParams();
  const { getListingById } = useProListing();
  const { symbol } = useCurrency();
  const service = getListingById(id);

  useEffect(() => {
    document.title = service ? `${service.title} — Aurban Pro` : 'Service — Aurban Pro';
  }, [service]);

  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Wrench size={48} className="mb-4 text-gray-200 dark:text-gray-700" />
        <p className="mb-2 text-lg font-bold text-brand-charcoal-dark dark:text-white">Service not found</p>
        <p className="mb-5 text-sm text-gray-400">This listing may no longer be available.</p>
        <Link to="/pro" className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white rounded-xl bg-brand-gold hover:bg-brand-gold-dark">
          Browse Services
        </Link>
      </div>
    );
  }

  const catDef = PRO_SERVICE_CATEGORY_MAP[service.category];
  const tierCfg = TIER_CONFIG[service.tier] || TIER_CONFIG[1];
  const pricingLabel = PRO_PRICING_MODES[service.pricingMode]?.label;
  const initial = service.providerName?.charAt(0) || 'P';

  return (
    <div className="min-h-screen bg-white dark:bg-brand-charcoal-dark">

      {/* Back nav */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 dark:bg-brand-charcoal-dark dark:border-white/10">
        <div className="flex items-center gap-3 px-4 py-3 mx-auto max-w-4xl">
          <Link to="/pro" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-gold transition-colors">
            <ChevronLeft size={16} /> Aurban Pro
          </Link>
        </div>
      </div>

      <div className="px-4 mx-auto max-w-4xl">

        {/* ── Header Section ── */}
        <div className="pt-6 pb-4">
          {/* Category + tier badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/70">
              {catDef?.icon} {catDef?.label}
            </span>
            <ProTierBadge tier={service.tier} size="sm" />
            {service.subcategory && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 dark:bg-white/5 text-gray-500">
                {service.subcategory}
              </span>
            )}
          </div>

          <h1 className="mb-3 text-2xl font-extrabold leading-tight font-display text-brand-charcoal-dark dark:text-white">
            {service.title}
          </h1>

          {/* Rating + location */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            {service.rating > 0 && (
              <span className="flex items-center gap-1">
                <Star size={14} className="text-brand-gold fill-brand-gold" />
                <span className="font-bold text-brand-charcoal-dark dark:text-white">{service.rating}</span>
                ({service.reviewCount} reviews)
              </span>
            )}
            {service.state && (
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {service.lga ? `${service.lga}, ` : ''}{service.state}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={14} /> {tierCfg.observationDays}-day observation
            </span>
          </div>
        </div>

        {/* ── Grid: Main + Sidebar ── */}
        <div className="grid gap-6 pb-12 lg:grid-cols-3">

          {/* ── Main Content ── */}
          <div className="space-y-6 lg:col-span-2">

            {/* Provider card */}
            <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-12 h-12 text-lg font-bold rounded-2xl shrink-0 bg-purple-500/15 text-purple-500">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold truncate text-brand-charcoal-dark dark:text-white">{service.providerName}</h3>
                    {service.providerVerified && <BadgeCheck size={16} className="text-brand-gold shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <ProProviderBadge level={service.providerLevel} />
                    {service.providerRating > 0 && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Star size={10} className="text-brand-gold fill-brand-gold" />
                        {service.providerRating} ({service.providerReviews})
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`/dashboard/messages?provider=${service.providerId}&type=pro`}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:border-brand-gold transition-colors">
                  <MessageSquare size={12} /> Message
                </Link>
                <Link to={`/providers/${service.providerId}`}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:border-brand-gold transition-colors">
                  View Profile
                </Link>
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="mb-2 text-sm font-bold text-brand-charcoal-dark dark:text-white">About This Service</h2>
              <p className="text-sm leading-relaxed text-gray-600 dark:text-white/70">{service.description}</p>
              {service.priceNote && (
                <p className="mt-2 text-xs text-gray-400 italic">{service.priceNote}</p>
              )}
            </div>

            {/* Category-specific fields */}
            {service.fields && Object.keys(service.fields).length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-bold text-brand-charcoal-dark dark:text-white">Service Specifications</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {catDef?.fields?.map(fieldDef => {
                    const val = service.fields[fieldDef.id];
                    if (val === undefined || val === null || val === '') return null;
                    const display = Array.isArray(val) ? val.join(', ')
                      : typeof val === 'boolean' ? (val ? 'Yes' : 'No')
                      : String(val);
                    return (
                      <div key={fieldDef.id} className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
                        <span className="text-xs font-semibold text-gray-400 min-w-[100px] shrink-0">{fieldDef.label}</span>
                        <span className="text-xs font-medium text-brand-charcoal-dark dark:text-white">{display}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Escrow explainer */}
            <EscrowExplainer
              tier={service.tier}
              price={service.pricingMode !== 'quote' ? service.price : null}
            />
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4">

            {/* Price card + CTA */}
            <div className="sticky p-5 border border-gray-100 dark:border-white/10 rounded-2xl top-20">
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-1">{pricingLabel || 'Price'}</p>
                <p className="text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                  {service.pricingMode === 'quote' ? 'Custom Quote' : `${symbol}${service.price?.toLocaleString()}`}
                </p>
              </div>

              {/* Payment split preview */}
              {service.pricingMode !== 'quote' && service.price && (
                <div className="p-3 mb-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Split</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Commitment ({tierCfg.commitmentFeePercent}%)</span>
                      <span className="font-bold text-brand-charcoal-dark dark:text-white">
                        {symbol}{Math.round(service.price * tierCfg.commitmentFeePercent / 100).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Balance (after observation)</span>
                      <span className="font-bold text-brand-charcoal-dark dark:text-white">
                        {symbol}{Math.round(service.price * (100 - tierCfg.commitmentFeePercent) / 100).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <Link
                to={`/pro/book/${service.id}`}
                className="flex items-center justify-center w-full gap-2 px-5 py-3 text-sm font-bold text-white transition-colors rounded-xl bg-brand-gold hover:bg-brand-gold-dark"
              >
                <Calendar size={16} />
                {service.pricingMode === 'quote' ? 'Request Quote' : 'Book Now'}
              </Link>

              <p className="mt-3 text-[10px] text-center text-gray-400">
                <Shield size={10} className="inline mr-1" />
                Protected by Aurban Escrow
              </p>
            </div>

            {/* Quick info */}
            <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
              <h3 className="mb-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Info</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Category</span>
                  <span className="font-semibold text-brand-charcoal-dark dark:text-white">{catDef?.label}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Tier</span>
                  <ProTierBadge tier={service.tier} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Observation</span>
                  <span className="font-semibold text-brand-charcoal-dark dark:text-white">{tierCfg.observationDays} days</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Commitment</span>
                  <span className="font-semibold text-brand-charcoal-dark dark:text-white">{tierCfg.commitmentFeePercent}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Location</span>
                  <span className="font-semibold text-brand-charcoal-dark dark:text-white">{service.state}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
