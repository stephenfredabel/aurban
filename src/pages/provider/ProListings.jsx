import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle, Star, MapPin, Eye, ToggleLeft, ToggleRight,
  Trash2, Edit2, Search, Wrench,
} from 'lucide-react';
import { useProListing } from '../../context/ProListingContext.jsx';
import { useCurrency } from '../../hooks/useCurrency.js';
import { PRO_SERVICE_CATEGORY_MAP } from '../../data/proServiceCategoryFields.js';
import ProTierBadge from '../../components/pro/ProTierBadge.jsx';

/* ════════════════════════════════════════════════════════════
   PROVIDER PRO LISTINGS
   Route: /provider/pro-listings
════════════════════════════════════════════════════════════ */

export default function ProviderProListings() {
  const { listings, toggleListing, removeListing } = useProListing();
  const { symbol } = useCurrency();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // For demo, show all listings as "provider's own"
  const myListings = useMemo(() => {
    let list = listings;
    if (filter === 'active') list = list.filter(l => l.active !== false);
    if (filter === 'paused') list = list.filter(l => l.active === false);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(l => l.title?.toLowerCase().includes(q) || l.category?.toLowerCase().includes(q));
    }
    return list;
  }, [listings, search, filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="section-title">Pro Listings</h1>
        <Link
          to="/provider/pro-listings/new"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white rounded-xl bg-brand-gold hover:bg-brand-gold-dark"
        >
          <PlusCircle size={14} /> New Listing
        </Link>
      </div>
      <p className="mb-5 text-sm text-gray-400">Manage your Pro service listings</p>

      {/* Filter + search */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-lg">
          {['all', 'active', 'paused'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md capitalize ${
                filter === f ? 'bg-white dark:bg-gray-900 text-brand-charcoal-dark dark:text-white shadow-sm' : 'text-gray-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute text-gray-300 left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search listings..."
            className="w-full py-2 pl-9 pr-3 text-xs border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 outline-none"
          />
        </div>
      </div>

      {myListings.length === 0 ? (
        <div className="py-12 text-center">
          <Wrench size={40} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
          <p className="mb-1 text-sm font-bold text-brand-charcoal-dark dark:text-white">No listings yet</p>
          <p className="mb-4 text-xs text-gray-400">Create your first Pro service listing</p>
          <Link to="/provider/pro-listings/new" className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl bg-brand-gold">
            <PlusCircle size={14} /> Create Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {myListings.map(listing => {
            const catDef = PRO_SERVICE_CATEGORY_MAP[listing.category];
            return (
              <div key={listing.id} className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-12 h-12 text-lg rounded-2xl shrink-0 bg-brand-gold/10">
                    {catDef?.icon || '🔧'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-brand-charcoal-dark dark:text-white truncate">{listing.title}</h3>
                      <ProTierBadge tier={listing.tier} size="sm" />
                    </div>
                    <p className="text-xs text-gray-400">{catDef?.label}</p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span className="font-bold text-brand-gold">
                        {listing.pricingMode === 'quote' ? 'Quote' : `${symbol}${listing.price?.toLocaleString()}`}
                      </span>
                      {listing.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star size={10} className="text-brand-gold fill-brand-gold" /> {listing.rating}
                        </span>
                      )}
                      {listing.state && (
                        <span className="flex items-center gap-1">
                          <MapPin size={10} /> {listing.state}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleListing(listing.id)}
                      className="p-2 text-gray-400 hover:text-brand-gold rounded-lg"
                      title={listing.active === false ? 'Activate' : 'Pause'}
                    >
                      {listing.active === false ? <ToggleLeft size={16} /> : <ToggleRight size={16} className="text-emerald-500" />}
                    </button>
                    <button className="p-2 text-gray-400 hover:text-brand-gold rounded-lg" title="Edit">
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(listing.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Delete confirmation */}
                {deleteConfirm === listing.id && (
                  <div className="flex items-center justify-between p-3 mt-3 bg-red-50 dark:bg-red-500/10 rounded-xl">
                    <p className="text-xs text-red-600">Delete this listing?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1 text-xs font-bold border border-gray-200 rounded-lg">Cancel</button>
                      <button onClick={() => { removeListing(listing.id); setDeleteConfirm(null); }} className="px-3 py-1 text-xs font-bold text-white bg-red-600 rounded-lg">Delete</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
