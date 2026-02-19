import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BadgeCheck, Star, MapPin, Phone, MessageSquare,
  Calendar, ShieldCheck, Eye, Package, Clock, ChevronRight,
} from 'lucide-react';
import { useProperty }  from '../context/PropertyContext.jsx';
import { useCurrency }  from '../hooks/useCurrency.js';
import PropertyCard      from '../components/PropertyCard.jsx';
import Badge             from '../components/ui/Badge.jsx';

/* ════════════════════════════════════════════════════════════
   PROVIDER PUBLIC PROFILE — Read-only view visible to users

   Route:  /providers/:id
   Layout: AppLayout (public page with Header + Footer)

   Shows: avatar, name, tier, rating, stats, listings,
   reviews, contact actions
════════════════════════════════════════════════════════════ */

export default function ProviderPublicProfile() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { properties, services, products } = useProperty();
  useCurrency();

  // Find all listings by this provider
  const providerListings = properties.filter(p => p.providerId === id);
  const providerServices = services.filter(s => s.providerId === id);
  const providerProducts = products.filter(p => p.providerId === id);

  // Get provider info from first listing
  const anyListing = providerListings[0] || providerServices[0] || providerProducts[0];

  if (!anyListing) {
    return (
      <div className="max-w-2xl px-4 py-16 mx-auto text-center">
        <p className="mb-4 text-4xl">👤</p>
        <h1 className="mb-2 text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">Provider not found</h1>
        <p className="mb-6 text-sm text-gray-400">This provider may no longer be active on Aurban.</p>
        <Link to="/properties" className="btn-primary text-sm inline-flex items-center gap-1.5">
          <ArrowLeft size={14} /> Browse Listings
        </Link>
      </div>
    );
  }

  const {
    providerId, providerName, providerRole, providerAvatar,
    providerRating, providerReviews, providerVerified, providerTier,
    providerPhone,
  } = anyListing;

  const initial = providerName?.charAt(0) || 'A';
  const tierVariant = providerTier === 3 ? 'tier3' : providerTier === 2 ? 'tier2' : 'tier1';

  // Aggregate stats
  const totalListings  = providerListings.length + providerServices.length + providerProducts.length;
  const totalViews     = [...providerListings, ...providerServices, ...providerProducts]
    .reduce((s, l) => s + (l.views || 0), 0);
  const totalInquiries = [...providerListings, ...providerServices, ...providerProducts]
    .reduce((s, l) => s + (l.inquiries || 0), 0);

  // Collect all reviews from all listings
  const allReviews = providerListings
    .flatMap(p => p.reviews || [])
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Navigate to messages with provider context
  const handleMessage = () => {
    const first = providerListings[0] || providerServices[0] || providerProducts[0];
    const params = new URLSearchParams({
      listing:      first?.id || id,
      provider:     providerId || id,
      providerName: providerName || 'Provider',
      title:        first?.title || `Inquiry to ${providerName || 'Provider'}`,
      type:         first?.category || first?.type || 'general',
    });
    navigate(`/dashboard/messages?${params.toString()}`);
  };

  return (
    <div className="pb-28 lg:pb-8 dark:bg-gray-950">

      {/* ── Back nav ────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-2 mx-auto max-w-6xl">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-brand-charcoal dark:text-gray-400 hover:text-brand-charcoal-dark dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="px-4 mx-auto max-w-6xl">

        {/* ── Provider Header Card ──────────────────────────── */}
        <div className="p-6 mb-6 bg-white border border-gray-100 dark:bg-brand-charcoal-dark dark:border-white/10 rounded-2xl shadow-card">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            {/* Avatar */}
            {providerAvatar ? (
              <img src={providerAvatar} alt={providerName} className="object-cover w-20 h-20 rounded-full" />
            ) : (
              <div className="flex items-center justify-center w-20 h-20 text-3xl font-bold rounded-full shrink-0 bg-brand-gold/15 text-brand-gold">
                {initial}
              </div>
            )}

            <div className="flex-1 min-w-0 text-center sm:text-left">
              {/* Name + verified */}
              <div className="flex items-center justify-center gap-2 mb-1 sm:justify-start">
                <h1 className="text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                  {providerName}
                </h1>
                {providerVerified && <BadgeCheck size={20} className="text-brand-gold" />}
              </div>

              {/* Badges */}
              <div className="flex items-center justify-center gap-2 mb-3 sm:justify-start">
                <Badge variant={tierVariant} size="sm" />
                {providerRole && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 capitalize">
                    {providerRole}
                  </span>
                )}
              </div>

              {/* Rating */}
              {providerRating && (
                <div className="flex items-center justify-center gap-2 mb-3 sm:justify-start">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={14}
                        className={i <= Math.round(providerRating) ? 'text-brand-gold fill-brand-gold' : 'text-gray-300 dark:text-gray-600'}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{providerRating}</span>
                  <span className="text-xs text-gray-400">({providerReviews} reviews)</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <button
                  onClick={handleMessage}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white transition-colors bg-brand-gold hover:bg-brand-gold-dark rounded-xl"
                >
                  <MessageSquare size={14} /> Message
                </button>
                {providerPhone && (
                  <a
                    href={`tel:${providerPhone}`}
                    className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold transition-colors border border-gray-200 dark:border-white/10 text-brand-charcoal-dark dark:text-white hover:border-brand-gold rounded-xl"
                  >
                    <Phone size={14} /> Call
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats Grid ────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
          {[
            { icon: Package, label: 'Listings', value: totalListings },
            { icon: Star, label: 'Rating', value: providerRating ? `${providerRating}★` : 'N/A' },
            { icon: Eye, label: 'Total Views', value: totalViews.toLocaleString() },
            { icon: MessageSquare, label: 'Inquiries', value: totalInquiries.toLocaleString() },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 p-4 bg-white dark:bg-brand-charcoal-dark border border-gray-100 dark:border-white/10 rounded-2xl">
              <Icon size={18} className="text-brand-gold" />
              <span className="text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">{value}</span>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Trust Badge ───────────────────────────────────── */}
        {providerVerified && (
          <div className="flex items-start gap-3 p-4 mb-6 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
            <ShieldCheck size={18} className="text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Verified Provider</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                This provider's identity, business registration, and credentials have been verified by Aurban.
                All transactions are protected by our escrow system.
              </p>
            </div>
          </div>
        )}

        {/* ── Active Listings ───────────────────────────────── */}
        {providerListings.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">
              Properties ({providerListings.length})
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {providerListings.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          </div>
        )}

        {/* ── Reviews ───────────────────────────────────────── */}
        {allReviews.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">
              Reviews ({allReviews.length})
            </h2>
            <div className="space-y-3">
              {allReviews.slice(0, 6).map(review => (
                <div key={review.id} className="p-4 bg-white dark:bg-brand-charcoal-dark border border-gray-100 dark:border-white/10 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 text-xs font-bold rounded-full bg-brand-gold/10 text-brand-gold">
                        {review.userName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">{review.userName}</p>
                        {review.stayType && (
                          <p className="text-[10px] text-gray-400">{review.stayDuration || review.stayType}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} size={10}
                            className={i <= review.rating ? 'text-brand-gold fill-brand-gold' : 'text-gray-300 dark:text-gray-600'}
                          />
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{review.date}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty listings fallback ───────────────────────── */}
        {totalListings === 0 && (
          <div className="py-12 text-center">
            <p className="mb-2 text-4xl">📋</p>
            <h2 className="mb-1 text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">
              No active listings
            </h2>
            <p className="text-sm text-gray-400">
              This provider doesn't have any active listings at the moment.
            </p>
          </div>
        )}
      </div>

      {/* ── Sticky CTA (mobile) ─────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex gap-3 px-4 py-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-white/10 pb-safe shadow-nav lg:hidden">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate text-brand-charcoal-dark dark:text-white">{providerName}</p>
          <p className="text-xs text-gray-400">{providerRating}★ · {providerReviews} reviews</p>
        </div>
        <button
          onClick={handleMessage}
          className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white transition-colors rounded-xl bg-brand-gold hover:bg-brand-gold-dark"
        >
          <MessageSquare size={14} /> Message
        </button>
      </div>
    </div>
  );
}
