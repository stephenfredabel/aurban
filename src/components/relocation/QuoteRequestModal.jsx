import { useState, useCallback, useMemo } from 'react';
import {
  X, ChevronLeft, CheckCircle2, ArrowRight,
  MapPin, User, Phone, Mail, Package,
  Truck, Home, Building2, MessageSquare,
} from 'lucide-react';
import { useAuth }          from '../../context/AuthContext.jsx';
import { NIGERIAN_STATES }  from '../../context/PropertyContext.jsx';

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment', icon: Home      },
  { id: 'house',     label: 'House',     icon: Home      },
  { id: 'office',    label: 'Office',    icon: Building2 },
  { id: 'other',     label: 'Other',     icon: Package   },
];

const PROPERTY_SIZES = [
  { id: 'studio_1br', label: 'Studio / 1BR' },
  { id: '2_3br',      label: '2–3 Bedroom'  },
  { id: '4plus',      label: '4+ Bedroom'   },
  { id: 'large',      label: 'Large Office'  },
];

const ITEM_CATEGORIES = [
  'Furniture', 'Electronics', 'Appliances', 'Fragile Items',
  'Vehicles', 'Heavy Items (Piano, Safe)', 'Plants',
];

const STORAGE_DURATIONS = [
  { id: '1week',  label: '1 Week'   },
  { id: '1month', label: '1 Month'  },
  { id: '3month', label: '3 Months' },
];

const CONTACT_METHODS = [
  { id: 'phone',    label: 'Phone',    icon: Phone          },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare  },
  { id: 'email',    label: 'Email',    icon: Mail           },
];

const STEPS = [
  { id: 'move',    label: 'Move Details' },
  { id: 'items',   label: 'Items'        },
  { id: 'contact', label: 'Contact'      },
  { id: 'review',  label: 'Review'       },
];

// ─────────────────────────────────────────────────────────────
// WHATSAPP LINK
// ─────────────────────────────────────────────────────────────

