import { useState }          from 'react';
import { useParams, Link }   from 'react-router-dom';
import {
  ArrowLeft, Star, MapPin, Clock, Truck, Shield,
  BadgeCheck, MessageSquare, Calendar, Navigation,
  Package, Award, CheckCircle2,
} from 'lucide-react';
import { useCurrency }                from '../hooks/useCurrency.js';
import { useProperty }                from '../context/PropertyContext.jsx';
import Badge                          from '../components/ui/Badge.jsx';
import Modal                          from '../components/ui/Modal.jsx';
import QuoteRequestModal              from '../components/relocation/QuoteRequestModal.jsx';
import RelocationProviderCard         from '../components/relocation/RelocationProviderCard.jsx';

// ─────────────────────────────────────────────────────────────
// SERVICE TYPE DESCRIPTIONS
// ─────────────────────────────────────────────────────────────

const SERVICE_TYPE_INFO = {
  local:         { label: 'Local Moving',          desc: 'Moves within the same city or state' },
  interstate:    { label: 'Interstate Moving',     desc: 'Moves between different Nigerian states' },
  international: { label: 'International Moving',  desc: 'Relocations to or from other countries' },
  office:        { label: 'Office/Commercial',     desc: 'Business and office relocations with minimal downtime' },
  packing:       { label: 'Packing Service',       desc: 'Professional packing and unpacking of all items' },
  storage:       { label: 'Storage Solutions',      desc: 'Secure short and long-term storage facilities' },
  vehicle:       { label: 'Vehicle Transport',      desc: 'Safe transport of cars, bikes, and other vehicles' },
};

// ─────────────────────────────────────────────────────────────
// MOCK REVIEWS
// ─────────────────────────────────────────────────────────────

