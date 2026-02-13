import { useState, useCallback, useMemo } from 'react';
import { useTranslation }    from 'react-i18next';
import { useNavigate }       from 'react-router-dom';
import { useAuth }           from '../../context/AuthContext.jsx';
import { useCurrency }       from '../../hooks/useCurrency.js';
import { sanitize }          from '../../utils/security.js';
import {
  CheckCircle2, ChevronRight, ChevronLeft,
  AlertCircle, Info, MapPin, DollarSign,
  Home, List, Image, Calendar, Eye,
} from 'lucide-react';
import PhotoUploader         from '../../components/listings/PhotoUploader.jsx';
import YouTubeInput          from '../../components/listings/YouTubeInput.jsx';
import InspectionAvailability from '../../components/listings/InspectionAvailability.jsx';
import {
  PROPERTY_TYPES, PRICING_PERIODS, DEFAULT_PERIOD, PHOTO_REQUIREMENTS,
  NIGERIA_STATES, LAGOS_LGAS, FURNISHING_OPTIONS, AMENITIES, groupAmenities,
  HOUSE_RULES, MIN_DURATIONS, LAND_DOCUMENTS, getSteps,
} from '../../data/listingOptions.js';

// ── Step config ───────────────────────────────────────────────
const STEP_META = {
  basics:     { icon: Home,      label: 'Basics'      },
  location:   { icon: MapPin,    label: 'Location'    },
  details:    { icon: List,      label: 'Details'     },
  amenities:  { icon: CheckCircle2, label: 'Amenities' },
  rules:      { icon: AlertCircle, label: 'Rules'     },
  documents:  { icon: List,      label: 'Documents'   },
  media:      { icon: Image,     label: 'Media'       },
  inspection: { icon: Calendar,  label: 'Inspections' },
  preview:    { icon: Eye,       label: 'Preview'     },
};

// ── Initial form state ────────────────────────────────────────
function initForm(category) {
  return {
    // Basics
    category,
    propertyType: '',
    title: '',
    description: '',
    price: '',
    pricePeriod: DEFAULT_PERIOD[category] || 'monthly',
    negotiable: false,
    // Location
    country: 'NG',
    state: '',
    lga: '',
    area: '',
    street: '',
    landmark: '',
    // Details
    bedrooms: '',
    bathrooms: '',
    toilets: '',
    floors: '',
    areaSqm: '',
    yearBuilt: '',
    furnishing: '',
    // Land-specific
    landArea: '',
    landAreaUnit: 'sqm',
    documentType: '',
    // Move-in / availability
    availableFrom: '',
    minDuration: '',
    // Amenities (Set of ids)
    amenities: new Set(),
    // Rules (Set of ids)
    rules: new Set(),
    // Media
    photos: [],
    videoUrl: '',
    // Inspection
    inspection: null,
  };
}

// ── Validation per step ───────────────────────────────────────
function validateStep(step, form, category) {
  const errors = {};
  if (step === 'basics') {
    if (!form.propertyType)               errors.propertyType = 'Select a property type.';
    if (!sanitize(form.title).trim() || form.title.length < 10)
                                          errors.title = 'Title must be at least 10 characters.';
    if (!sanitize(form.description).trim() || form.description.length < 50)
                                          errors.description = 'Description must be at least 50 characters.';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
                                          errors.price = 'Enter a valid price.';
  }
  if (step === 'location') {
    if (!form.state)                      errors.state = 'Select a state.';
    if (!sanitize(form.area).trim())      errors.area = 'Enter the area/neighbourhood.';
  }
  if (step === 'details') {
    if (category !== 'land') {
      if (!form.bedrooms && category !== 'shared')
                                          errors.bedrooms = 'Enter number of bedrooms.';
      if (!form.bathrooms)                errors.bathrooms = 'Enter number of bathrooms.';
    }
    if (category === 'land' && !form.landArea) errors.landArea = 'Enter land area.';
  }
  if (step === 'media') {
    const req = PHOTO_REQUIREMENTS[category] || PHOTO_REQUIREMENTS.rental;
    if (form.photos.length < req.min)
      errors.photos = `Upload at least ${req.min} photos.`;
  }
  return errors;
}

