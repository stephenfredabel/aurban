import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  History as HistoryIcon, Clock, MapPin, Bed, Bath,
  Trash2, Search, Eye, ChevronRight, X, Filter,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { sanitize } from '../../utils/security.js';
import DashboardLayout from '../../Layout/DashboardLayout.jsx';
import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';

/* ════════════════════════════════════════════════════════════
   HISTORY — Recently viewed listings
   
   Tracks what the user has browsed. Stored in sessionStorage.
   In production: tracked server-side via view events.
   
   Features:
   • Grouped by date (Today, Yesterday, Earlier)
   • Filter by type
   • Search within history
   • Clear individual or all
   • Shows view count per item
════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'aurban_history';
const MAX_HISTORY = 50;

const MOCK_HISTORY = [
  { id: 'h1', type: 'property', title: '3 Bedroom Flat in Lekki Phase 1', location: 'Lekki, Lagos', price: 2500000, pricePeriod: '/yr', category: 'rental', bedrooms: 3, bathrooms: 2, image: null, viewedAt: new Date().toISOString(), viewCount: 3, providerName: 'Tunde Properties' },
  { id: 'h2', type: 'property', title: 'Luxury 4 Bed Duplex — Banana Island', location: 'Banana Island, Lagos', price: 420000000, pricePeriod: '', category: 'buy', bedrooms: 4, bathrooms: 5, image: null, viewedAt: new Date(Date.now() - 3600000).toISOString(), viewCount: 1, providerName: 'Elite Realtors' },
  { id: 'h3', type: 'service', title: 'Premium Interior Design', location: 'Lagos, Nigeria', price: 150000, pricePeriod: ' starting', category: 'interior', bedrooms: null, bathrooms: null, image: null, viewedAt: new Date(Date.now() - 7200000).toISOString(), viewCount: 2, providerName: 'Décor Masters NG' },
  { id: 'h4', type: 'property', title: 'Land for Sale — 500sqm Ibeju-Lekki', location: 'Ibeju-Lekki, Lagos', price: 15000000, pricePeriod: '', category: 'land', bedrooms: null, bathrooms: null, image: null, viewedAt: new Date(Date.now() - 86400000).toISOString(), viewCount: 5, providerName: 'Lagos Land Hub' },
  { id: 'h5', type: 'product', title: 'Dangote 42.5N Cement — 50kg', location: 'Nationwide Delivery', price: 5800, pricePeriod: ' /bag', category: 'cement', bedrooms: null, bathrooms: null, image: null, viewedAt: new Date(Date.now() - 86400000 * 1.5).toISOString(), viewCount: 1, providerName: 'BuildMart Nigeria' },
  { id: 'h6', type: 'property', title: 'Shared Apartment — Male Only, Yaba', location: 'Yaba, Lagos', price: 450000, pricePeriod: '/yr', category: 'shared', bedrooms: 1, bathrooms: 1, image: null, viewedAt: new Date(Date.now() - 86400000 * 2).toISOString(), viewCount: 1, providerName: 'Yaba Hostels' },
  { id: 'h7', type: 'service', title: 'Licensed Electrical Contractor', location: 'Abuja, Nigeria', price: 0, pricePeriod: '', category: 'electrician', bedrooms: null, bathrooms: null, image: null, viewedAt: new Date(Date.now() - 86400000 * 3).toISOString(), viewCount: 2, providerName: 'PowerFix Abuja' },
  { id: 'h8', type: 'property', title: 'Office Space — 200sqm Victoria Island', location: 'Victoria Island, Lagos', price: 8500000, pricePeriod: '/yr', category: 'commercial', bedrooms: null, bathrooms: null, image: null, viewedAt: new Date(Date.now() - 86400000 * 4).toISOString(), viewCount: 1, providerName: 'VI Commercial' },
];

const CATEGORY_EMOJI = {
  rental: '🏠', shortlet: '🏨', buy: '🏡', land: '🗺️', shared: '👥',
  lease: '📋', commercial: '🏢', interior: '🛋️', plumber: '🔧',
  electrician: '⚡', cement: '🧱', furniture: '🪑',
};

const TYPE_LABELS = {
  property: { label: 'Property', color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' },
  service:  { label: 'Service',  color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' },
  product:  { label: 'Product',  color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600' },
};

function formatMoney(n) {
  if (n >= 1000000) return '₦' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return '₦' + (n / 1000).toFixed(0) + 'K';
  if (n === 0) return 'Contact for price';
  return '₦' + n.toLocaleString();
}

function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

function getDateGroup(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (itemDate >= today) return 'Today';
  if (itemDate >= yesterday) return 'Yesterday';
  const diffDays = Math.floor((today - itemDate) / 86400000);
  if (diffDays <= 7) return 'This Week';
  return 'Earlier';
}

function getItemLink(item) {
  if (item.type === 'property') return `/property/${item.id}`;
  if (item.type === 'service') return `/service/${item.id}`;
  if (item.type === 'product') return `/product/${item.id}`;
  return '#';
}

function loadHistory() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return MOCK_HISTORY;
}

function saveHistory(items) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch {}
}

export default function History() {
  const { user } = useAuth();
  const [items, setItems]   = useState(() => loadHistory());
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => { saveHistory(items); }, [items]);

  /* ── Fetch server-side history when Supabase is available ── */
  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured()) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('browsing_history')
          .select('*')
          .eq('user_id', user.id)
          .order('viewed_at', { ascending: false })
          .limit(MAX_HISTORY);
        if (!error && data?.length) {
          setItems(data.map(h => ({
            id: h.id,
            type: h.item_type || 'property',
            title: h.item_title || '',
            location: h.location || '',
            price: h.price || 0,
            pricePeriod: h.price_period || '',
            category: h.category || 'rental',
            bedrooms: h.bedrooms || null,
            bathrooms: h.bathrooms || null,
            image: h.image || null,
            viewedAt: h.viewed_at,
            viewCount: h.view_count || 1,
            providerName: h.provider_name || '',
          })));
        }
      } catch { /* keep sessionStorage fallback */ }
    })();
  }, [user?.id]);

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clearAll = () => { setItems([]); setConfirmClear(false); };

  /* ── Filtered items ─────────────────────────────────────── */
  const filtered = useMemo(() => {
    let result = [...items];
    if (filter !== 'all') result = result.filter((i) => i.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) =>
        i.title.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));
    return result;
  }, [items, filter, search]);

  /* ── Group by date ──────────────────────────────────────── */
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((item) => {
      const group = getDateGroup(item.viewedAt);
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    return groups;
  }, [filtered]);

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier'];
  const counts = {
    all: items.length,
    property: items.filter((i) => i.type === 'property').length,
    service: items.filter((i) => i.type === 'service').length,
    product: items.filter((i) => i.type === 'product').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
              <HistoryIcon size={20} className="text-blue-500" />
              Recently Viewed
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{items.length} items in history</p>
          </div>

          {items.length > 0 && (
            <>
              {!confirmClear ? (
                <button onClick={() => setConfirmClear(true)}
                  className="text-xs text-red-400 hover:text-red-500 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors self-start">
                  Clear History
                </button>
              ) : (
                <div className="flex items-center gap-1.5 self-start">
                  <span className="text-xs text-red-500">Clear all history?</span>
                  <button onClick={clearAll} className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600">Yes</button>
                  <button onClick={() => setConfirmClear(false)} className="px-2 py-1 text-xs text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5">No</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Filters + Search ────────────────────────────── */}
        {items.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex gap-1.5 overflow-x-auto scroll-x">
              {[
                { id: 'all', label: 'All' },
                { id: 'property', label: 'Properties' },
                { id: 'service', label: 'Services' },
                { id: 'product', label: 'Products' },
              ].map((f) => (
                <button key={f.id} onClick={() => setFilter(f.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all border
                    ${filter === f.id
                      ? 'border-brand-gold bg-brand-gold/5 dark:bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                      : 'border-gray-200 dark:border-white/10 text-gray-400 hover:border-gray-300'
                    }`}>
                  {f.label}
                  <span className={`min-w-[16px] h-[16px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center
                    ${filter === f.id ? 'bg-brand-gold text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500'}`}>
                    {counts[f.id]}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative sm:ml-auto sm:w-48">
              <Search size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input type="text" value={search}
                onChange={(e) => setSearch(sanitize(e.target.value))}
                placeholder="Search history..."
                className="w-full py-2 pr-3 text-xs border border-gray-200 pl-9 bg-gray-50 dark:bg-white/5 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold/30"
                maxLength={60} />
            </div>
          </div>
        )}

        {/* ── Empty state ─────────────────────────────────── */}
        {items.length === 0 && (
          <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <HistoryIcon size={48} className="mx-auto mb-4 text-gray-200 dark:text-gray-700" />
            <h2 className="mb-2 text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">
              No browsing history
            </h2>
            <p className="max-w-sm mx-auto mb-6 text-sm text-gray-400">
              Properties, services, and products you view will appear here so you can easily find them again.
            </p>
            <Link to="/properties" className="inline-block text-sm btn-primary">Browse Properties</Link>
          </div>
        )}

        {/* ── No filter results ───────────────────────────── */}
        {items.length > 0 && filtered.length === 0 && (
          <div className="p-8 text-center bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <Search size={32} className="mx-auto mb-3 text-gray-200 dark:text-gray-700" />
            <p className="text-sm text-gray-500">No history items match your filter</p>
            <button onClick={() => { setFilter('all'); setSearch(''); }}
              className="mt-3 text-xs font-semibold text-brand-gold hover:underline">
              Clear filters
            </button>
          </div>
        )}

        {/* ── Grouped history list ────────────────────────── */}
        {groupOrder.map((groupName) => {
          const groupItems = grouped[groupName];
          if (!groupItems || groupItems.length === 0) return null;
          return (
            <div key={groupName}>
              <h3 className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">{groupName}</h3>
              <div className="space-y-2">
                {groupItems.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-card p-3.5 flex items-center gap-3 group hover:shadow-card-hover transition-shadow">
                    {/* Thumbnail */}
                    <div className="flex items-center justify-center overflow-hidden bg-gray-100 w-14 h-14 rounded-xl dark:bg-white/5 shrink-0">
                      {item.image ? (
                        <img src={item.image} alt="" className="object-cover w-14 h-14 rounded-xl" loading="lazy" />
                      ) : (
                        <span className="text-2xl">{CATEGORY_EMOJI[item.category] || '📋'}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${TYPE_LABELS[item.type]?.color || ''}`}>
                          {TYPE_LABELS[item.type]?.label}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Clock size={9} /> {formatTime(item.viewedAt)}
                        </span>
                        {item.viewCount > 1 && (
                          <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                            <Eye size={9} /> {item.viewCount}x
                          </span>
                        )}
                      </div>
                      <Link to={getItemLink(item)}>
                        <h4 className="text-sm font-semibold truncate transition-colors text-brand-charcoal-dark dark:text-white hover:text-brand-gold">
                          {item.title}
                        </h4>
                      </Link>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                        <MapPin size={10} />
                        <span className="truncate">{item.location}</span>
                        <span className="mx-1">·</span>
                        <span className="truncate">{item.providerName}</span>
                      </div>
                    </div>

                    {/* Price + actions */}
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold font-display text-brand-gold">
                        {formatMoney(item.price)}
                        {item.pricePeriod && <span className="text-[10px] text-gray-400 font-normal">{item.pricePeriod}</span>}
                      </p>
                      {item.type === 'property' && item.bedrooms && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {item.bedrooms} Bed · {item.bathrooms} Bath
                        </p>
                      )}
                      <button onClick={() => removeItem(item.id)}
                        className="text-[10px] text-red-400 hover:text-red-500 font-medium mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}