const MOCK_REVIEWS = [
  { id: 'rv1', name: 'Adaeze Okafor', date: '2026-01-15', rating: 5, comment: 'Excellent service! The team was professional, on time, and handled all our belongings with great care. Nothing was damaged during the move.' },
  { id: 'rv2', name: 'Ibrahim Musa',  date: '2025-12-28', rating: 4, comment: 'Good overall experience. They were a bit late arriving but made up for it with efficient work. Would recommend for local moves.' },
  { id: 'rv3', name: 'Chioma Nwosu',  date: '2025-11-10', rating: 5, comment: 'Best moving company I\'ve used in Lagos. Fair pricing, friendly crew, and they even helped arrange furniture at the new apartment. 10/10.' },
];

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function RelocationProviderDetail() {
  const { id }                 = useParams();
  const { symbol }             = useCurrency();
  const { getRelocationProviderById, filterRelocationProviders } = useProperty();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const provider = getRelocationProviderById(id);

  // Similar providers (same first service type, exclude current)
  const similar = provider
    ? filterRelocationProviders({ serviceType: provider.serviceTypes?.[0] })
        .filter(p => String(p.id) !== String(id))
        .slice(0, 3)
    : [];

  if (!provider) {
    return (
      <div className="max-w-2xl px-4 py-16 mx-auto text-center">
        <p className="mb-4 text-4xl">🚚</p>
        <h1 className="mb-2 text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">Provider not found</h1>
        <Link to="/relocation" className="btn-primary text-sm inline-flex items-center gap-1.5">
          <ArrowLeft size={14} /> Back to relocation
        </Link>
      </div>
    );
  }

  const {
    name, avatar, coverImage, portfolioImages = [],
    verified, tier, rating, reviews = 0, completedMoves,
    yearsActive, responseTime, serviceTypes = [],
    serviceAreas = [], priceRange = {}, description, bio,
    highlights = [], insurance, gpsTracking, location,
  } = provider;

  const tierVariant = tier === 3 ? 'tier3' : tier === 2 ? 'tier2' : 'tier1';
  const allImages = [coverImage, ...portfolioImages].filter(Boolean);
  const memberSince = provider.postedAt ? new Date(provider.postedAt).getFullYear() : 2025;

  return (
    <div className="max-w-4xl pb-24 mx-auto lg:pb-8">
      {/* Back nav */}
      <div className="px-4 pt-4 pb-2">
        <Link to="/relocation" className="inline-flex items-center gap-1.5 text-sm text-brand-charcoal dark:text-white/70 hover:text-brand-charcoal-dark dark:hover:text-white transition-colors">
          <ArrowLeft size={16} /> Relocation
        </Link>
      </div>

      {/* Portfolio gallery / Hero */}
      <div className="relative">
        <div className="overflow-hidden bg-gray-100 dark:bg-white/5 aspect-video">
          {allImages[activeImg] ? (
            <img src={allImages[activeImg]} alt={name} className="object-cover w-full h-full" />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-brand-gold/20 to-brand-gold/5">
              <Truck size={64} className="text-brand-gold/30" />
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 px-4">
            {allImages.map((_, i) => (
              <button key={i} type="button" onClick={() => setActiveImg(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === activeImg ? 'bg-white w-5' : 'bg-white/60'}`}
                aria-label={`Image ${i + 1}`} />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-5 space-y-6">

        {/* Provider header */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center overflow-hidden w-16 h-16 rounded-2xl bg-brand-gold/20 shrink-0">
            {avatar ? (
              <img src={avatar} alt={name} className="object-cover w-full h-full" />
            ) : (
              <span className="text-2xl font-bold text-brand-gold-dark">{name?.charAt(0)}</span>
            )}
            {verified && (
              <BadgeCheck size={18} className="absolute -bottom-0.5 -right-0.5 text-brand-gold bg-white dark:bg-gray-900 rounded-full" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">{name}</h1>
            <p className="text-sm text-gray-500 dark:text-white/60 font-body">Member since {memberSince}</p>
          </div>
          {tier && <Badge variant={tierVariant} size="lg" />}
        </div>

        {/* Location */}
        {location && (
          <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/60">
            <MapPin size={14} className="shrink-0 text-brand-gold" />
            {location}
          </p>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Truck,  value: completedMoves ? `${completedMoves}` : null, label: 'Completed Moves' },
            { icon: Star,   value: rating ? `${rating}` : null, label: `${reviews} reviews` },
            { icon: Clock,  value: responseTime, label: 'Response Time' },
          ].filter(s => s.value).map(({ icon: Icon, value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 p-3 bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
              <Icon size={18} className="text-brand-gold" />
              <span className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{value}</span>
              <span className="text-[10px] text-gray-400">{label}</span>
            </div>
          ))}
        </div>

        {/* Price ranges */}
        {Object.keys(priceRange).length > 0 && (
          <div>
            <h2 className="mb-3 font-bold font-display text-brand-charcoal-dark dark:text-white">Price Ranges</h2>
            <div className="space-y-2">
              {Object.entries(priceRange).map(([type, range]) => (
                <div key={type} className="flex items-center justify-between p-3 border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Truck size={14} className="text-brand-gold" />
                    <span className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                      {SERVICE_TYPE_INFO[type]?.label || type}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
                    {symbol}{range.min.toLocaleString()} — {symbol}{range.max.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-gray-400">
              Prices are estimates. Request a quote for an accurate price based on your specific needs.
            </p>
          </div>
        )}

        {/* Services offered */}
        {serviceTypes.length > 0 && (
          <div>
            <h2 className="mb-3 font-bold font-display text-brand-charcoal-dark dark:text-white">Services Offered</h2>
            <div className="space-y-2">
              {serviceTypes.map(st => {
                const info = SERVICE_TYPE_INFO[st];
                return (
                  <div key={st} className="flex items-start gap-3 p-3 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
                    <CheckCircle2 size={14} className="text-brand-gold mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
                        {info?.label || st}
                      </p>
                      {info?.desc && (
                        <p className="text-xs text-gray-400">{info.desc}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Service areas */}
        {serviceAreas.length > 0 && (
          <div>
            <h2 className="mb-3 font-bold font-display text-brand-charcoal-dark dark:text-white">Service Areas</h2>
            <div className="flex flex-wrap gap-2">
              {serviceAreas.map(area => (
                <span key={area} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-brand-gray-soft dark:bg-white/5 text-brand-charcoal dark:text-white/80 rounded-xl border border-gray-100 dark:border-white/10">
                  <Navigation size={10} className="text-brand-gold" />
                  {area}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Highlights / Trust signals */}
        {(highlights.length > 0 || insurance || gpsTracking) && (
          <div>
            <h2 className="mb-3 font-bold font-display text-brand-charcoal-dark dark:text-white">Trust & Highlights</h2>
            <div className="flex flex-wrap gap-2">
              {insurance && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                  <Shield size={12} /> Insured
                </span>
              )}
              {gpsTracking && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-500/20">
                  <MapPin size={12} /> GPS Tracking
                </span>
              )}
              {verified && (
                <span className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-brand-gold/10 text-brand-gold-dark dark:text-brand-gold rounded-xl border border-brand-gold/20">
                  <BadgeCheck size={12} /> Verified
                </span>
              )}
              {highlights.filter(h => !['Insured', 'GPS Tracking'].includes(h)).map(h => (
                <span key={h} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-brand-gray-soft dark:bg-white/5 text-brand-charcoal dark:text-white/80 rounded-xl border border-gray-100 dark:border-white/10">
                  <Award size={12} className="text-brand-gold" /> {h}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* About / Description */}
        {(bio || description) && (
          <div>
            <h2 className="mb-2 font-bold font-display text-brand-charcoal-dark dark:text-white">About</h2>
            <p className="text-sm leading-relaxed text-gray-600 dark:text-white/60 font-body">{bio || description}</p>
          </div>
        )}

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold font-display text-brand-charcoal-dark dark:text-white">Reviews</h2>
            {rating && (
              <div className="flex items-center gap-1.5">
                <Star size={14} fill="currentColor" className="text-brand-gold" />
                <span className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{rating}</span>
                <span className="text-xs text-gray-400">({reviews} reviews)</span>
              </div>
            )}
          </div>
          <div className="space-y-3">
            {MOCK_REVIEWS.map(review => (
              <div key={review.id} className="p-4 border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-gold/20">
                      <span className="text-xs font-bold text-brand-gold-dark">{review.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-brand-charcoal-dark dark:text-white">{review.name}</p>
                      <p className="text-[10px] text-gray-400">{new Date(review.date).toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={11}
                        className={s <= review.rating ? 'text-brand-gold' : 'text-gray-200 dark:text-white/20'}
                        fill={s <= review.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-gray-600 dark:text-white/60">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Similar providers */}
        {similar.length > 0 && (
          <div>
            <h2 className="mb-3 font-bold font-display text-brand-charcoal-dark dark:text-white">Similar Providers</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {similar.map(p => <RelocationProviderCard key={p.id} provider={p} compact />)}
            </div>
          </div>
        )}

        {/* Sticky CTA footer */}
        <div className="fixed bottom-0 left-0 right-0 flex gap-3 px-4 py-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-white/10 lg:relative lg:bottom-auto lg:border lg:rounded-2xl pb-safe shadow-nav lg:shadow-card">
          <button className="flex items-center justify-center flex-1 gap-2 text-sm btn-outline">
            <MessageSquare size={15} /> Message
          </button>
          <button onClick={() => setQuoteOpen(true)}
            className="flex items-center justify-center flex-1 gap-2 text-sm btn-primary">
            <Calendar size={15} /> Request Quote
          </button>
        </div>

        {/* Quote modal */}
        <Modal open={quoteOpen} onClose={() => setQuoteOpen(false)} size="lg" title="">
          <QuoteRequestModal
            provider={provider}
            onClose={() => setQuoteOpen(false)}
          />
        </Modal>
      </div>
    </div>
  );
}