// ─────────────────────────────────────────────────────────────
// Main Form Component
// ─────────────────────────────────────────────────────────────
export default function PropertyListingForm({ category, onBack }) {
  const { t }          = useTranslation();
  const { user }       = useAuth();
  const { symbol }     = useCurrency();
  const navigate       = useNavigate();

  const steps              = getSteps(category);
  const [stepIdx, setStepIdx] = useState(0);
  const [form, setForm]    = useState(() => initForm(category));
  const [errors, setErrors]= useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  const currentStep = steps[stepIdx];
  const isLast      = stepIdx === steps.length - 1;
  const isPreview   = currentStep === 'preview';

  // Update a single field
  const set = useCallback((field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: null }));
  }, []);

  // Toggle amenity / rule
  const toggleSet = useCallback((field, id) => {
    setForm(f => {
      const next = new Set(f[field]);
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...f, [field]: next };
    });
  }, []);

  // Advance to next step with validation
  const goNext = useCallback(() => {
    const errs = validateStep(currentStep, form, category);
    if (Object.keys(errs).length) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setErrors({});
    setStepIdx(i => Math.min(i + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, form, category, steps]);

  const goBack = useCallback(() => {
    if (stepIdx === 0) { onBack(); return; }
    setStepIdx(i => i - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stepIdx, onBack]);

  // Submit
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // TODO: call property.service.js createProperty(form)
      await new Promise(r => setTimeout(r, 1500)); // mock delay
      setSubmitted(true);
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-lg px-4 py-16 mx-auto text-center">
        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-emerald-50 rounded-3xl">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h1 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
          Listing submitted!
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Your listing is under review and will go live within 2 hours once our team verifies it.
          You can track its status in your Provider Dashboard.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button onClick={() => navigate('/provider')}
            className="flex items-center gap-2 btn-primary">
            Go to Dashboard <ChevronRight size={15} />
          </button>
          <button onClick={() => { setSubmitted(false); setForm(initForm(category)); setStepIdx(0); }}
            className="text-sm btn-ghost">
            Post another listing
          </button>
        </div>
      </div>
    );
  }

  const photoReq = PHOTO_REQUIREMENTS[category] || PHOTO_REQUIREMENTS.rental;
  const periods  = PRICING_PERIODS[category]    || PRICING_PERIODS.rental;
  const types    = PROPERTY_TYPES[category]     || PROPERTY_TYPES.rental;
  const grouped  = groupAmenities();

  return (
    <div className="max-w-3xl px-4 py-6 pb-24 mx-auto lg:pb-10">

      {/* ── Step progress bar ────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={goBack}
            aria-label="Previous step"
            className="flex items-center gap-1.5 text-sm font-semibold text-brand-charcoal dark:text-white/70
              hover:text-brand-charcoal-dark dark:hover:text-white transition-colors">
            <ChevronLeft size={16} />
            {stepIdx === 0 ? 'Change type' : 'Back'}
          </button>
          <span className="text-xs font-semibold text-gray-400">
            Step {stepIdx + 1} of {steps.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300 rounded-full bg-brand-gold"
            style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
            role="progressbar"
            aria-valuenow={stepIdx + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
            aria-label={`Step ${stepIdx + 1} of ${steps.length}`}
          />
        </div>

        {/* Step labels (desktop) */}
        <div className="items-center justify-between hidden mt-2 sm:flex">
          {steps.map((s, i) => {
            const meta = STEP_META[s];
            return (
              <div key={s} className={`flex items-center gap-1 text-[11px] font-semibold ${i <= stepIdx ? 'text-brand-gold' : 'text-gray-300 dark:text-white/30'}`}>
                {i < stepIdx && <CheckCircle2 size={11} />}
                {meta?.label || s}
              </div>
            );
          })}
        </div>

        {/* Current step label (mobile) */}
        <div className="mt-2 sm:hidden">
          <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
            {STEP_META[currentStep]?.label || currentStep}
          </p>
        </div>
      </div>

      {/* ── STEP: BASICS ─────────────────────────────────── */}
      {currentStep === 'basics' && (
        <div className="space-y-5">
          <div>
            <h2 className="mb-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              Basic Information
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tell us the fundamentals of your listing.
            </p>
          </div>

          {/* Property type */}
          <div>
            <label className="mb-2 label-sm">Property Type *</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {types.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => set('propertyType', type)}
                  className={[
                    'px-3 py-2.5 rounded-xl text-sm font-semibold text-left border transition-all',
                    form.propertyType === type
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-white/70 hover:border-gray-300',
                  ].join(' ')}
                >
                  {type}
                </button>
              ))}
            </div>
            {errors.propertyType && <p className="text-xs text-red-500 mt-1.5">{errors.propertyType}</p>}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="listing-title" className="label-sm mb-1.5">
              Listing Title *
              <span className="ml-1 font-normal text-gray-400">({form.title.length}/120)</span>
            </label>
            <input
              id="listing-title"
              type="text"
              value={form.title}
              onChange={e => set('title', sanitize(e.target.value).slice(0, 120))}
              placeholder="e.g. Spacious 3-Bedroom Flat in Lekki Phase 1"
              maxLength={120}
              className={`input-field ${errors.title ? 'border-red-400' : ''}`}
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="listing-desc" className="label-sm mb-1.5">
              Description *
              <span className="ml-1 font-normal text-gray-400">({form.description.length}/2000)</span>
            </label>
            <textarea
              id="listing-desc"
              rows={5}
              value={form.description}
              onChange={e => set('description', sanitize(e.target.value).slice(0, 2000))}
              placeholder="Describe the property in detail — the more information, the more trust you build with potential tenants or buyers."
              className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`}
            />
            <p className="mt-1 text-xs text-gray-400">Minimum 50 characters. Include key features, nearby landmarks, and any unique selling points.</p>
            {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
          </div>

          {/* Price + Period */}
          <div>
            <label className="label-sm mb-1.5">Price *</label>
            <div className="flex gap-2">
              {/* Currency symbol + input */}
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none">
                  {symbol}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  placeholder="0"
                  className={`input-field pl-8 ${errors.price ? 'border-red-400' : ''}`}
                />
              </div>
              {/* Period selector */}
              {periods.length > 1 && (
                <select
                  value={form.pricePeriod}
                  onChange={e => set('pricePeriod', e.target.value)}
                  className="flex-none input-field w-36"
                >
                  {periods.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              )}
              {periods.length === 1 && (
                <div className="flex-none w-32 text-sm font-semibold text-gray-500 cursor-default input-field dark:text-gray-400">
                  {periods[0].label}
                </div>
              )}
            </div>
            {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}

            {/* Negotiable toggle */}
            <div className="flex items-center gap-3 p-3 mt-3 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
              <input
                type="checkbox"
                id="negotiable"
                checked={form.negotiable}
                onChange={e => set('negotiable', e.target.checked)}
                className="w-4 h-4 accent-brand-gold"
              />
              <label htmlFor="negotiable" className="text-sm font-medium cursor-pointer text-brand-charcoal dark:text-white/80">
                Price is negotiable
              </label>
            </div>
          </div>

          {/* Fee transparency notice */}
          <div className="p-4 border bg-amber-50 dark:bg-amber-500/10 rounded-2xl border-amber-100 dark:border-amber-500/20">
            <p className="mb-1 text-xs font-bold text-amber-800 dark:text-amber-300">⚠️ Transparent pricing required</p>
            <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
              The price you enter above is the <strong>only</strong> amount your tenant or buyer will pay. You <strong>cannot</strong> request agency fees, caution fees, legal fees, or any other undisclosed charges. Aurban's 8% commission is deducted from your payment — not added on top.
            </p>
          </div>
        </div>
      )}

      {/* ── STEP: LOCATION ───────────────────────────────── */}
      {currentStep === 'location' && (
        <div className="space-y-5">
          <div>
            <h2 className="mb-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              Location
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Full address is only shown after a booking or approved inquiry — not on the public listing.
            </p>
          </div>

          {/* State */}
          <div>
            <label htmlFor="state" className="label-sm mb-1.5">State *</label>
            <select
              id="state"
              value={form.state}
              onChange={e => { set('state', e.target.value); set('lga', ''); }}
              className={`input-field ${errors.state ? 'border-red-400' : ''}`}
            >
              <option value="">Select state…</option>
              {NIGERIA_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
          </div>

          {/* LGA (Lagos only for now) */}
          {form.state === 'Lagos' && (
            <div>
              <label htmlFor="lga" className="label-sm mb-1.5">LGA</label>
              <select
                id="lga"
                value={form.lga}
                onChange={e => set('lga', e.target.value)}
                className="input-field"
              >
                <option value="">Select LGA…</option>
                {LAGOS_LGAS.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          )}

          {/* Area / neighbourhood */}
          <div>
            <label htmlFor="area" className="label-sm mb-1.5">Area / Neighbourhood *</label>
            <input
              id="area"
              type="text"
              value={form.area}
              onChange={e => set('area', sanitize(e.target.value))}
              placeholder="e.g. Lekki Phase 1, Wuse 2, GRA Phase 3"
              className={`input-field ${errors.area ? 'border-red-400' : ''}`}
            />
            {errors.area && <p className="mt-1 text-xs text-red-500">{errors.area}</p>}
          </div>

          {/* Street (optional — hidden until booking) */}
          <div>
            <label htmlFor="street" className="label-sm mb-1.5">
              Street Address
              <span className="text-gray-400 font-normal ml-1.5">(Shown only after booking)</span>
            </label>
            <input
              id="street"
              type="text"
              value={form.street}
              onChange={e => set('street', sanitize(e.target.value))}
              placeholder="e.g. 14 Admiralty Way"
              className="input-field"
            />
          </div>

          {/* Landmark */}
          <div>
            <label htmlFor="landmark" className="label-sm mb-1.5">Nearest Landmark</label>
            <input
              id="landmark"
              type="text"
              value={form.landmark}
              onChange={e => set('landmark', sanitize(e.target.value))}
              placeholder="e.g. Behind Shoprite Lekki, 5 mins from Oando filling station"
              className="input-field"
            />
          </div>
        </div>
      )}

      {/* ── STEP: DETAILS ────────────────────────────────── */}
      {currentStep === 'details' && (
        <div className="space-y-5">
          <div>
            <h2 className="mb-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              Property Details
            </h2>
          </div>

          {/* Land specific */}
          {category === 'land' ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="landArea" className="label-sm mb-1.5">Land Area *</label>
                  <input
                    id="landArea"
                    type="number"
                    min={0}
                    value={form.landArea}
                    onChange={e => set('landArea', e.target.value)}
                    placeholder="e.g. 648"
                    className={`input-field ${errors.landArea ? 'border-red-400' : ''}`}
                  />
                  {errors.landArea && <p className="mt-1 text-xs text-red-500">{errors.landArea}</p>}
                </div>
                <div>
                  <label htmlFor="landUnit" className="label-sm mb-1.5">Unit</label>
                  <select
                    id="landUnit"
                    value={form.landAreaUnit}
                    onChange={e => set('landAreaUnit', e.target.value)}
                    className="input-field"
                  >
                    <option value="sqm">sqm</option>
                    <option value="acres">Acres</option>
                    <option value="hectares">Hectares</option>
                    <option value="plots">Plots</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="docType" className="label-sm mb-1.5">Document Type</label>
                <select
                  id="docType"
                  value={form.documentType}
                  onChange={e => set('documentType', e.target.value)}
                  className="input-field"
                >
                  <option value="">Select document type…</option>
                  {LAND_DOCUMENTS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            /* Property (non-land) */
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {/* Bedrooms */}
                {category !== 'shared' && (
                  <div>
                    <label htmlFor="bedrooms" className="label-sm mb-1.5">Bedrooms *</label>
                    <select
                      id="bedrooms"
                      value={form.bedrooms}
                      onChange={e => set('bedrooms', e.target.value)}
                      className={`input-field ${errors.bedrooms ? 'border-red-400' : ''}`}
                    >
                      <option value="">—</option>
                      {['Studio', 1, 2, 3, 4, 5, 6, 7, 8, '9+'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    {errors.bedrooms && <p className="mt-1 text-xs text-red-500">{errors.bedrooms}</p>}
                  </div>
                )}

                {/* Bathrooms */}
                <div>
                  <label htmlFor="bathrooms" className="label-sm mb-1.5">Bathrooms *</label>
                  <select
                    id="bathrooms"
                    value={form.bathrooms}
                    onChange={e => set('bathrooms', e.target.value)}
                    className={`input-field ${errors.bathrooms ? 'border-red-400' : ''}`}
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5, 6, '7+'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  {errors.bathrooms && <p className="mt-1 text-xs text-red-500">{errors.bathrooms}</p>}
                </div>

                {/* Toilets */}
                <div>
                  <label htmlFor="toilets" className="label-sm mb-1.5">Toilets</label>
                  <select
                    id="toilets"
                    value={form.toilets}
                    onChange={e => set('toilets', e.target.value)}
                    className="input-field"
                  >
                    <option value="">—</option>
                    {[1, 2, 3, 4, 5, '6+'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>

                {/* Floors */}
                <div>
                  <label htmlFor="floors" className="label-sm mb-1.5">Floors</label>
                  <select
                    id="floors"
                    value={form.floors}
                    onChange={e => set('floors', e.target.value)}
                    className="input-field"
                  >
                    <option value="">—</option>
                    {['1 (Ground)', '2', '3', '4', '5+'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Area + Year + Furnishing */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="areaSqm" className="label-sm mb-1.5">Total Area (sqm)</label>
                  <input
                    id="areaSqm"
                    type="number"
                    min={0}
                    value={form.areaSqm}
                    onChange={e => set('areaSqm', e.target.value)}
                    placeholder="e.g. 180"
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="yearBuilt" className="label-sm mb-1.5">Year Built</label>
                  <input
                    id="yearBuilt"
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    value={form.yearBuilt}
                    onChange={e => set('yearBuilt', e.target.value)}
                    placeholder={String(new Date().getFullYear() - 5)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="furnishing" className="label-sm mb-1.5">Furnishing</label>
                  <select
                    id="furnishing"
                    value={form.furnishing}
                    onChange={e => set('furnishing', e.target.value)}
                    className="input-field"
                  >
                    <option value="">Select…</option>
                    {FURNISHING_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Availability (rental/lease/shared only) */}
              {['rental','lease','shared'].includes(category) && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="availFrom" className="label-sm mb-1.5">Available From</label>
                    <input
                      id="availFrom"
                      type="date"
                      value={form.availableFrom}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => set('availableFrom', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label htmlFor="minDur" className="label-sm mb-1.5">Minimum Duration</label>
                    <select
                      id="minDur"
                      value={form.minDuration}
                      onChange={e => set('minDuration', e.target.value)}
                      className="input-field"
                    >
                      <option value="">No minimum</option>
                      {MIN_DURATIONS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── STEP: AMENITIES ──────────────────────────────── */}
      {currentStep === 'amenities' && (
        <div className="space-y-5">
          <div>
            <h2 className="mb-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              Amenities & Features
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tick everything that applies. This builds trust and filters your listing to the right audience.
            </p>
          </div>
          <p className="text-xs font-bold text-brand-gold">
            {form.amenities.size} selected
          </p>
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <p className="mb-2 text-xs font-bold tracking-widest text-gray-400 uppercase dark:text-white/40">
                {group}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {items.map(({ id, label }) => {
                  const checked = form.amenities.has(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleSet('amenities', id)}
                      className={[
                        'flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all text-sm font-medium',
                        checked
                          ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                          : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-white/70 hover:border-gray-300',
                      ].join(' ')}
                    >
                      <span className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${checked ? 'bg-brand-gold border-brand-gold' : 'border-gray-300 dark:border-white/30'}`}>
                        {checked && <CheckCircle2 size={12} className="text-white" strokeWidth={3} />}
                      </span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── STEP: RULES ──────────────────────────────────── */}
      {currentStep === 'rules' && (
        <div className="space-y-5">
          <div>
            <h2 className="mb-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              House Rules
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Set expectations clearly. Rules protect both you and your future occupants.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {HOUSE_RULES.map(({ id, label, icon }) => {
              const checked = form.rules.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleSet('rules', id)}
                  className={[
                    'flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all text-sm font-medium',
                    checked
                      ? 'border-red-400 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-white/70 hover:border-gray-300',
                  ].join(' ')}
                >
                  <span className="text-lg shrink-0">{icon}</span>
                  {label}
                  {checked && <span className="ml-auto text-xs font-bold text-red-500">Active</span>}
                </button>
              );
            })}
          </div>
          {form.rules.size === 0 && (
            <div className="flex items-center gap-2 p-3 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
              <Info size={14} className="text-gray-400 shrink-0" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No rules selected — any tenant type will be shown this listing. Skip if you have no restrictions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── STEP: DOCUMENTS (land only) ──────────────────── */}
      {currentStep === 'documents' && (
        <div className="space-y-5">
          <div>
            <h2 className="mb-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              Land Documents
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Providing documentation significantly increases buyer trust and listing visibility.
            </p>
          </div>
          <div className="p-4 border bg-amber-50 dark:bg-amber-500/10 rounded-2xl border-amber-100 dark:border-amber-500/20">
            <p className="mb-1 text-xs font-bold text-amber-800 dark:text-amber-300">Document verification</p>
            <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
              Uploading a copy of your land document will earn your listing a <strong>Verified Document</strong> badge. Aurban verifies all submitted documents within 48 hours. Documents are stored securely and not displayed publicly — only the document type is shown.
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-body">
            Document upload will be available once the listing is created. You will be prompted in your Provider Dashboard to attach documents to this listing.
          </p>
        </div>
      )}

      {/* ── STEP: MEDIA ──────────────────────────────────── */}
      {currentStep === 'media' && (
        <div className="space-y-8">
          <div>
            <h2 className="mb-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              Photos & Video
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              High-quality photos dramatically increase inquiries. Listings with videos receive 3× more views.
            </p>
          </div>

          {/* Photo uploader */}
          <PhotoUploader
            photos={form.photos}
            onChange={photos => set('photos', photos)}
            minPhotos={photoReq.min}
            maxPhotos={photoReq.max}
            requiredViews={photoReq.required}
          />
          {errors.photos && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle size={12} />
              {errors.photos}
            </p>
          )}

          {/* YouTube embed */}
          <div className="pt-4 border-t border-gray-100 dark:border-white/10">
            <YouTubeInput
              value={form.videoUrl}
              onChange={url => set('videoUrl', url)}
            />
          </div>
        </div>
      )}

      {/* ── STEP: INSPECTION ─────────────────────────────── */}
      {currentStep === 'inspection' && (
        <div className="space-y-5">
          <div>
            <h2 className="mb-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              Inspection Availability
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Set when you're available for site visits. You can update this anytime from your dashboard.
            </p>
          </div>
          <InspectionAvailability
            value={form.inspection}
            onChange={val => set('inspection', val)}
          />
        </div>
      )}

      {/* ── STEP: PREVIEW ────────────────────────────────── */}
      {currentStep === 'preview' && (
        <div className="space-y-5">
          <div>
            <h2 className="mb-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              Review & Submit
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Check everything before publishing.
            </p>
          </div>

          {/* Summary card */}
          <div className="p-5 space-y-4 bg-white dark:bg-brand-charcoal-dark rounded-2xl shadow-card">
            {/* Cover photo */}
            {form.photos[0] && (
              <div className="overflow-hidden bg-gray-100 aspect-video rounded-xl dark:bg-white/10">
                <img src={form.photos[0].url} alt="Cover" className="object-cover w-full h-full" />
              </div>
            )}

            {/* Title + price */}
            <div>
              <h3 className="text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                {form.title || '(No title)'}
              </h3>
              <p className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                <MapPin size={13} className="text-brand-gold" />
                {[form.area, form.lga, form.state].filter(Boolean).join(', ') || '(No location set)'}
              </p>
              <p className="mt-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                {symbol}{form.price ? Number(form.price).toLocaleString() : '0'}
                <span className="ml-1 text-base font-normal text-gray-400">
                  / {periods.find(p => p.value === form.pricePeriod)?.label || ''}
                </span>
                {form.negotiable && <span className="ml-2 text-sm font-normal text-emerald-500">(Negotiable)</span>}
              </p>
            </div>

            {/* Key stats */}
            <div className="flex flex-wrap gap-3">
              {form.bedrooms  && <span className="tag bg-brand-gray-soft dark:bg-white/10 text-brand-charcoal dark:text-white">{form.bedrooms} bed</span>}
              {form.bathrooms && <span className="tag bg-brand-gray-soft dark:bg-white/10 text-brand-charcoal dark:text-white">{form.bathrooms} bath</span>}
              {form.areaSqm   && <span className="tag bg-brand-gray-soft dark:bg-white/10 text-brand-charcoal dark:text-white">{form.areaSqm} sqm</span>}
              {form.furnishing && <span className="capitalize tag bg-brand-gray-soft dark:bg-white/10 text-brand-charcoal dark:text-white">{FURNISHING_OPTIONS.find(o=>o.value===form.furnishing)?.label}</span>}
              {form.amenities.size > 0 && <span className="tag bg-brand-gold/10 text-brand-gold">{form.amenities.size} amenities</span>}
              {form.photos.length > 0  && <span className="text-blue-600 tag bg-blue-50 dark:bg-blue-500/10">{form.photos.length} photos</span>}
            </div>

            {/* Description preview */}
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400 font-body line-clamp-4">
              {form.description || '(No description)'}
            </p>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            {[
              { label: 'Title',       ok: form.title.length >= 10             },
              { label: 'Description', ok: form.description.length >= 50       },
              { label: 'Price',       ok: Number(form.price) > 0              },
              { label: 'Location',    ok: !!form.state && !!form.area         },
              { label: `Photos (min ${photoReq.min})`, ok: form.photos.length >= photoReq.min },
              { label: 'Details',     ok: category === 'land' ? !!form.landArea : !!form.bedrooms || !!form.areaSqm },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                {ok
                  ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  : <AlertCircle  size={16} className="text-amber-400 shrink-0" />
                }
                <span className={ok ? 'text-brand-charcoal-dark dark:text-white' : 'text-amber-600 dark:text-amber-400'}>
                  {label} {!ok && '— incomplete'}
                </span>
              </div>
            ))}
          </div>

          {/* Agreement */}
          <div className="p-4 bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              By submitting, you confirm this listing is accurate, you have the right to list this property, and you agree to Aurban's{' '}
              <a href="/legal/provider-agreement" className="font-semibold text-brand-gold hover:text-brand-gold-dark" target="_blank" rel="noopener noreferrer">
                Provider Agreement
              </a>
              {' '}including the 8% commission on all transactions.
            </p>
          </div>

          {errors.submit && (
            <p className="text-sm text-center text-red-500">{errors.submit}</p>
          )}
        </div>
      )}

      {/* ── Navigation footer ────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 flex items-center gap-3 px-4 py-4 mt-8 bg-white border-t border-gray-100 md:relative md:bottom-auto dark:bg-brand-charcoal-dark dark:border-white/10 md:border-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <button
          type="button"
          onClick={goBack}
          className="flex items-center gap-1.5 px-5 py-3 rounded-xl border-2 border-gray-200 dark:border-white/20
            text-sm font-semibold text-brand-charcoal dark:text-white
            hover:border-gray-300 transition-colors"
        >
          <ChevronLeft size={16} />
          Back
        </button>

        <button
          type="button"
          onClick={isPreview ? handleSubmit : goNext}
          disabled={submitting}
          className="flex items-center justify-center flex-1 gap-2 py-3 text-sm font-bold text-white transition-colors shadow-sm rounded-xl bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-60"
        >
          {submitting ? (
            <><span className="w-4 h-4 border-2 rounded-full border-white/40 border-t-white animate-spin" /> Submitting…</>
          ) : isPreview ? (
            <>Submit Listing <CheckCircle2 size={16} /></>
          ) : (
            <>Continue <ChevronRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}