import { useState, useCallback } from 'react';
import { useNavigate }           from 'react-router-dom';
import { useTranslation }        from 'react-i18next';
import { useAuth }               from '../../context/AuthContext.jsx';
import { useCurrency }           from '../../hooks/useCurrency.js';
import { sanitize }              from '../../utils/security.js';
import {
  CheckCircle2, ChevronLeft, ChevronRight,
  AlertCircle, Info, MapPin, Plus, Trash2,
  Clock, Star, DollarSign,
} from 'lucide-react';
import PhotoUploader   from '../../components/listings/PhotoUploader.jsx';
import YouTubeInput    from '../../components/listings/YouTubeInput.jsx';
import {
  SERVICE_CATEGORIES, SERVICE_PRICING_MODES, EXPERIENCE_LEVELS,
  RESPONSE_TIMES, PROJECT_DURATIONS, WORK_DAYS, LOGISTICS_ZONES,
} from '../../data/serviceOptions.js';
import { NIGERIA_STATES } from '../../data/listingOptions.js';

// ── Steps ────────────────────────────────────────────────────
const STEPS = ['category', 'details', 'pricing', 'logistics', 'availability', 'portfolio', 'preview'];

const STEP_LABELS = {
  category:     'Category',
  details:      'Details',
  pricing:      'Pricing',
  logistics:    'Logistics',
  availability: 'Availability',
  portfolio:    'Portfolio',
  preview:      'Preview',
};

// ── Initial state ────────────────────────────────────────────
function initForm() {
  return {
    category:          '',
    subcategory:       '',
    title:             '',
    description:       '',
    experience:        '',
    responseTime:      '24h',
    projectDuration:   '',
    pricingMode:       'per_job',
    basePrice:         '',
    negotiable:        false,
    // Rate card rows  [{ service, price, unit, duration }]
    rateCard:          [{ id: 1, service: '', price: '', unit: 'per_job', duration: '' }],
    // Service area
    country:           'NG',
    state:             '',
    coverageNotes:     '',
    // Logistics
    logisticsEnabled:  true,
    logisticsRadius:   '40',
    logisticsBase:     '',
    logisticsPerKm:    '',
    logisticsNegotiable: true,
    // Availability
    workDays:          new Set(['monday','tuesday','wednesday','thursday','friday']),
    workHoursFrom:     '08:00',
    workHoursTo:       '18:00',
    emergencyAvailable: false,
    // Portfolio
    photos:            [],
    videoUrl:          '',
    // Certs
    hasCertification:  false,
    certNotes:         '',
  };
}

// ── Validation ───────────────────────────────────────────────
function validateStep(step, form) {
  const e = {};
  if (step === 'category') {
    if (!form.category)     e.category    = 'Select a service category.';
    if (!form.subcategory)  e.subcategory = 'Select a subcategory.';
  }
  if (step === 'details') {
    if (!sanitize(form.title).trim() || form.title.length < 10)
                            e.title       = 'Title must be at least 10 characters.';
    if (form.description.length < 80)
                            e.description = 'Description must be at least 80 characters.';
    if (!form.experience)   e.experience  = 'Select your experience level.';
  }
  if (step === 'pricing') {
    if (form.pricingMode !== 'quote' && (!form.basePrice || Number(form.basePrice) <= 0))
                            e.basePrice   = 'Enter a starting price.';
  }
  if (step === 'logistics') {
    if (form.logisticsEnabled) {
      if (!form.logisticsBase || Number(form.logisticsBase) < 0)
                            e.logisticsBase  = 'Enter a base logistics fee (can be 0).';
      if (!form.logisticsPerKm || Number(form.logisticsPerKm) < 0)
                            e.logisticsPerKm = 'Enter fee per km (can be 0).';
    }
  }
  if (step === 'portfolio') {
    if (form.photos.length < 3)
                            e.photos = 'Upload at least 3 portfolio photos.';
  }
  return e;
}