function getWhatsAppLink(provider, form) {
  const msg = encodeURIComponent(
    `Hi ${provider.name}, I'd like to request a moving quote via Aurban!\n\n` +
    `📍 From: ${form.fromArea}, ${form.fromState}\n` +
    `📍 To: ${form.toArea}, ${form.toState}\n` +
    `📅 Date: ${form.moveDate}\n` +
    `🏠 ${form.propertyType} (${form.propertySize})\n\n` +
    `Name: ${form.name}\nPhone: ${form.phone}`
  );
  return `https://wa.me/?text=${msg}`;
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────

export default function QuoteRequestModal({ provider, onClose }) {
  const { user }       = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [quoteRef,   setQuoteRef]   = useState('');
  const [errors,     setErrors]     = useState({});

  const [form, setForm] = useState({
    // Move details
    fromState:    'Lagos',
    fromArea:     '',
    toState:      'Lagos',
    toArea:       '',
    moveDate:     '',
    propertyType: 'apartment',
    propertySize: 'studio_1br',
    // Items
    items:           [],
    needPacking:     false,
    needStorage:     false,
    storageDuration: '1month',
    specialRequirements: '',
    // Contact
    name:          user?.name  || '',
    phone:         user?.phone || '',
    email:         user?.email || '',
    contactMethod: 'phone',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleItem = (item) => {
    setForm(f => ({
      ...f,
      items: f.items.includes(item) ? f.items.filter(i => i !== item) : [...f.items, item],
    }));
  };

  // ── Validation ─────────────────────────────────────────────
  const validateMove = useCallback(() => {
    const e = {};
    if (!form.fromArea.trim()) e.fromArea = 'Required';
    if (!form.toArea.trim())   e.toArea   = 'Required';
    if (!form.moveDate)        e.moveDate = 'Pick a date';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  const validateContact = useCallback(() => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Name required';
    if (!form.phone.trim()) e.phone = 'Phone required';
    if (form.phone && !/^(\+?234|0)[7-9][01]\d{8}$/.test(form.phone.replace(/\s/g, '')))
      e.phone = 'Enter a valid Nigerian mobile number';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  // ── Navigation ────────────────────────────────────────────
  const next = useCallback(() => {
    if (step === 0 && !validateMove())    return;
    if (step === 2 && !validateContact()) return;
    setErrors({});
    setStep(s => s + 1);
  }, [step, validateMove, validateContact]);

  const back = useCallback(() => { setErrors({}); setStep(s => s - 1); }, []);

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    const ref = `AUR-MOVE-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    setQuoteRef(ref);
    setSubmitted(true);
    setSubmitting(false);
  }, []);

  // ── Progress bar ──────────────────────────────────────────
  const Progress = () => (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center flex-1 last:flex-none">
          <div className={`flex items-center gap-1.5 ${i <= step ? 'text-brand-gold' : 'text-gray-300 dark:text-white/20'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${i < step ? 'bg-brand-gold border-brand-gold text-white' : i === step ? 'border-brand-gold text-brand-gold bg-white dark:bg-brand-charcoal-dark' : 'border-gray-200 dark:border-white/20 text-gray-300 dark:text-white/20 bg-white dark:bg-brand-charcoal-dark'}`}>
              {i < step ? <CheckCircle2 size={13} /> : i + 1}
            </div>
            <span className={`text-[11px] font-bold hidden sm:inline ${i === step ? 'text-brand-charcoal-dark dark:text-white' : 'text-gray-400 dark:text-white/30'}`}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1.5 transition-all ${i < step ? 'bg-brand-gold' : 'bg-gray-100 dark:bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  );

  // ── Success screen ────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex flex-col items-center px-2 py-6 text-center">
        <div className="flex items-center justify-center w-20 h-20 mb-5 bg-emerald-100 dark:bg-emerald-500/20 rounded-3xl">
          <CheckCircle2 size={38} className="text-emerald-500" />
        </div>
        <h2 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
          Quote Request Sent!
        </h2>
        <p className="mb-1 text-sm text-gray-400">Quote reference</p>
        <p className="mb-5 font-mono text-xl font-extrabold tracking-widest text-brand-gold">{quoteRef}</p>

        <div className="w-full p-4 mb-5 space-y-3 text-left bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
          {[
            { icon: Truck,  label: 'Provider', value: provider.name },
            { icon: MapPin,  label: 'From',     value: `${form.fromArea}, ${form.fromState}` },
            { icon: MapPin,  label: 'To',       value: `${form.toArea}, ${form.toState}` },
            { icon: Home,    label: 'Date',     value: form.moveDate },
            { icon: Package, label: 'Type',     value: `${PROPERTY_TYPES.find(t => t.id === form.propertyType)?.label || form.propertyType} · ${PROPERTY_SIZES.find(s => s.id === form.propertySize)?.label || form.propertySize}` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-brand-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={13} className="text-brand-gold" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20 text-left w-full mb-5">
          <Truck size={14} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
            <strong>{provider.name}</strong> typically responds within <strong>{provider.responseTime || '24 hours'}</strong>. You'll receive their quote via {form.contactMethod}.
          </p>
        </div>

        <div className="flex w-full gap-3">
          <a href={getWhatsAppLink(provider, form)} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center flex-1 gap-2 py-3 text-sm font-bold border-2 border-gray-200 rounded-2xl dark:border-white/20 text-brand-charcoal dark:text-white hover:border-brand-gold/50 transition-colors">
            💬 WhatsApp
          </a>
          <button type="button" onClick={onClose}
            className="flex-1 py-3 text-sm font-bold text-white transition-colors rounded-2xl bg-brand-gold hover:bg-brand-gold-dark">
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Field helpers ──────────────────────────────────────────
  const fieldError = (key) => errors[key] ? <p className="mt-1 text-xs text-red-500">{errors[key]}</p> : null;

  // ── Minimum date (tomorrow) ────────────────────────────────
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {step > 0 && (
            <button type="button" onClick={back}
              className="flex items-center justify-center w-8 h-8 transition-colors rounded-xl hover:bg-brand-gray-soft dark:hover:bg-white/10 text-brand-charcoal dark:text-white">
              <ChevronLeft size={16} />
            </button>
          )}
          <div>
            <h2 className="text-lg font-extrabold leading-tight font-display text-brand-charcoal-dark dark:text-white">
              Request Quote
            </h2>
            <p className="text-xs text-gray-400 truncate max-w-[200px]">{provider.name}</p>
          </div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close"
            className="flex items-center justify-center w-8 h-8 transition-colors rounded-xl hover:bg-brand-gray-soft dark:hover:bg-white/10 text-brand-charcoal dark:text-white">
            <X size={16} />
          </button>
        )}
      </div>

      <Progress />

      {/* ── STEP 0: Move Details ──────────────────── */}
      {step === 0 && (
        <div className="space-y-5">
          {/* From */}
          <div>
            <label className="mb-2 label-sm">Moving From</label>
            <div className="grid grid-cols-2 gap-3">
              <select value={form.fromState} onChange={e => set('fromState', e.target.value)} className="input-field">
                {NIGERIAN_STATES.filter(s => s !== 'All States').map(s => <option key={s}>{s}</option>)}
              </select>
              <div>
                <input type="text" value={form.fromArea}
                  onChange={e => set('fromArea', e.target.value)}
                  placeholder="Area / Neighborhood"
                  className={`input-field ${errors.fromArea ? 'border-red-300' : ''}`} />
                {fieldError('fromArea')}
              </div>
            </div>
          </div>

          {/* To */}
          <div>
            <label className="mb-2 label-sm">Moving To</label>
            <div className="grid grid-cols-2 gap-3">
              <select value={form.toState} onChange={e => set('toState', e.target.value)} className="input-field">
                {NIGERIAN_STATES.filter(s => s !== 'All States').map(s => <option key={s}>{s}</option>)}
              </select>
              <div>
                <input type="text" value={form.toArea}
                  onChange={e => set('toArea', e.target.value)}
                  placeholder="Area / Neighborhood"
                  className={`input-field ${errors.toArea ? 'border-red-300' : ''}`} />
                {fieldError('toArea')}
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="mb-2 label-sm">Preferred Moving Date</label>
            <input type="date" value={form.moveDate} min={minDate}
              onChange={e => set('moveDate', e.target.value)}
              className={`input-field ${errors.moveDate ? 'border-red-300' : ''}`} />
            {fieldError('moveDate')}
          </div>

          {/* Property type */}
          <div>
            <label className="mb-2 label-sm">Property Type</label>
            <div className="grid grid-cols-4 gap-2">
              {PROPERTY_TYPES.map(({ id, label, icon: Icon }) => (
                <button key={id} type="button" onClick={() => set('propertyType', id)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all ${form.propertyType === id ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60'}`}>
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Property size */}
          <div>
            <label className="mb-2 label-sm">Property Size</label>
            <div className="grid grid-cols-2 gap-2">
              {PROPERTY_SIZES.map(({ id, label }) => (
                <button key={id} type="button" onClick={() => set('propertySize', id)}
                  className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${form.propertySize === id ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={next}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold text-sm rounded-2xl transition-colors">
            Continue <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* ── STEP 1: Items & Requirements ──────────── */}
      {step === 1 && (
        <div className="space-y-5">
          {/* Item categories */}
          <div>
            <label className="mb-2 label-sm">What are you moving?</label>
            <div className="grid grid-cols-2 gap-2">
              {ITEM_CATEGORIES.map(item => (
                <button key={item} type="button" onClick={() => toggleItem(item)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-xs font-bold text-left transition-all ${form.items.includes(item) ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60'}`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${form.items.includes(item) ? 'border-brand-gold bg-brand-gold' : 'border-gray-300 dark:border-white/20'}`}>
                    {form.items.includes(item) && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Packing service */}
          <div className="flex items-center gap-3 p-3.5 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
            <input type="checkbox" id="qr-packing" checked={form.needPacking}
              onChange={e => set('needPacking', e.target.checked)}
              className="w-4 h-4 accent-brand-gold" />
            <label htmlFor="qr-packing" className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-brand-charcoal-dark dark:text-white">
              <Package size={14} className="text-brand-gold" />
              I need packing service
            </label>
          </div>

          {/* Storage */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3.5 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
              <input type="checkbox" id="qr-storage" checked={form.needStorage}
                onChange={e => set('needStorage', e.target.checked)}
                className="w-4 h-4 accent-brand-gold" />
              <label htmlFor="qr-storage" className="text-sm font-semibold cursor-pointer text-brand-charcoal-dark dark:text-white">
                I need temporary storage
              </label>
            </div>
            {form.needStorage && (
              <div className="flex gap-2 pl-3">
                {STORAGE_DURATIONS.map(({ id, label }) => (
                  <button key={id} type="button" onClick={() => set('storageDuration', id)}
                    className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${form.storageDuration === id ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60'}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Special requirements */}
          <div>
            <label className="label-sm mb-1.5">Special Requirements <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea value={form.specialRequirements}
              onChange={e => set('specialRequirements', e.target.value)}
              placeholder="Narrow staircase, elevator access, fragile artwork, pets, etc."
              rows={3} maxLength={300}
              className="resize-none input-field" />
            {form.specialRequirements.length > 250 && (
              <p className="text-[11px] text-right text-amber-500 mt-0.5">{form.specialRequirements.length}/300</p>
            )}
          </div>

          <button type="button" onClick={next}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold text-sm rounded-2xl transition-colors">
            Continue <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* ── STEP 2: Contact Info ──────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="label-sm mb-1.5">Full Name *</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="text" value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Your full name"
                  className={`input-field pl-10 ${errors.name ? 'border-red-300 dark:border-red-500/50' : ''}`} />
              </div>
              {fieldError('name')}
            </div>

            {/* Phone */}
            <div>
              <label className="label-sm mb-1.5">Phone Number *</label>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="tel" inputMode="tel" value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="0801 234 5678"
                  className={`input-field pl-10 ${errors.phone ? 'border-red-300 dark:border-red-500/50' : ''}`} />
              </div>
              {fieldError('phone')}
            </div>

            {/* Email */}
            <div>
              <label className="label-sm mb-1.5">Email <span className="font-normal text-gray-400">(optional)</span></label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="email" value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="you@email.com"
                  className={`input-field pl-10 ${errors.email ? 'border-red-300 dark:border-red-500/50' : ''}`} />
              </div>
              {fieldError('email')}
            </div>

            {/* Preferred contact method */}
            <div>
              <label className="mb-2 label-sm">Preferred Contact Method</label>
              <div className="grid grid-cols-3 gap-2">
                {CONTACT_METHODS.map(({ id, label, icon: Icon }) => (
                  <button key={id} type="button" onClick={() => set('contactMethod', id)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all ${form.contactMethod === id ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60'}`}>
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button type="button" onClick={next}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold hover:bg-brand-gold-dark text-white font-bold text-sm rounded-2xl transition-colors">
            Review Quote Request <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* ── STEP 3: Review & Submit ───────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          {/* Summary card */}
          <div className="p-5 space-y-4 bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
            <p className="text-xs font-bold tracking-wider text-gray-400 uppercase">Quote Summary</p>
            {[
              { label: 'Provider',  value: provider.name },
              { label: 'From',      value: `${form.fromArea}, ${form.fromState}` },
              { label: 'To',        value: `${form.toArea}, ${form.toState}` },
              { label: 'Date',      value: form.moveDate },
              { label: 'Property',  value: `${PROPERTY_TYPES.find(t => t.id === form.propertyType)?.label} · ${PROPERTY_SIZES.find(s => s.id === form.propertySize)?.label}` },
              { label: 'Items',     value: form.items.length ? form.items.join(', ') : 'Not specified' },
              { label: 'Packing',   value: form.needPacking ? 'Yes' : 'No' },
              { label: 'Storage',   value: form.needStorage ? STORAGE_DURATIONS.find(d => d.id === form.storageDuration)?.label : 'No' },
              { label: 'Name',      value: form.name },
              { label: 'Phone',     value: form.phone },
              { label: 'Contact',   value: CONTACT_METHODS.find(c => c.id === form.contactMethod)?.label },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="text-xs font-bold text-gray-400 w-18 shrink-0">{label}</span>
                <span className="text-sm font-semibold text-right text-brand-charcoal-dark dark:text-white">{value}</span>
              </div>
            ))}
            {form.specialRequirements && (
              <div className="pt-3 border-t border-gray-200 dark:border-white/10">
                <p className="mb-1 text-xs font-bold text-gray-400">Special Requirements</p>
                <p className="text-xs text-gray-500 dark:text-white/60">{form.specialRequirements}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 p-3.5 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
            <Truck size={15} className="text-blue-500 shrink-0" />
            <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
              <strong>{provider.name}</strong> will review your request and send a detailed quote. No obligation until you accept.
            </p>
          </div>

          <button type="button" onClick={handleSubmit} disabled={submitting}
            className="flex items-center justify-center w-full gap-2 py-4 text-sm font-bold text-white transition-colors shadow-lg bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 rounded-2xl shadow-brand-gold/20">
            {submitting
              ? <><span className="w-4 h-4 border-2 rounded-full border-white/40 border-t-white animate-spin" /> Sending…</>
              : <><Truck size={16} /> Send Quote Request</>
            }
          </button>

          <p className="text-center text-[11px] text-gray-400 leading-relaxed">
            By submitting, you agree to Aurban's{' '}
            <a href="/terms" className="font-semibold text-brand-gold hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="/community-guidelines" className="font-semibold text-brand-gold hover:underline">Community Guidelines</a>.
          </p>
        </div>
      )}
    </div>
  );
}
