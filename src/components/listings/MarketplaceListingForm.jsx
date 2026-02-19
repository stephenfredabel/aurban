import { useState, useCallback } from 'react';
import { useNavigate }           from 'react-router-dom';
import { useAuth }               from '../../context/AuthContext.jsx';
import { useCurrency }           from '../../hooks/useCurrency.js';
import { sanitize }              from '../../utils/security.js';
import {
  CheckCircle2, ChevronLeft, ChevronRight,
  AlertCircle, Info, Package, Truck,
} from 'lucide-react';
import PhotoUploader from '../../components/listings/PhotoUploader.jsx';
import {
  MARKETPLACE_CATEGORIES, ITEM_CONDITIONS,
  PRICING_UNITS, DELIVERY_OPTIONS,
} from '../../data/marketplaceOptions.js';
import { NIGERIA_STATES } from '../../data/listingOptions.js';

const STEPS = ['category', 'details', 'pricing', 'delivery', 'media', 'preview'];
const STEP_LABELS = { category:'Category', details:'Details', pricing:'Pricing', delivery:'Delivery', media:'Media', preview:'Preview' };

function initForm() {
  return {
    category: '', subcategory: '',
    title: '', description: '', brand: '', model: '', condition: 'new',
    specs: '',
    price: '', pricingUnit: 'per_unit', negotiable: false,
    minOrderQty: '1', stockQty: '',
    deliveryOption: 'both',
    state: '', deliveryNotes: '', pickupAddress: '',
    deliveryCost: '', deliveryDays: '',
    photos: [],
    warrantyInfo: '',
  };
}

function validateStep(step, form) {
  const e = {};
  if (step === 'category') {
    if (!form.category)    e.category    = 'Select a category.';
    if (!form.subcategory) e.subcategory = 'Select a subcategory.';
  }
  if (step === 'details') {
    if (!sanitize(form.title).trim() || form.title.length < 10) e.title = 'Title must be at least 10 characters.';
    if (form.description.length < 50) e.description = 'Description must be at least 50 characters.';
    if (!form.condition) e.condition = 'Select item condition.';
  }
  if (step === 'pricing') {
    if (!form.price || Number(form.price) <= 0) e.price = 'Enter a valid price.';
  }
  if (step === 'media') {
    if (form.photos.length < 3) e.photos = 'Upload at least 3 product photos.';
  }
  return e;
}