// ─────────────────────────────────────────────────────────────
export default function ServiceListingForm({ onBack }) {
  const { t }          = useTranslation();
  const { user }       = useAuth();
  const { symbol }     = useCurrency();
  const navigate       = useNavigate();

  const [stepIdx, setStepIdx] = useState(0);
  const [form, setForm]       = useState(initForm);
  const [errors, setErrors]   = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);

  const currentStep = STEPS[stepIdx];
  const isPreview   = currentStep === 'preview';

  const set = useCallback((field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: null }));
  }, []);

  const toggleWorkDay = (day) => {
    setForm(f => {
      const next = new Set(f.workDays);
      next.has(day) ? next.delete(day) : next.add(day);
      return { ...f, workDays: next };
    });
  };

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

  // Rate card helpers
  const addRateRow = () => {
    setForm(f => ({
      ...f,
      rateCard: [...f.rateCard, { id: Date.now(), service: '', price: '', unit: 'per_job', duration: '' }],
    }));
  };
  const updateRateRow = (id, field, value) => {
    setForm(f => ({
      ...f,
      rateCard: f.rateCard.map(r => r.id === id ? { ...r, [field]: value } : r),
    }));
  };
  const removeRateRow = (id) => {
    setForm(f => ({ ...f, rateCard: f.rateCard.filter(r => r.id !== id) }));
  };

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

  const selectedCat = SERVICE_CATEGORIES.find(c => c.value === form.category);

  // ── Success ─────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h1 className="font-display font-extrabold text-brand-charcoal-dark dark:text-white text-2xl mb-2">Service listing submitted!</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          Your service profile is under review and will be live within 2 hours. Manage it from your Provider Dashboard.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button onClick={() => navigate('/provider')} className="btn-primary">Go to Dashboard</button>
          <button onClick={() => { setSubmitted(false); setForm(initForm()); setStepIdx(0); }} className="btn-ghost text-sm">List another service</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 lg:pb-10">

      {/* ── Progress ────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={goBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-brand-charcoal dark:text-white/70 hover:text-brand-charcoal-dark dark:hover:text-white transition-colors">
            <ChevronLeft size={16} />
            {stepIdx === 0 ? 'Back' : 'Back'}
          </button>
          <span className="text-xs font-semibold text-gray-400">Step {stepIdx + 1} of {STEPS.length}</span>
        </div>
        <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-brand-gold rounded-full transition-all duration-300"
            style={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between">
          {STEPS.map((s, i) => (
            <span key={s} className={`text-[11px] font-semibold ${i <= stepIdx ? 'text-brand-gold' : 'text-gray-300 dark:text-white/20'}`}>
              {i < stepIdx && '✓ '}{STEP_LABELS[s]}
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          STEP 1 — CATEGORY
      ═══════════════════════════════════════════════════ */}
      {currentStep === 'category' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-display font-extrabold text-brand-charcoal-dark dark:text-white mb-1">What service do you offer?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Choose the category that best fits your primary service.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SERVICE_CATEGORIES.map(({ value, label, icon, desc }) => (
              <button key={value} type="button" onClick={() => { set('category', value); set('subcategory', ''); }}
                className={[
                  'group p-4 rounded-2xl border-2 text-left transition-all',
                  form.category === value
                    ? 'border-brand-gold bg-brand-gold/10'
                    : 'border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 hover:border-brand-gold/50',
                ].join(' ')}>
                <span className="text-2xl block mb-2">{icon}</span>
                <p className={`text-sm font-bold ${form.category === value ? 'text-brand-gold' : 'text-brand-charcoal-dark dark:text-white'}`}>{label}</p>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{desc}</p>
              </button>
            ))}
          </div>
          {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}

          {/* Subcategory */}
          {form.category && (
            <div className="animate-fade-in">
              <label className="label-sm mb-2">Subcategory / Specialisation *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedCat?.subcategories.map(sub => (
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
              {errors.subcategory && <p className="text-xs text-red-500 mt-1">{errors.subcategory}</p>}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          STEP 2 — DETAILS
      ═══════════════════════════════════════════════════ */}
      {currentStep === 'details' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-display font-extrabold text-brand-charcoal-dark dark:text-white mb-1">About Your Service</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tell potential clients what makes you the right choice.</p>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="svc-title" className="label-sm mb-1.5">
              Service Title * <span className="text-gray-400 font-normal">({form.title.length}/100)</span>
            </label>
            <input id="svc-title" type="text"
              value={form.title}
              onChange={e => set('title', sanitize(e.target.value).slice(0, 100))}
              placeholder={`e.g. Professional ${selectedCat?.label || 'Plumbing'} Services in Lagos`}
              className={`input-field ${errors.title ? 'border-red-400' : ''}`}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="svc-desc" className="label-sm mb-1.5">
              Description * <span className="text-gray-400 font-normal">({form.description.length}/2000)</span>
            </label>
            <textarea id="svc-desc" rows={6}
              value={form.description}
              onChange={e => set('description', sanitize(e.target.value).slice(0, 2000))}
              placeholder="Describe your service in detail — your experience, tools used, what's included, what clients can expect, your past work, guarantees offered…"
              className={`input-field resize-none ${errors.description ? 'border-red-400' : ''}`}
            />
            <p className="text-xs text-gray-400 mt-1">Minimum 80 characters. Be specific — clients compare multiple providers.</p>
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Experience */}
            <div>
              <label htmlFor="svc-exp" className="label-sm mb-1.5">Years of Experience *</label>
              <select id="svc-exp" value={form.experience} onChange={e => set('experience', e.target.value)}
                className={`input-field ${errors.experience ? 'border-red-400' : ''}`}>
                <option value="">Select level…</option>
                {EXPERIENCE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
              {errors.experience && <p className="text-xs text-red-500 mt-1">{errors.experience}</p>}
            </div>

            {/* Response time */}
            <div>
              <label htmlFor="svc-resp" className="label-sm mb-1.5">Typical Response Time</label>
              <select id="svc-resp" value={form.responseTime} onChange={e => set('responseTime', e.target.value)}
                className="input-field">
                {RESPONSE_TIMES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {/* Project duration */}
            <div>
              <label htmlFor="svc-dur" className="label-sm mb-1.5">Typical Project Duration</label>
              <select id="svc-dur" value={form.projectDuration} onChange={e => set('projectDuration', e.target.value)}
                className="input-field">
                <option value="">Select…</option>
                {PROJECT_DURATIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>

            {/* Location / state */}
            <div>
              <label htmlFor="svc-state" className="label-sm mb-1.5">State (Primary Location)</label>
              <select id="svc-state" value={form.state} onChange={e => set('state', e.target.value)}
                className="input-field">
                <option value="">Select state…</option>
                {NIGERIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Coverage notes */}
          <div>
            <label htmlFor="svc-coverage" className="label-sm mb-1.5">Coverage Area Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <input id="svc-coverage" type="text"
              value={form.coverageNotes}
              onChange={e => set('coverageNotes', sanitize(e.target.value))}
              placeholder="e.g. Primarily Lagos Island and Lekki — can travel to Abuja with advance notice"
              className="input-field"
            />
          </div>

          {/* Certification */}
          <div className="p-4 bg-brand-gray-soft dark:bg-white/5 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="has-cert" checked={form.hasCertification}
                onChange={e => set('hasCertification', e.target.checked)}
                className="w-4 h-4 accent-brand-gold" />
              <label htmlFor="has-cert" className="text-sm font-semibold text-brand-charcoal-dark dark:text-white cursor-pointer">
                I have professional certifications / licenses
              </label>
            </div>
            {form.hasCertification && (
              <input type="text"
                value={form.certNotes}
                onChange={e => set('certNotes', sanitize(e.target.value))}
                placeholder="e.g. COREN registered, NIOB member, NSE Fellow, SON certification…"
                className="input-field"
              />
            )}
            <p className="text-xs text-gray-400">Upload certificates in your Provider Dashboard after listing is live. Verified certifications earn a badge.</p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          STEP 3 — PRICING
      ═══════════════════════════════════════════════════ */}
      {currentStep === 'pricing' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-display font-extrabold text-brand-charcoal-dark dark:text-white mb-1">Pricing</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Set your rates clearly. End users will see exactly what they pay before booking.
            </p>
          </div>

          {/* Pricing mode */}
          <div>
            <label className="label-sm mb-2">How do you charge? *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SERVICE_PRICING_MODES.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => set('pricingMode', value)}
                  className={[
                    'px-4 py-3 rounded-xl border-2 text-sm font-semibold text-left transition-all',
                    form.pricingMode === value
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60 hover:border-gray-300',
                  ].join(' ')}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Starting / base price */}
          {form.pricingMode !== 'quote' && (
            <div>
              <label htmlFor="base-price" className="label-sm mb-1.5">
                Starting Price ({symbol}) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none">{symbol}</span>
                <input id="base-price" type="number" inputMode="numeric" min={0}
                  value={form.basePrice}
                  onChange={e => set('basePrice', e.target.value)}
                  placeholder="0"
                  className={`input-field pl-8 ${errors.basePrice ? 'border-red-400' : ''}`}
                />
              </div>
              {errors.basePrice && <p className="text-xs text-red-500 mt-1">{errors.basePrice}</p>}

              <div className="flex items-center gap-3 mt-3 p-3 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
                <input type="checkbox" id="negotiable" checked={form.negotiable}
                  onChange={e => set('negotiable', e.target.checked)}
                  className="w-4 h-4 accent-brand-gold" />
                <label htmlFor="negotiable" className="text-sm font-medium text-brand-charcoal dark:text-white/80 cursor-pointer">
                  Price is negotiable
                </label>
              </div>
            </div>
          )}

          {form.pricingMode === 'quote' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
              <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">Custom quote mode</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                Clients will request a quote from you. You negotiate a price in-platform before they book and pay. Great for complex or project-based work.
              </p>
            </div>
          )}

          {/* Rate card */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label-sm">Rate Card <span className="text-gray-400 font-normal">(detailed breakdown per service type)</span></label>
              <button type="button" onClick={addRateRow}
                className="flex items-center gap-1.5 text-xs font-bold text-brand-gold hover:text-brand-gold-dark transition-colors">
                <Plus size={13} /> Add row
              </button>
            </div>
            <div className="space-y-2">
              {form.rateCard.map((row, idx) => (
                <div key={row.id} className="grid grid-cols-[1fr_120px_110px_36px] gap-2 items-start">
                  <input type="text"
                    value={row.service}
                    onChange={e => updateRateRow(row.id, 'service', sanitize(e.target.value))}
                    placeholder={`Service ${idx + 1} (e.g. Basic pipe repair)`}
                    className="input-field text-sm py-2.5"
                  />
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">{symbol}</span>
                    <input type="number" inputMode="numeric" min={0}
                      value={row.price}
                      onChange={e => updateRateRow(row.id, 'price', e.target.value)}
                      placeholder="Price"
                      className="input-field pl-6 text-sm py-2.5"
                    />
                  </div>
                  <select
                    value={row.unit}
                    onChange={e => updateRateRow(row.id, 'unit', e.target.value)}
                    className="input-field text-sm py-2.5 px-2">
                    {SERVICE_PRICING_MODES.slice(0, 4).map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => removeRateRow(row.id)}
                    disabled={form.rateCard.length === 1}
                    aria-label="Remove row"
                    className="w-9 h-9 mt-0.5 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-30">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Add up to 8 service types with individual prices. Clients see this on your profile.</p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          STEP 4 — LOGISTICS
      ═══════════════════════════════════════════════════ */}
      {currentStep === 'logistics' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-display font-extrabold text-brand-charcoal-dark dark:text-white mb-1">Logistics & Travel</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              How far will you travel? Will you charge for travel? The platform calculates this automatically based on distance.
            </p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
            <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">📍 How logistics works on Aurban</p>
            <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
              When a client books you, we calculate the road distance between your base and their location using Google Maps. Your logistics fee is calculated automatically as: <strong>Base fee + (distance × per-km rate)</strong>. The logistics fee is released to you immediately once the client confirms you've arrived.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex items-center gap-3 p-4 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
            <input type="checkbox" id="log-enabled" checked={form.logisticsEnabled}
              onChange={e => set('logisticsEnabled', e.target.checked)}
              className="w-4 h-4 accent-brand-gold" />
            <div>
              <label htmlFor="log-enabled" className="text-sm font-bold text-brand-charcoal-dark dark:text-white cursor-pointer">
                I charge a logistics / travel fee
              </label>
              <p className="text-xs text-gray-400 mt-0.5">Uncheck if you include travel in your service price or work only from a fixed location.</p>
            </div>
          </div>

          {form.logisticsEnabled && (
            <div className="space-y-4 animate-fade-in">
              {/* Service radius */}
              <div>
                <label className="label-sm mb-2">Maximum travel distance</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {LOGISTICS_ZONES.map(({ value, label }) => (
                    <button key={value} type="button" onClick={() => set('logisticsRadius', value)}
                      className={[
                        'px-3 py-2 rounded-xl border-2 text-xs font-bold text-center transition-all',
                        form.logisticsRadius === value
                          ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                          : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60 hover:border-gray-300',
                      ].join(' ')}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fees */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="log-base" className="label-sm mb-1.5">Base fee ({symbol}) *</label>
                  <p className="text-xs text-gray-400 mb-1.5">Charged regardless of distance (can be 0)</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none">{symbol}</span>
                    <input id="log-base" type="number" inputMode="numeric" min={0}
                      value={form.logisticsBase}
                      onChange={e => set('logisticsBase', e.target.value)}
                      placeholder="e.g. 1000"
                      className={`input-field pl-8 ${errors.logisticsBase ? 'border-red-400' : ''}`}
                    />
                  </div>
                  {errors.logisticsBase && <p className="text-xs text-red-500 mt-1">{errors.logisticsBase}</p>}
                </div>
                <div>
                  <label htmlFor="log-perkm" className="label-sm mb-1.5">Per km ({symbol}/km) *</label>
                  <p className="text-xs text-gray-400 mb-1.5">Added for each km beyond base zone</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none">{symbol}</span>
                    <input id="log-perkm" type="number" inputMode="numeric" min={0}
                      value={form.logisticsPerKm}
                      onChange={e => set('logisticsPerKm', e.target.value)}
                      placeholder="e.g. 100"
                      className={`input-field pl-8 ${errors.logisticsPerKm ? 'border-red-400' : ''}`}
                    />
                  </div>
                  {errors.logisticsPerKm && <p className="text-xs text-red-500 mt-1">{errors.logisticsPerKm}</p>}
                </div>
              </div>

              {/* Example */}
              {form.logisticsBase && form.logisticsPerKm && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20">
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">Example calculation</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    Client 25km away: {symbol}{Number(form.logisticsBase).toLocaleString()} + (25 × {symbol}{Number(form.logisticsPerKm).toLocaleString()}) = {symbol}{(Number(form.logisticsBase) + 25 * Number(form.logisticsPerKm)).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Negotiable toggle */}
              <div className="flex items-center gap-3 p-3 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
                <input type="checkbox" id="log-neg" checked={form.logisticsNegotiable}
                  onChange={e => set('logisticsNegotiable', e.target.checked)}
                  className="w-4 h-4 accent-brand-gold" />
                <div>
                  <label htmlFor="log-neg" className="text-sm font-semibold text-brand-charcoal-dark dark:text-white cursor-pointer">
                    Logistics fee is negotiable
                  </label>
                  <p className="text-xs text-gray-400 mt-0.5">Client can propose an alternative logistics fee before booking</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          STEP 5 — AVAILABILITY
      ═══════════════════════════════════════════════════ */}
      {currentStep === 'availability' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-display font-extrabold text-brand-charcoal-dark dark:text-white mb-1">Working Hours</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              When are you available to accept and complete jobs?
            </p>
          </div>

          {/* Day toggles */}
          <div>
            <label className="label-sm mb-3">Available days</label>
            <div className="flex flex-wrap gap-2">
              {WORK_DAYS.map(({ key, label }) => {
                const active = form.workDays.has(key);
                return (
                  <button key={key} type="button" onClick={() => toggleWorkDay(key)}
                    className={[
                      'px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all',
                      active
                        ? 'border-brand-gold bg-brand-gold text-white'
                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60 hover:border-gray-300',
                    ].join(' ')}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hours */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'wh-from', label: 'Work starts', field: 'workHoursFrom' },
              { id: 'wh-to',   label: 'Work ends',   field: 'workHoursTo'   },
            ].map(({ id, label, field }) => (
              <div key={id}>
                <label htmlFor={id} className="label-sm mb-1.5">{label}</label>
                <input id={id} type="time"
                  value={form[field]}
                  onChange={e => set(field, e.target.value)}
                  className="input-field"
                />
              </div>
            ))}
          </div>

          {/* Emergency availability */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-100 dark:border-amber-500/20">
            <input type="checkbox" id="emergency" checked={form.emergencyAvailable}
              onChange={e => set('emergencyAvailable', e.target.checked)}
              className="w-4 h-4 accent-brand-gold mt-0.5" />
            <div>
              <label htmlFor="emergency" className="text-sm font-bold text-amber-800 dark:text-amber-300 cursor-pointer">
                ⚡ I am available for emergency calls
              </label>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                Emergency jobs are typically outside regular hours (nights, weekends). Listing this increases your visibility significantly. You can charge an emergency surcharge per job.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          STEP 6 — PORTFOLIO
      ═══════════════════════════════════════════════════ */}
      {currentStep === 'portfolio' && (
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-display font-extrabold text-brand-charcoal-dark dark:text-white mb-1">Portfolio & Work Samples</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Show clients what you can do. Before/after photos work especially well.
            </p>
          </div>

          <PhotoUploader
            photos={form.photos}
            onChange={photos => set('photos', photos)}
            minPhotos={3}
            maxPhotos={15}
            requiredViews={['Completed project 1', 'Completed project 2', 'In progress or materials used']}
          />
          {errors.photos && (
            <p className="text-xs text-red-500 flex items-center gap-1.5">
              <AlertCircle size={12} />{errors.photos}
            </p>
          )}

          <div className="pt-4 border-t border-gray-100 dark:border-white/10">
            <YouTubeInput value={form.videoUrl} onChange={url => set('videoUrl', url)} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          STEP 7 — PREVIEW
      ═══════════════════════════════════════════════════ */}
      {currentStep === 'preview' && (
        <div className="space-y-5">
          <div>
            <h2 className="text-xl font-display font-extrabold text-brand-charcoal-dark dark:text-white mb-1">Review & Submit</h2>
          </div>

          <div className="bg-white dark:bg-brand-charcoal-dark rounded-2xl shadow-card p-5 space-y-4">
            {form.photos[0] && (
              <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-white/10">
                <img src={