import { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation }    from 'react-i18next';
import {
  ArrowLeft, Heart, Share2, MapPin, Bed, Bath,
  Maximize2, BadgeCheck, Calendar, MessageSquare,
  Car, Eye, Clock, Star,
} from 'lucide-react';
import { useProperty }       from '../context/PropertyContext.jsx';
import { useBooking }        from '../context/BookingContext.jsx';
import { useCurrency }       from '../hooks/useCurrency.js';
import PropertyCard          from '../components/PropertyCard.jsx';
import ImageGallery          from '../components/ImageGallery.jsx';
import InspectionBooking     from '../components/booking/InspectionBooking.jsx';
import Modal                 from '../components/ui/Modal.jsx';
import BookingPanel          from '../components/accommodation/BookingPanel.jsx';
import HouseRules            from '../components/accommodation/HouseRules.jsx';
import ReviewSection         from '../components/accommodation/ReviewSection.jsx';
import ProviderInfoCard      from '../components/accommodation/ProviderInfoCard.jsx';
import HousemateProfiles     from '../components/accommodation/HousemateProfiles.jsx';
import NigerianDeclarations  from '../components/accommodation/NigerianDeclarations.jsx';
import UtilityInfo           from '../components/accommodation/UtilityInfo.jsx';

/* ════════════════════════════════════════════════════════════
   PROPERTY DETAIL PAGE — Enhanced for accommodation types

   13 Sections:
   1.  Back navigation
   2.  Photo gallery + actions
   3.  Title + price + location + category badge
   4.  Stats grid (beds · baths · sqm · parking)
   5.  Description (about)
   6.  Amenities grid
   7.  House rules (shortlet/shared/stay)
   8.  Nigerian declarations (shortlet/shared/stay)
   9.  Housemate profiles (shared only)
   10. Utility info (shared only)
   11. Reviews
   12. Provider info card
   13. Similar properties

   Layout:
   • Mobile — single column, sticky CTA at bottom
   • Desktop — 2-column (content left, booking panel right)
════════════════════════════════════════════════════════════ */

const CATEGORY_LABELS = {
  shortlet: 'Shortlet',
  shared:   'Shared',
  stay:     'Stay',
  rental:   'Rental',
  buy:      'For Sale',
  lease:    'Lease',
  land:     'Land',
};