export default function MarketplaceListingForm({ onBack }) {
  const { user: _user } = useAuth();
  const { symbol }   = useCurrency();
  const navigate     = useNavigate();

  const [stepIdx, setStepIdx]     = useState(0);
  const [form, setForm]           = useState(initForm);
  const [errors, setErrors]       = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  const currentStep = STEPS[stepIdx];
  const isPreview   = currentStep === 'preview';

  const set = useCallback((field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: null }));
  }, []);

  const goNext = useCallback(() => {
    const errs = validateStep(currentStep, form);
    if (Object.keys(errs).length) { setErrors(errs); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setErrors({});
    setStepIdx(i => Math.min(i + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, form]);

  const goBack = useCallback(() => {
    if (stepIdx === 0) { onBack(); return; }
    setStepIdx(i => i - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stepIdx, onBack]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setSubmitted(true);
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCat = MARKETPLACE_CATEGORIES.find(c => c.value === form.category);

  if (submitted) {
    return (
      <div className="max-w-lg px-4 py-16 mx-auto text-center">
        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-emerald-50 rounded-3xl">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h1 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">Product listed!</h1>
        <p className="mb-8 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Your product is under review and will be live within 2 hours.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button onClick={() => navigate('/provider')} className="btn-primary">Go to Dashboard</button>
          <button onClick={() => { setSubmitted(false); setForm(initForm()); setStepIdx(0); }} className="text-sm btn-ghost">List another product</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl px-4 py-6 pb-24 mx-auto lg:pb-10">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={goBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-brand-charcoal dark:text-white/70 hover:text-brand-charcoal-dark transition-colors">
            <ChevronLeft size={16} />Back
          </button>
          <span className="text-xs font-semibold text-gray-400">Step {stepIdx + 1} of {STEPS.length}</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
          <div className="h-full transition-all duration-300 rounded-full bg-brand-gold"
            style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      {/* ── CATEGORY ────────────────────────────────── */}
      {currentStep === 'category' && (
        <div className="space-y-5">
          <div>
            <h2 className="mb-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">Product Category</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Aurban Marketplace is strictly for real estate & construction products.</p>
          </div>
          <div className="p-3 border bg-amber-50 dark:bg-amber-500/10 rounded-2xl border-amber-100 dark:border-amber-500/20">
            <p className="mb-1 text-xs font-bold text-amber-800 dark:text-amber-300">⚠️ Marketplace rules</p>
            <p className="text-xs text-amber-700 dark:text-amber-400">Only real estate, construction, and home improvement products are allowed. General consumer goods (phones, clothing, food etc.) are not permitted and will be removed.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {MARKETPLACE_CATEGORIES.map(({ value, label, icon, desc }) => (
              <button key={value} type="button" onClick={() => { set('category', value); set('subcategory', ''); }}
                className={[
                  'p-4 rounded-2xl border-2 text-left transition-all',
                  form.category === value
                    ? 'border-brand-gold bg-brand-gold/10'
                    : 'border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 hover:border-brand-gold/40',
                ].join(' ')}>
                <span className="block mb-2 text-2xl">{icon}</span>
                <p className={`text-sm font-bold ${form.category === value ? 'text-brand-gold' : 'text-brand-charcoal-dark dark:text-white'}`}>{label}</p>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{desc}</p>
              </button>
            ))}
          </div>
          {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}

          {form.category && selectedCat && (
            <div className="animate-fade-in">
              <label className="mb-2 label-sm">Product Type *</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {selectedCat.subcategories.map(sub => (
                  <button key={sub} type="button" onClick={() => set('subcategory', sub)}
                    className={[
                      'px-3 py-2.5 rounded-xl text-sm font-semibold text-left border transition-all',
                      form.subcategory === sub
                        ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-white/70 hover:border-gray-300',
                    ].join(' ')}>
                    {sub}
                  </button>
                ))}
              </div>
              {errors.subcategory && <p className="mt-1 text-xs text-red-500">{errors.subcategory}</p>}
            </div>
          )}
        </div>
      )}

      {/* ── DETAILS ─────────────────────────────────── */}
      {currentStep === 'details' && (
        <div className="space-y-5">
          <h2 className="text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">Product Details</h2>

          <div>
            <label htmlFor="mp-title" className="label-sm mb-1.5">Product Title * <span className="font-normal text-gray-400">({form.title.length}/100)</span></label>
            <input id="mp-title" type="text"
              value={form.title}
              onChange={e => set('title', sanitize(e.target.value).slice(0, 100))}
              placeholder={`e.g. Dangote Cement 42.5R — Lagos Mainland`}
              className={`input-field ${errors.title ? 'border-red-400' : ''}`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="mp-brand" className="label-sm mb-1.5">Brand / Make</label>
              <input id="mp-brand" type="text" value={form.brand}
                onChange={e => set('brand', sanitize(e.target.value))}
                placeholder="e.g. Dangote, Nigerian Eagle"
                className="input-field" />
            </div>
            <div>
              <label htmlFor="mp-model" className="label-sm mb-1.5">Model / Grade</label>
              <input id="mp-model" type="text" value={form.model}
                onChange={e => set('model', sanitize(e.target.value))}
                placeholder="e.g. 42.5R, Grade 60"
                className="input-field" />
            </div>
          </div>

          <div>
            <label className="mb-2 label-sm">Condition *</label>
            <div className="grid grid-cols-3 gap-2">
              {ITEM_CONDITIONS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => set('condition', value)}
                  className={[
                    'px-3 py-3 rounded-xl border-2 text-sm font-semibold text-center transition-all',
                    form.condition === value
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60 hover:border-gray-300',
                  ].join(' ')}>
                  {label}
                </button>
              ))}
            </div>
            {errors.condition && <p className="mt-1 text-xs text-red-500">{errors.condition}</p>}
          </div>

          <div>
            <label htmlFor="mp-desc" className="label-sm mb-1.5">Description * <span className="font-normal text-gray-400">({form.description.length}/2000)</span></label>
            <textarea id="mp-desc" rows={5} value={form.description}
              onChange={e => set('description', sanitize(e.target.value).slice(0, 2000))}
              placeholder="Describe the product in detail — quality, specifications, quantity available, where it can be used, why a buyer should choose you…"
              className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`}
            />
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </div>

          <div>
            <label htmlFor="mp-specs" className="label-sm mb-1.5">Technical Specifications <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea id="mp-specs" rows={3} value={form.specs}
              onChange={e => set('specs', sanitize(e.target.value))}
              placeholder="e.g. Dimension: 900×600mm / Thickness: 10mm / Finish: Polished / Water absorption: <0.5%"
              className="resize-none input-field"
            />
          </div>

          <div>
            <label htmlFor="mp-warranty" className="label-sm mb-1.5">Warranty Information <span className="font-normal text-gray-400">(optional)</span></label>
            <input id="mp-warranty" type="text" value={form.warrantyInfo}
              onChange={e => set('warrantyInfo', sanitize(e.target.value))}
              placeholder="e.g. 12 months manufacturer warranty, Replacement on defects"
              className="input-field"
            />
          </div>
        </div>
      )}

      {/* ── PRICING ─────────────────────────────────── */}
      {currentStep === 'pricing' && (
        <div className="space-y-5">
          <h2 className="text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">Pricing & Stock</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="mp-price" className="label-sm mb-1.5">Price ({symbol}) *</label>
              <div className="relative">
                <span className="absolute text-sm font-bold text-gray-400 -translate-y-1/2 pointer-events-none left-3 top-1/2">{symbol}</span>
                <input id="mp-price" type="number" inputMode="numeric" min={0}
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  placeholder="0"
                  className={`input-field pl-8 ${errors.price ? 'border-red-400' : ''}`}
                />
              </div>
              {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
            </div>
            <div>
              <label htmlFor="mp-unit" className="label-sm mb-1.5">Pricing Unit *</label>
              <select id="mp-unit" value={form.pricingUnit} onChange={e => set('pricingUnit', e.target.value)}
                className="input-field">
                {PRICING_UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
            <input type="checkbox" id="mp-neg" checked={form.negotiable}
              onChange={e => set('negotiable', e.target.checked)}
              className="w-4 h-4 accent-brand-gold" />
            <label htmlFor="mp-neg" className="text-sm font-semibold cursor-pointer text-brand-charcoal dark:text-white/80">
              Price is negotiable (especially for bulk orders)
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="mp-minqty" className="label-sm mb-1.5">Minimum Order Quantity</label>
              <input id="mp-minqty" type="number" inputMode="numeric" min={1}
                value={form.minOrderQty}
                onChange={e => set('minOrderQty', e.target.value)}
                placeholder="1"
                className="input-field"
              />
            </div>
            <div>
              <label htmlFor="mp-stock" className="label-sm mb-1.5">Stock Available</label>
              <input id="mp-stock" type="number" inputMode="numeric" min={0}
                value={form.stockQty}
                onChange={e => set('stockQty', e.target.value)}
                placeholder="e.g. 500"
                className="input-field"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── DELIVERY ────────────────────────────────── */}
      {currentStep === 'delivery' && (
        <div className="space-y-5">
          <h2 className="text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">Delivery & Pickup</h2>

          <div>
            <label className="mb-2 label-sm">Fulfilment options *</label>
            <div className="space-y-2">
              {DELIVERY_OPTIONS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => set('deliveryOption', value)}
                  className={[
                    'w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 text-left transition-all',
                    form.deliveryOption === value
                      ? 'border-brand-gold bg-brand-gold/10'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-gray-300',
                  ].join(' ')}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${form.deliveryOption === value ? 'border-brand-gold' : 'border-gray-300'}`}>
                    {form.deliveryOption === value && <div className="w-2 h-2 rounded-full bg-brand-gold" />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${form.deliveryOption === value ? 'text-brand-charcoal-dark dark:text-white' : 'text-gray-600 dark:text-white/70'}`}>{label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Delivery details */}
          {(form.deliveryOption === 'delivery' || form.deliveryOption === 'both') && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="mp-dlvcost" className="label-sm mb-1.5">Delivery fee ({symbol})</label>
                  <div className="relative">
                    <span className="absolute text-sm font-bold text-gray-400 -translate-y-1/2 pointer-events-none left-3 top-1/2">{symbol}</span>
                    <input id="mp-dlvcost" type="number" inputMode="numeric" min={0}
                      value={form.deliveryCost}
                      onChange={e => set('deliveryCost', e.target.value)}
                      placeholder="0 = Free delivery"
                      className="pl-8 input-field"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="mp-dlvdays" className="label-sm mb-1.5">Delivery time</label>
                  <input id="mp-dlvdays" type="text"
                    value={form.deliveryDays}
                    onChange={e => set('deliveryDays', sanitize(e.target.value))}
                    placeholder="e.g. 1–3 working days"
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="mp-dlvnotes" className="label-sm mb-1.5">Delivery notes</label>
                <input id="mp-dlvnotes" type="text"
                  value={form.deliveryNotes}
                  onChange={e => set('deliveryNotes', sanitize(e.target.value))}
                  placeholder="e.g. Delivery within Lagos only. Call to confirm delivery address before order."
                  className="input-field"
                />
              </div>
            </div>
          )}

          {/* Pickup details */}
          {(form.deliveryOption === 'pickup' || form.deliveryOption === 'both') && (
            <div className="space-y-3 animate-fade-in">
              <div>
                <label htmlFor="mp-state" className="label-sm mb-1.5">Pickup State</label>
                <select id="mp-state" value={form.state} onChange={e => set('state', e.target.value)} className="input-field">
                  <option value="">Select state…</option>
                  {NIGERIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="mp-pickup" className="label-sm mb-1.5">Pickup Location <span className="font-normal text-gray-400">(area — not full address)</span></label>
                <input id="mp-pickup" type="text"
                  value={form.pickupAddress}
                  onChange={e => set('pickupAddress', sanitize(e.target.value))}
                  placeholder="e.g. Ojota Market, Lagos"
                  className="input-field"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MEDIA ───────────────────────────────────── */}
      {currentStep === 'media' && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">Product Photos</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Clear product photos significantly increase buyer confidence.</p>
          </div>
          <PhotoUploader
            photos={form.photos}
            onChange={photos => set('photos', photos)}
            minPhotos={3}
            maxPhotos={10}
            requiredViews={['Front view', 'Side/back view', 'Label/brand marking']}
          />
          {errors.photos && <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle size={12} />{errors.photos}</p>}
        </div>
      )}

      {/* ── PREVIEW ─────────────────────────────────── */}
      {currentStep === 'preview' && (
        <div className="space-y-5">
          <h2 className="text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">Review & Submit</h2>

          <div className="p-5 space-y-4 bg-white dark:bg-brand-charcoal-dark rounded-2xl shadow-card">
            {form.photos[0] && (
              <div className="overflow-hidden bg-gray-100 aspect-square rounded-xl dark:bg-white/10">
                <img src={form.photos[0].url} alt="Product cover" className="object-cover w-full h-full" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{selectedCat?.icon}</span>
                <span className="text-xs font-bold tracking-wider uppercase text-brand-gold">{selectedCat?.label}</span>
              </div>
              <h3 className="text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">{form.title || '(No title)'}</h3>
              <p className="mt-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                {symbol}{form.price ? Number(form.price).toLocaleString() : '0'}
                <span className="ml-1 text-sm font-normal text-gray-400">
                  {PRICING_UNITS.find(u => u.value === form.pricingUnit)?.label}
                </span>
                {form.negotiable && <span className="ml-2 text-sm font-normal text-emerald-500">(Negotiable)</span>}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {form.condition && <span className="capitalize tag bg-brand-gray-soft dark:bg-white/10 text-brand-charcoal dark:text-white">{ITEM_CONDITIONS.find(c=>c.value===form.condition)?.label}</span>}
                {form.brand     && <span className="tag bg-brand-gray-soft dark:bg-white/10 text-brand-charcoal dark:text-white">{form.brand}</span>}
                {form.stockQty  && <span className="tag bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">{form.stockQty} in stock</span>}
                {form.deliveryOption !== 'pickup' && <span className="text-blue-600 tag bg-blue-50 dark:bg-blue-500/10">Delivery available</span>}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: 'Category',    ok: !!form.category && !!form.subcategory },
              { label: 'Title',       ok: form.title.length >= 10               },
              { label: 'Description', ok: form.description.length >= 50         },
              { label: 'Condition',   ok: !!form.condition                      },
              { label: 'Price',       ok: Number(form.price) > 0                },
              { label: 'Photos (min 3)', ok: form.photos.length >= 3            },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                {ok ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    : <AlertCircle  size={16} className="text-amber-400 shrink-0"  />}
                <span className={ok ? 'text-brand-charcoal-dark dark:text-white' : 'text-amber-600 dark:text-amber-400'}>
                  {label}{!ok && ' — incomplete'}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              By submitting you confirm this product is real-estate related and agree to our{' '}
              <a href="/legal/provider-agreement" className="font-semibold text-brand-gold" target="_blank" rel="noopener noreferrer">Provider Agreement</a>.
              Aurban takes 8% on all completed transactions.
            </p>
          </div>
          {errors.submit && <p className="text-sm text-center text-red-500">{errors.submit}</p>}
        </div>
      )}

      {/* Nav footer */}
      <div className="fixed bottom-0 left-0 right-0 flex items-center gap-3 px-4 py-4 mt-8 bg-white border-t border-gray-100 md:relative md:bottom-auto dark:bg-brand-charcoal-dark dark:border-white/10 md:border-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <button type="button" onClick={goBack}
          className="flex items-center gap-1.5 px-5 py-3 rounded-xl border-2 border-gray-200 dark:border-white/20 text-sm font-semibold text-brand-charcoal dark:text-white hover:border-gray-300 transition-colors">
          <ChevronLeft size={16} />Back
        </button>
        <button type="button" onClick={isPreview ? handleSubmit : goNext} disabled={submitting}
          className="flex items-center justify-center flex-1 gap-2 py-3 text-sm font-bold text-white transition-colors rounded-xl bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-60">
          {submitting
            ? <><span className="w-4 h-4 border-2 rounded-full border-white/40 border-t-white animate-spin" /> Submitting…</>
            : isPreview ? <><CheckCircle2 size={16} />Submit Product</>
            : <>Continue <ChevronRight size={16} /></>
          }
        </button>
      </div>
    </div>
  );
}