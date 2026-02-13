import { useState }          from 'react';
import { useParams, Link }   from 'react-router-dom';
import { useTranslation }    from 'react-i18next';
import {
  ArrowLeft, Heart, Share2, MapPin, Bed, Bath,
  Maximize2, BadgeCheck, Calendar, MessageSquare
} from 'lucide-react';
import { useProperty }       from '../context/PropertyContext.jsx';
import { useBooking }        from '../context/BookingContext.jsx';
import { useCurrency }       from '../hooks/useCurrency.js';
import { properties }        from '../data/properties.js';
import PropertyCard          from '../components/PropertyCard.jsx';
import InspectionBooking     from '../components/booking/InspectionBooking.jsx';
import Modal                 from '../components/ui/Modal.jsx';

export default function PropertyDetail() {
  const { id }                            = useParams();
  const { t }                             = useTranslation();
  const { toggleWishlist, isWishlisted }  = useProperty();
  const { formatWithUnit }                = useCurrency();
  const [activeImg, setActiveImg]         = useState(0);
  const [bookingOpen, setBookingOpen]     = useState(false);
  const { addBooking }                    = useBooking();

  const property = properties.find((p) => String(p.id) === String(id));
  const similar  = properties.filter((p) => p.id !== id && p.category === property?.category).slice(0, 3);

  if (!property) {
    return (
      <div className="max-w-2xl px-4 py-16 mx-auto text-center">
        <p className="mb-4 text-4xl">🏠</p>
        <h1 className="mb-2 text-xl font-bold font-display text-brand-charcoal-dark">Property not found</h1>
        <Link to="/properties" className="btn-primary text-sm inline-flex items-center gap-1.5">
          <ArrowLeft size={14} /> Back to listings
        </Link>
      </div>
    );
  }

  const {
    title, price, priceUnit = 'year', location, images = [],
    bedrooms, bathrooms, area, description, verified,
    category, type, amenities = [],
  } = property;

  const wished = isWishlisted(id);

  return (
    <div className="max-w-4xl pb-24 mx-auto lg:pb-8">
      {/* Back nav */}
      <div className="px-4 pt-4 pb-2">
        <Link to="/properties" className="inline-flex items-center gap-1.5 text-sm text-brand-charcoal hover:text-brand-charcoal-dark transition-colors">
          <ArrowLeft size={16} /> Properties
        </Link>
      </div>

      {/* Image gallery */}
      <div className="relative">
        <div className="overflow-hidden bg-gray-100 aspect-video">
          {images[activeImg] ? (
            <img
              src={images[activeImg]}
              alt={title}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5">
              <span className="text-6xl font-black font-display text-brand-gold/30">A</span>
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 px-4">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveImg(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === activeImg ? 'bg-white w-5' : 'bg-white/60'}`}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Top actions */}
        <div className="absolute flex gap-2 top-4 right-4">
          <button
            type="button"
            onClick={() => navigator.share?.({ title, url: window.location.href })}
            className="flex items-center justify-center text-gray-600 transition-colors rounded-full shadow w-9 h-9 bg-white/90 hover:text-brand-charcoal"
            aria-label="Share"
          >
            <Share2 size={15} />
          </button>
          <button
            type="button"
            onClick={() => toggleWishlist(id)}
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow transition-all ${wished ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-600'}`}
            aria-label={wished ? 'Unsave' : 'Save'}
            aria-pressed={wished}
          >
            <Heart size={15} fill={wished ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Title + price */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="flex-1 text-2xl font-extrabold leading-tight font-display text-brand-charcoal-dark">
              {title}
              {verified && <BadgeCheck size={18} className="inline ml-2 text-brand-gold" />}
            </h1>
          </div>
          <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-2 font-body">
            <MapPin size={14} className="shrink-0 text-brand-gold" />
            {location}
          </p>
          <p className="mt-3 text-3xl font-extrabold font-display text-brand-charcoal-dark">
            {formatWithUnit(price, priceUnit)}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Bed,       value: bedrooms  != null ? `${bedrooms} beds`   : null },
            { icon: Bath,      value: bathrooms != null ? `${bathrooms} baths` : null },
            { icon: Maximize2, value: area      ? area                         : null },
          ].filter((s) => s.value).map(({ icon: Icon, value }) => (
            <div key={value} className="flex flex-col items-center gap-1.5 p-3 bg-brand-gray-soft rounded-2xl">
              <Icon size={18} className="text-brand-gold" />
              <span className="text-xs font-bold text-brand-charcoal-dark">{value}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        {description && (
          <div>
            <h2 className="mb-2 font-bold font-display text-brand-charcoal-dark">About this property</h2>
            <p className="text-sm leading-relaxed text-gray-600 font-body">{description}</p>
          </div>
        )}

        {/* Amenities */}
        {amenities.length > 0 && (
          <div>
            <h2 className="mb-3 font-bold font-display text-brand-charcoal-dark">Amenities</h2>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => (
                <span key={a} className="text-xs tag bg-brand-gray-soft text-brand-charcoal">{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Contact sticky footer */}
        <div className="fixed bottom-0 left-0 right-0 flex gap-3 px-4 py-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-white/10 lg:relative lg:bottom-auto lg:border lg:rounded-2xl pb-safe shadow-nav lg:shadow-card">
          <button className="flex items-center justify-center flex-1 gap-2 text-sm btn-outline">
            <MessageSquare size={15} /> Chat
          </button>
          <button onClick={() => setBookingOpen(true)}
            className="flex items-center justify-center flex-1 gap-2 text-sm btn-primary">
            <Calendar size={15} /> Book Inspection
          </button>
        </div>

        {/* Booking modal */}
        <Modal open={bookingOpen} onClose={() => setBookingOpen(false)} size="lg" title="">
          <InspectionBooking
            listing={{
              id: property.id,
              title,
              address: location,
              type: category,
              inspectionFee: property.inspectionFee || 0,
              provider: { name: 'Agent', cancellationNotice: 12 },
            }}
            onClose={() => setBookingOpen(false)}
            onBookingCreate={addBooking}
            bookingLabel="Book Inspection"
          />
        </Modal>

        {/* Similar properties */}
        {similar.length > 0 && (
          <div>
            <h2 className="mb-3 font-bold font-display text-brand-charcoal-dark">Similar Properties</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {similar.map((p) => <PropertyCard key={p.id} property={p} compact />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}