export default function PropertyDetail() {
  const { id }  = useParams();
  const { t }   = useTranslation();
  const navigate = useNavigate();
  const { toggleWishlist, isWishlisted, getPropertyById, filterProperties } = useProperty();
  const { formatWithUnit } = useCurrency();
  const { addBooking }     = useBooking();

  const [bookingOpen, setBookingOpen] = useState(false);
  const [showAllAmenities, setShowAllAmenities] = useState(false);

  /* ── Navigate to messages with property context ────────── */
  const handleMessage = useCallback(({ roomName } = {}) => {
    const p = getPropertyById(id);
    if (!p) return;
    const params = new URLSearchParams({
      listing:      p.id,
      provider:     p.providerId || 'provider_1',
      providerName: p.providerName || 'Provider',
      title:        p.title,
      type:         p.category || 'rental',
    });
    if (roomName) params.set('room', roomName);
    navigate(`/dashboard/messages?${params.toString()}`);
  }, [id, getPropertyById, navigate]);

  const property = getPropertyById(id);
  const similar  = filterProperties({ category: property?.category })
    .filter(p => String(p.id) !== String(id))
    .slice(0, 3);

  /* ── Not found ─────────────────────────────────────────── */
  if (!property) {
    return (
      <div className="max-w-2xl px-4 py-16 mx-auto text-center">
        <p className="mb-4 text-4xl">🏠</p>
        <h1 className="mb-2 text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">Property not found</h1>
        <Link to="/properties" className="btn-primary text-sm inline-flex items-center gap-1.5">
          <ArrowLeft size={14} /> Back to listings
        </Link>
      </div>
    );
  }

  const {
    title, price, pricePeriod = '', location, images = [],
    bedrooms, bathrooms, sqm, parking, description, verified,
    category, amenities = [], accommodationType,
  } = property;

  const wished      = isWishlisted(id);
  const isAccomm    = ['shortlet', 'shared', 'stay'].includes(accommodationType || category);
  const isShared    = accommodationType === 'shared' || category === 'shared';
  const backTo      = category === 'shortlet' ? '/shortlets'
                    : category === 'shared'   ? '/shared'
                    : '/properties';
  const backLabel   = category === 'shortlet' ? 'Shortlets'
                    : category === 'shared'   ? 'Shared'
                    : 'Properties';
  const AMENITY_LIMIT = 8;

  return (
    <div className="pb-28 lg:pb-8 dark:bg-gray-950">

      {/* ═══ 1. BACK NAV ═══════════════════════════════════════ */}
      <div className="px-4 pt-4 pb-2 mx-auto max-w-6xl">
        <Link
          to={backTo}
          className="inline-flex items-center gap-1.5 text-sm text-brand-charcoal dark:text-gray-400 hover:text-brand-charcoal-dark dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> {backLabel}
        </Link>
      </div>

      {/* ═══ 2. PHOTO GALLERY ══════════════════════════════════ */}
      <div className="relative">
        <ImageGallery images={images} videoUrl={property.youtubeUrl} title={title} />

        {/* Category chip */}
        {category && (
          <span className="absolute top-4 left-4 lg:left-8 z-10 tag bg-white/90 backdrop-blur-sm text-brand-charcoal-dark font-bold text-[11px] shadow-sm">
            {CATEGORY_LABELS[category] || category}
          </span>
        )}

        {/* Share + Save */}
        <div className="absolute z-10 flex gap-2 top-4 right-4 lg:right-8">
          <button
            type="button"
            onClick={() => navigator.share?.({ title, url: window.location.href })}
            className="flex items-center justify-center text-gray-600 transition-colors rounded-full shadow w-9 h-9 bg-white/90 backdrop-blur-sm hover:text-brand-charcoal"
            aria-label="Share"
          >
            <Share2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => toggleWishlist(property)}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow backdrop-blur-sm transition-all ${
              wished ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600'
            }`}
            aria-label={wished ? 'Unsave' : 'Save'}
            aria-pressed={wished}
          >
            <Heart size={15} fill={wished ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* ═══ MAIN CONTENT — 2-column on desktop ════════════════ */}
      <div className="px-4 mx-auto max-w-6xl">
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 pt-5">

          {/* ── LEFT COLUMN (content) ──────────────────────────── */}
          <div className="space-y-6">

            {/* ═══ 3. TITLE + PRICE + LOCATION ═════════════════ */}
            <div>
              <h1 className="flex items-start gap-2 text-2xl font-extrabold leading-tight font-display text-brand-charcoal-dark dark:text-white sm:text-3xl">
                {title}
                {verified && <BadgeCheck size={18} className="mt-1 text-brand-gold shrink-0" />}
              </h1>
              <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-2 font-body">
                <MapPin size={14} className="shrink-0 text-brand-gold" />
                {location}
              </p>
              {/* Price — shown on mobile only (desktop shows in BookingPanel) */}
              <p className="mt-3 text-3xl font-extrabold font-display text-brand-charcoal-dark dark:text-white lg:hidden">
                {formatWithUnit(price, pricePeriod)}
              </p>

              {/* Quick stats row */}
              <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                {property.views && (
                  <span className="flex items-center gap-1"><Eye size={12} /> {property.views.toLocaleString()} views</span>
                )}
                {property.postedAt && (
                  <span className="flex items-center gap-1"><Clock size={12} /> Listed {formatDate(property.postedAt)}</span>
                )}
              </div>
            </div>

            {/* ═══ 4. STATS GRID ═══════════════════════════════ */}
            {(bedrooms != null || bathrooms != null || sqm || parking != null) && (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: Bed,       label: 'Beds',    value: bedrooms },
                  { icon: Bath,      label: 'Baths',   value: bathrooms },
                  { icon: Maximize2, label: 'Size',    value: sqm ? `${sqm}m²` : null },
                  { icon: Car,       label: 'Parking', value: parking != null ? parking : null },
                ].filter(s => s.value != null).map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex flex-col items-center gap-1.5 p-3 bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
                    <Icon size={18} className="text-brand-gold" />
                    <span className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{value}</span>
                    <span className="text-[10px] text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ 5. DESCRIPTION ══════════════════════════════ */}
            {description && (
              <div>
                <h2 className="mb-2 font-bold font-display text-brand-charcoal-dark dark:text-white">
                  {isAccomm ? 'About this space' : 'About this property'}
                </h2>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 font-body">{description}</p>
              </div>
            )}

            {/* ═══ 6. AMENITIES ════════════════════════════════ */}
            {amenities.length > 0 && (
              <div>
                <h2 className="mb-3 font-bold font-display text-brand-charcoal-dark dark:text-white">
                  {isAccomm ? 'What this place offers' : 'Amenities'}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(showAllAmenities ? amenities : amenities.slice(0, AMENITY_LIMIT)).map((a) => (
                    <span key={a} className="text-xs tag bg-brand-gray-soft dark:bg-white/10 text-brand-charcoal dark:text-white/80">{a}</span>
                  ))}
                </div>
                {amenities.length > AMENITY_LIMIT && (
                  <button
                    type="button"
                    onClick={() => setShowAllAmenities(v => !v)}
                    className="mt-2 text-xs font-bold text-brand-gold hover:text-brand-gold-dark transition-colors"
                  >
                    {showAllAmenities ? 'Show less' : `Show all ${amenities.length} amenities`}
                  </button>
                )}
              </div>
            )}

            {/* ═══ 7. HOUSE RULES ═════════════════════════════ */}
            {isAccomm && property.houseRules && (
              <HouseRules rules={property.houseRules} />
            )}

            {/* ═══ 8. NIGERIAN DECLARATIONS ═══════════════════ */}
            {isAccomm && property.declarations && (
              <NigerianDeclarations declarations={property.declarations} />
            )}

            {/* ═══ 9. HOUSEMATE PROFILES (shared only) ════════ */}
            {isShared && property.housemates?.length > 0 && (
              <HousemateProfiles
                housemates={property.housemates}
                communityGuidelines={property.communityGuidelines}
              />
            )}

            {/* ═══ 10. UTILITY INFO (shared only) ═════════════ */}
            {isShared && property.utilityInfo && (
              <UtilityInfo utilityInfo={property.utilityInfo} />
            )}

            {/* ═══ 11. REVIEWS ════════════════════════════════ */}
            {(property.reviews?.length > 0 || property.providerRating) && (
              <ReviewSection
                reviews={property.reviews}
                rating={property.providerRating}
                reviewCount={property.providerReviews}
              />
            )}

            {/* ═══ 12. PROVIDER INFO ══════════════════════════ */}
            <div>
              <h2 className="mb-3 font-bold font-display text-brand-charcoal-dark dark:text-white">
                {isAccomm ? 'Your Host' : 'Listed by'}
              </h2>
              <ProviderInfoCard property={property} onMessage={handleMessage} />
            </div>

            {/* ═══ 13. SIMILAR PROPERTIES ═════════════════════ */}
            {similar.length > 0 && (
              <div>
                <h2 className="mb-3 font-bold font-display text-brand-charcoal-dark dark:text-white">
                  Similar {CATEGORY_LABELS[category] || 'Properties'}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {similar.map(p => <PropertyCard key={p.id} property={p} compact />)}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN (booking panel — desktop only) ──── */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <BookingPanel
                property={property}
                onBookInspection={() => setBookingOpen(true)}
                onRequestBooking={(data) => setBookingOpen(true)}
                onMessage={handleMessage}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ STICKY CTA — Mobile only ══════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex gap-3 px-4 py-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-white/10 pb-safe shadow-nav lg:hidden">
        <div className="flex-1 min-w-0">
          <p className="text-lg font-extrabold truncate font-display text-brand-charcoal-dark dark:text-white">
            {formatWithUnit(price, pricePeriod)}
          </p>
          {accommodationType === 'shortlet' && (
            <p className="text-[11px] text-gray-400">per night</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => handleMessage()}
          className="flex items-center gap-1.5 px-4 py-3 text-sm font-bold transition-colors border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white hover:border-brand-gold"
        >
          <MessageSquare size={14} />
        </button>
        <button
          type="button"
          onClick={() => setBookingOpen(true)}
          className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white transition-colors rounded-xl bg-brand-gold hover:bg-brand-gold-dark"
        >
          <Calendar size={14} />
          {accommodationType === 'shortlet' ? 'Reserve' :
           accommodationType === 'shared'   ? 'Inquire' :
           accommodationType === 'stay'     ? 'Apply' : 'Book Inspection'}
        </button>
      </div>

      {/* ═══ BOOKING MODAL ═════════════════════════════════════ */}
      <Modal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} size="lg" title="">
        <InspectionBooking
          listing={{
            id: property.id,
            title,
            address: location,
            type: category,
            inspectionFee: property.inspectionFee || 0,
            provider: {
              name: property.providerName || 'Agent',
              cancellationNotice: 12,
            },
          }}
          onClose={() => setBookingOpen(false)}
          onBookingCreate={addBooking}
          bookingLabel={
            accommodationType === 'shortlet' ? 'Book Stay' :
            accommodationType === 'shared'   ? 'Book Viewing' :
            accommodationType === 'stay'     ? 'Book Inspection' : 'Book Inspection'
          }
        />
      </Modal>
    </div>
  );
}

/* ── Helper ────────────────────────────────────────────────── */
function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff < 1)  return 'today';
    if (diff < 7)  return `${diff}d ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    return d.toLocaleDateString('en-NG', { month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}
