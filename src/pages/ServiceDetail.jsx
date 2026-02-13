import { useState }          from 'react';
import { useParams, Link }   from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, Calendar, MessageSquare, BadgeCheck } from 'lucide-react';
import { useCurrency }       from '../hooks/useCurrency.js';
import { useBooking }        from '../context/BookingContext.jsx';
import Badge                 from '../components/ui/Badge.jsx';
import { services }          from '../data/services.js';
import InspectionBooking     from '../components/booking/InspectionBooking.jsx';
import Modal                 from '../components/ui/Modal.jsx';

export default function ServiceDetail() {
  const { id }             = useParams();
  const { formatWithUnit } = useCurrency();
  const [bookingOpen, setBookingOpen] = useState(false);
  const { addBooking }     = useBooking();

  const service = services.find((s) => String(s.id) === String(id));
  if (!service) {
    return (
      <div className="max-w-2xl px-4 py-16 mx-auto text-center">
        <p className="mb-4 text-4xl">🔧</p>
        <h1 className="mb-2 text-xl font-bold font-display text-brand-charcoal-dark">Service not found</h1>
        <Link to="/services" className="btn-primary text-sm inline-flex items-center gap-1.5">
          <ArrowLeft size={14} /> Back to services
        </Link>
      </div>
    );
  }

  const {
    name, category, provider, avatar, rating, reviews = 0,
    price, priceUnit = 'job', location, verified, tier,
    description, image, responseTime,
  } = service;

  const tierVariant = tier === 3 ? 'tier3' : tier === 2 ? 'tier2' : 'tier1';

  return (
    <div className="max-w-2xl pb-24 mx-auto lg:pb-8">
      <div className="px-4 pt-4 pb-2">
        <Link to="/services" className="inline-flex items-center gap-1.5 text-sm text-brand-charcoal hover:text-brand-charcoal-dark">
          <ArrowLeft size={16} /> Services
        </Link>
      </div>

      {image && (
        <div className="overflow-hidden bg-gray-100 aspect-video">
          <img src={image} alt={name} className="object-cover w-full h-full" />
        </div>
      )}

      <div className="px-4 py-5 space-y-5">
        {/* Provider */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center overflow-hidden w-14 h-14 rounded-2xl bg-brand-gold/20 shrink-0">
            {avatar ? <img src={avatar} alt={provider} className="object-cover w-full h-full" />
              : <span className="text-xl font-bold text-brand-gold-dark">{provider?.charAt(0)}</span>
            }
            {verified && <BadgeCheck size={16} className="absolute -bottom-0.5 -right-0.5 text-brand-gold bg-white rounded-full" />}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold font-display text-brand-charcoal-dark">{name}</h1>
            <p className="text-sm text-gray-500 font-body">{provider} · {category}</p>
          </div>
          {tier && <Badge variant={tierVariant} />}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {rating && (
            <div className="p-3 text-center bg-brand-gray-soft rounded-2xl">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Star size={13} fill="currentColor" className="text-brand-gold" />
                <span className="text-sm font-bold text-brand-charcoal-dark">{rating}</span>
              </div>
              <p className="text-[10px] text-gray-400">{reviews} reviews</p>
            </div>
          )}
          {location && (
            <div className="p-3 text-center bg-brand-gray-soft rounded-2xl">
              <MapPin size={15} className="text-brand-gold mx-auto mb-0.5" />
              <p className="text-[10px] text-gray-500 truncate">{location}</p>
            </div>
          )}
          {responseTime && (
            <div className="p-3 text-center bg-brand-gray-soft rounded-2xl">
              <Clock size={15} className="text-brand-gold mx-auto mb-0.5" />
              <p className="text-[10px] text-gray-500">{responseTime}</p>
            </div>
          )}
        </div>

        <div>
          <p className="font-display font-bold text-brand-charcoal-dark mb-0.5">Starting from</p>
          <p className="text-2xl font-extrabold font-display text-brand-charcoal-dark">
            {formatWithUnit(price, priceUnit)}
          </p>
        </div>

        {description && (
          <div>
            <h2 className="mb-2 font-bold font-display text-brand-charcoal-dark">About</h2>
            <p className="text-sm leading-relaxed text-gray-600 font-body">{description}</p>
          </div>
        )}

        {/* CTA */}
        <div className="fixed bottom-0 left-0 right-0 flex gap-3 px-4 py-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-white/10 lg:relative lg:bottom-auto lg:border lg:rounded-2xl pb-safe shadow-nav lg:shadow-card">
          <button className="flex items-center justify-center flex-1 gap-2 text-sm btn-outline">
            <MessageSquare size={15} /> Message
          </button>
          <button onClick={() => setBookingOpen(true)}
            className="flex items-center justify-center flex-1 gap-2 text-sm btn-primary">
            <Calendar size={15} /> Book Appointment
          </button>
        </div>

        {/* Booking modal */}
        <Modal open={bookingOpen} onClose={() => setBookingOpen(false)} size="lg" title="">
          <InspectionBooking
            listing={{
              id: service.id,
              title: name,
              address: location || 'Lagos, Nigeria',
              type: category,
              inspectionFee: service.inspectionFee || 0,
              provider: { name: provider, cancellationNotice: 12 },
            }}
            onClose={() => setBookingOpen(false)}
            onBookingCreate={addBooking}
            bookingLabel="Book Appointment"
          />
        </Modal>
      </div>
    </div>
  );
}