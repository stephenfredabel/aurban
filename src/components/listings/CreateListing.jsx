import { useState }             from 'react';
import { useNavigate }          from 'react-router-dom';
import { useAuth }              from '../../context/AuthContext.jsx';
import AurbanLogo               from '../../components/AurbanLogo.jsx';
import PropertyListingForm      from './PropertyListingForm.jsx';
import ServiceListingForm       from './ServiceListingForm.jsx';
import MarketplaceListingForm   from './MarketplaceListingForm.jsx';
import RoommateListingForm      from './RoommateListingForm.jsx';

const TOP_CATEGORIES = [
  {
    id:    'property',
    label: 'Property',
    icon:  '🏠',
    desc:  'Rent · Lease · Sale · Land · Shortlet · Shared',
    who:   'Property owners, landlords, agents',
    color: 'from-amber-50 to-amber-100/50 dark:from-brand-gold/10 dark:to-brand-gold/5',
    border:'border-amber-200 dark:border-brand-gold/30',
  },
  {
    id:    'service',
    label: 'Service',
    icon:  '🔧',
    desc:  'Plumbing · Electrical · Construction · Interior Design + more',
    who:   'Tradespeople, professionals, contractors',
    color: 'from-blue-50 to-blue-100/50 dark:from-blue-500/10 dark:to-blue-500/5',
    border:'border-blue-200 dark:border-blue-500/20',
  },
  {
    id:    'marketplace',
    label: 'Marketplace',
    icon:  '🛒',
    desc:  'Building materials · Fittings · Furniture · Solar',
    who:   'Suppliers, manufacturers, retailers',
    color: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5',
    border:'border-emerald-200 dark:border-emerald-500/20',
  },
  {
    id:    'roommate',
    label: 'Roommate',
    icon:  '🤝',
    desc:  'Looking for someone to share your space',
    who:   'Registered users (ID verification required)',
    color: 'from-purple-50 to-purple-100/50 dark:from-purple-500/10 dark:to-purple-500/5',
    border:'border-purple-200 dark:border-purple-500/20',
    badge: 'ID Required',
  },
];

export default function CreateListing() {
  const { user }      = useAuth();
  const navigate      = useNavigate();
  const [type, setType]        = useState(null);    // 'property'|'service'|'marketplace'|'roommate'
  const [category, setCategory]= useState(null);    // property sub-category

  // ── Route to correct form ──────────────────────────────────
  if (type === 'property' && category) {
    return <PropertyListingForm category={category} onBack={() => setCategory(null)} />;
  }
  if (type === 'property' && !category) {
    return <PropertyCategoryPicker onBack={() => setType(null)} onSelect={setCategory} />;
  }
  if (type === 'service') {
    return <ServiceListingForm onBack={() => setType(null)} />;
  }
  if (type === 'marketplace') {
    return <MarketplaceListingForm onBack={() => setType(null)} />;
  }
  if (type === 'roommate') {
    return <RoommateListingForm onBack={() => setType(null)} />;
  }

  // ── Main selection screen ──────────────────────────────────
  return (
    <div className="max-w-3xl px-4 py-8 pb-24 mx-auto lg:pb-10">
      <div className="flex items-center gap-4 mb-8">
        <button type="button" onClick={() => navigate(-1)}
          className="flex items-center justify-center text-lg transition-colors border border-gray-200 w-9 h-9 rounded-xl dark:border-white/20 text-brand-charcoal dark:text-white hover:border-brand-gold">
          ←
        </button>
        <div>
          <h1 className="text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">Post a Listing</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">What would you like to list on Aurban?</p>
        </div>
      </div>

      {/* Transparency notice */}
      <div className="p-4 mb-8 border bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border-emerald-100 dark:border-emerald-500/20">
        <p className="mb-1 text-sm font-bold text-emerald-800 dark:text-emerald-300">✅ Transparent pricing — no hidden fees</p>
        <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-400">
          The price you set is the only amount buyers or clients pay. Aurban's 8% is deducted from your payment — not added on top. No agency, caution, or legal fees allowed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TOP_CATEGORIES.map(({ id, label, icon, desc, who, color, border, badge }) => (
          <button key={id} type="button" onClick={() => setType(id)}
            className={`group text-left p-5 rounded-3xl border-2 bg-gradient-to-br ${color} ${border}
              hover:shadow-md hover:scale-[1.01] transition-all active:scale-[0.99]`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-4xl">{icon}</span>
              {badge && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-white/80 dark:bg-brand-charcoal-dark/80 rounded-full text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  🔒 {badge}
                </span>
              )}
            </div>
            <p className="mb-1 text-lg font-extrabold transition-colors font-display text-brand-charcoal-dark dark:text-white group-hover:text-brand-gold">
              {label}
            </p>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{desc}</p>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-white/40">{who}</p>
          </button>
        ))}
      </div>

      {/* Agreement reminder */}
      <div className="p-4 mt-8 bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
        <p className="text-xs leading-relaxed text-center text-gray-500 dark:text-gray-400">
          By posting a listing you agree to our{' '}
          <a href="/legal/provider-agreement" className="font-semibold text-brand-gold hover:text-brand-gold-dark" target="_blank" rel="noopener noreferrer">Provider Agreement</a>.
          Listings that violate our policies will be removed immediately.
        </p>
      </div>
    </div>
  );
}

// ── Property sub-category picker ──────────────────────────────
import { LISTING_CATEGORIES } from '../../data/listingOptions.js';

function PropertyCategoryPicker({ onBack, onSelect }) {
  return (
    <div className="max-w-3xl px-4 py-8 pb-24 mx-auto lg:pb-10">
      <div className="flex items-center gap-4 mb-8">
        <button type="button" onClick={onBack}
          className="flex items-center justify-center text-lg transition-colors border border-gray-200 w-9 h-9 rounded-xl dark:border-white/20 text-brand-charcoal dark:text-white hover:border-brand-gold">
          ←
        </button>
        <div>
          <h1 className="text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">Property Listing Type</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">How are you listing this property?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LISTING_CATEGORIES.map(({ value, label, icon, desc }) => (
          <button key={value} type="button" onClick={() => onSelect(value)}
            className="p-5 text-left transition-all bg-white border-2 border-gray-100 group dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10 hover:border-brand-gold dark:hover:border-brand-gold hover:shadow-md">
            <div className="flex items-start gap-4">
              <span className="text-3xl shrink-0">{icon}</span>
              <div>
                <p className="text-base font-extrabold transition-colors font-display text-brand-charcoal-dark dark:text-white group-hover:text-brand-gold">{label}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}