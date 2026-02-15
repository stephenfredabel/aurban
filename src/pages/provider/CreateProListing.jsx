import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Check, Loader2,
  FileText, Camera, DollarSign, MapPin,
} from 'lucide-react';
import { useProListing } from '../../context/ProListingContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { PRO_SERVICE_CATEGORY_MAP, getCategoriesByTier } from '../../data/proServiceCategoryFields.js';
import { TIER_CONFIG, PRO_PRICING_MODES } from '../../data/proConstants.js';
import { NIGERIAN_STATES } from '../../context/PropertyContext.jsx';
import ProTierBadge from '../../components/pro/ProTierBadge.jsx';

/* ════════════════════════════════════════════════════════════
   CREATE PRO LISTING WIZARD
   Route: /provider/pro-listings/new
   Steps: Category → Details → Photos → Pricing → Location → Preview
════════════════════════════════════════════════════════════ */

const STEPS = ['Category', 'Details', 'Photos', 'Pricing', 'Location', 'Preview'];

export default function CreateProListing() {
  const navigate = useNavigate();
  const { addListing } = useProListing();
  const { user } = useAuth();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState({
    category: '',
    subcategory: '',
    title: '',
    description: '',
    photos: [],
    pricingMode: 'per_job',
    price: '',
    priceNote: '',
    state: '',
    lga: '',
    fields: {},
  });
  const [errors, setErrors] = useState({});

  const catDef = PRO_SERVICE_CATEGORY_MAP[data.category];
  const tierCfg = catDef ? TIER_CONFIG[catDef.tier] : null;

  function update(field, value) {
    setData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function updateField(fieldId, value) {
    setData(prev => ({ ...prev, fields: { ...prev.fields, [fieldId]: value } }));
  }

  function validate() {
    const errs = {};
    if (step === 0 && !data.category) errs.category = 'Select a category';
    if (step === 1) {
      if (!data.title.trim()) errs.title = 'Enter a title';
      if (!data.description.trim()) errs.description = 'Enter a description';
    }
    if (step === 3) {
      if (data.pricingMode !== 'quote' && (!data.price || Number(data.price) <= 0)) errs.price = 'Enter a valid price';
    }
    if (step === 4) {
      if (!data.state) errs.state = 'Select a state';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (validate()) setStep(s => Math.min(s + 1, STEPS.length - 1));
  }

  function prev() {
    setStep(s => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const listing = {
        id: `ps_${Date.now()}`,
        ...data,
        price: data.pricingMode === 'quote' ? null : Number(data.price),
        tier: catDef?.tier || 1,
        providerId: user?.id || 'prov_self',
        providerName: user?.name || user?.businessName || 'My Business',
        providerLevel: 'verified',
        providerVerified: true,
        providerRating: 4.8,
        providerReviews: 12,
        rating: 0,
        reviewCount: 0,
        active: true,
        createdAt: new Date().toISOString(),
      };
      addListing(listing);
      navigate('/provider/pro-listings');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Back nav */}
      <button
        onClick={() => step === 0 ? navigate('/provider/pro-listings') : prev()}
        className="flex items-center gap-1.5 mb-4 text-sm text-gray-500 hover:text-brand-gold transition-colors"
      >
        <ChevronLeft size={16} /> {step === 0 ? 'Pro Listings' : 'Back'}
      </button>

      <h1 className="mb-1 text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">
        Create Pro Listing
      </h1>
      <p className="mb-5 text-xs text-gray-400">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

      {/* Step content */}
      <div className="max-w-xl">

        {/* STEP 0: Category */}
        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">Select your service category</p>
            {[1, 2, 3, 4].map(tier => {
              const cats = getCategoriesByTier(tier);
              return (
                <div key={tier}>
                  <div className="flex items-center gap-2 mb-2">
                    <ProTierBadge tier={tier} />
                    <span className="text-xs text-gray-400">{TIER_CONFIG[tier]?.desc}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {cats.map(([key, cat]) => (
                      <button
                        key={key}
                        onClick={() => update('category', key)}
                        className={`p-3 text-left border-2 rounded-xl transition-all ${
                          data.category === key
                            ? 'border-brand-gold bg-brand-gold/10'
                            : 'border-gray-200 dark:border-white/10 hover:border-brand-gold/50'
                        }`}
                      >
                        <span className="text-lg mr-2">{cat.icon}</span>
                        <span className="text-xs font-bold text-brand-charcoal-dark dark:text-white">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
          </div>
        )}

        {/* STEP 1: Details */}
        {step === 1 && (
          <div className="space-y-4">
            {catDef && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-white/[0.02] rounded-xl">
                <span className="text-lg">{catDef.icon}</span>
                <span className="text-xs font-bold text-brand-charcoal-dark dark:text-white">{catDef.label}</span>
                <ProTierBadge tier={catDef.tier} size="sm" />
              </div>
            )}

            {catDef?.subcategories?.length > 0 && (
              <div>
                <label className="mb-1 text-xs font-semibold text-gray-500 block">Subcategory</label>
                <select
                  value={data.subcategory}
                  onChange={e => update('subcategory', e.target.value)}
                  className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white outline-none"
                >
                  <option value="">Select (optional)</option>
                  {catDef.subcategories.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="flex items-center gap-2 mb-1 text-xs font-semibold text-gray-500"><FileText size={12} /> Title</label>
              <input
                type="text"
                value={data.title}
                onChange={e => update('title', e.target.value)}
                placeholder="e.g. Professional Deep Cleaning Service"
                className={`w-full py-2.5 px-3 text-sm border rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 outline-none ${errors.title ? 'border-red-400' : 'border-gray-200 dark:border-white/10'}`}
              />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>

            <div>
              <label className="mb-1 text-xs font-semibold text-gray-500 block">Description</label>
              <textarea
                value={data.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Describe your service in detail..."
                rows={4}
                className={`w-full py-2.5 px-3 text-sm border rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 outline-none resize-none ${errors.description ? 'border-red-400' : 'border-gray-200 dark:border-white/10'}`}
              />
              {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
            </div>

            {/* Category-specific fields */}
            {catDef?.fields?.map(f => (
              <div key={f.id}>
                <label className="mb-1 text-xs font-semibold text-gray-500 block">{f.label}</label>
                {f.type === 'select' ? (
                  <select
                    value={data.fields[f.id] || ''}
                    onChange={e => updateField(f.id, e.target.value)}
                    className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white outline-none"
                  >
                    <option value="">Select</option>
                    {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'multiselect' ? (
                  <div className="flex flex-wrap gap-1.5">
                    {f.options?.map(o => {
                      const selected = (data.fields[f.id] || []).includes(o);
                      return (
                        <button
                          key={o}
                          type="button"
                          onClick={() => {
                            const current = data.fields[f.id] || [];
                            updateField(f.id, selected ? current.filter(v => v !== o) : [...current, o]);
                          }}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${selected ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-gray-200 dark:border-white/10 text-gray-500'}`}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                ) : f.type === 'boolean' ? (
                  <button
                    type="button"
                    onClick={() => updateField(f.id, !data.fields[f.id])}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${data.fields[f.id] ? 'border-brand-gold bg-brand-gold/10 text-brand-gold' : 'border-gray-200 dark:border-white/10 text-gray-500'}`}
                  >
                    {data.fields[f.id] ? 'Yes' : 'No'}
                  </button>
                ) : (
                  <input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={data.fields[f.id] || ''}
                    onChange={e => updateField(f.id, e.target.value)}
                    placeholder={f.placeholder || ''}
                    className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* STEP 2: Photos */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">Add photos of your work</p>
            <p className="text-xs text-gray-400">Portfolio photos help clients trust your service</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {data.photos.map((_, i) => (
                <div key={i} className="flex items-center justify-center h-24 text-xs text-gray-400 bg-gray-100 dark:bg-white/5 rounded-xl">
                  Photo {i + 1}
                </div>
              ))}
              <button
                type="button"
                onClick={() => update('photos', [...data.photos, 'placeholder'])}
                className="flex flex-col items-center justify-center h-24 text-gray-400 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl hover:border-brand-gold/50"
              >
                <Camera size={20} />
                <span className="text-[10px] mt-1">Add Photo</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Pricing */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">Set your pricing</p>

            <div>
              <label className="mb-1.5 text-xs font-semibold text-gray-500 block">Pricing Mode</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(PRO_PRICING_MODES).map(([id, mode]) => (
                  <button
                    key={id}
                    onClick={() => update('pricingMode', id)}
                    className={`p-3 text-left border-2 rounded-xl text-xs ${
                      data.pricingMode === id ? 'border-brand-gold bg-brand-gold/10' : 'border-gray-200 dark:border-white/10'
                    }`}
                  >
                    <span className="font-bold text-brand-charcoal-dark dark:text-white">{mode.label}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">{mode.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {data.pricingMode !== 'quote' && (
              <div>
                <label className="flex items-center gap-2 mb-1 text-xs font-semibold text-gray-500"><DollarSign size={12} /> Price (NGN)</label>
                <input
                  type="number"
                  value={data.price}
                  onChange={e => update('price', e.target.value)}
                  placeholder="0"
                  min="0"
                  className={`w-full py-2.5 px-3 text-sm border rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white outline-none ${errors.price ? 'border-red-400' : 'border-gray-200 dark:border-white/10'}`}
                />
                {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
              </div>
            )}

            <div>
              <label className="mb-1 text-xs font-semibold text-gray-500 block">Price Note (optional)</label>
              <input
                type="text"
                value={data.priceNote}
                onChange={e => update('priceNote', e.target.value)}
                placeholder="e.g. Price may vary based on property size"
                className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Location */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">Where do you offer this service?</p>
            <div>
              <label className="flex items-center gap-2 mb-1.5 text-xs font-semibold text-gray-500"><MapPin size={12} /> State</label>
              <select
                value={data.state}
                onChange={e => update('state', e.target.value)}
                className={`w-full py-2.5 px-3 text-sm border rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white outline-none ${errors.state ? 'border-red-400' : 'border-gray-200 dark:border-white/10'}`}
              >
                <option value="">Select state</option>
                {NIGERIAN_STATES.filter(s => s !== 'All States').map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
            </div>
            <div>
              <label className="mb-1 text-xs font-semibold text-gray-500 block">LGA / Area</label>
              <input
                type="text"
                value={data.lga}
                onChange={e => update('lga', e.target.value)}
                placeholder="e.g. Lekki, Ikeja"
                className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-brand-charcoal-dark dark:text-white placeholder:text-gray-300 outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 5: Preview */}
        {step === 5 && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">Review your listing</p>
            <div className="p-4 border border-gray-100 dark:border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{catDef?.icon}</span>
                <span className="text-xs font-bold text-gray-500">{catDef?.label}</span>
                {tierCfg && <ProTierBadge tier={catDef.tier} size="sm" />}
              </div>
              <h3 className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{data.title}</h3>
              <p className="text-xs text-gray-500">{data.description}</p>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Price</span>
                <span className="font-bold text-brand-gold">
                  {data.pricingMode === 'quote' ? 'Custom Quote' : `₦${Number(data.price).toLocaleString()}`}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Location</span>
                <span className="font-semibold text-brand-charcoal-dark dark:text-white">{data.lga ? `${data.lga}, ` : ''}{data.state}</span>
              </div>
              {tierCfg && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Observation Window</span>
                    <span className="font-semibold text-brand-charcoal-dark dark:text-white">{tierCfg.observationDays} days</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Commitment Fee</span>
                    <span className="font-semibold text-brand-charcoal-dark dark:text-white">{tierCfg.commitmentFeePercent}%</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-white/10">
          {step > 0 && (
            <button
              onClick={prev}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold border border-gray-200 dark:border-white/10 rounded-xl text-brand-charcoal-dark dark:text-white"
            >
              <ChevronLeft size={14} /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={next}
              className="flex items-center gap-1.5 flex-1 justify-center px-5 py-2.5 text-xs font-bold text-white rounded-xl bg-brand-gold hover:bg-brand-gold-dark"
            >
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-1.5 flex-1 justify-center px-5 py-2.5 text-xs font-bold text-white rounded-xl bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Publish Listing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
