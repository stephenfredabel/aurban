import { useState, useCallback } from 'react';
import { useNavigate }           from 'react-router-dom';
import { useAuth }               from '../../context/AuthContext.jsx';
import { useCurrency }           from '../../hooks/useCurrency.js';
import { sanitize }              from '../../utils/security.js';
import {
  CheckCircle2, ChevronLeft, ChevronRight,
  AlertCircle, ShieldCheck, Upload, Info,
  User, Eye, EyeOff,
} from 'lucide-react';
import PhotoUploader from '../../components/listings/PhotoUploader.jsx';
import { NIGERIA_STATES } from '../../data/listingOptions.js';

// ── Roommate specific options ────────────────────────────────
const OCCUPATION_OPTIONS = [
  'Employed (Full-time)', 'Employed (Part-time)', 'Self-Employed / Business Owner',
  'Freelancer / Remote Worker', 'Student', 'NYSC Corps Member',
  'Retired', 'Between Jobs',
];

const GENDER_PREFS = [
  { value: 'any',    label: 'Open to anyone',    icon: '👥' },
  { value: 'female', label: 'Female only',        icon: '♀️' },
  { value: 'male',   label: 'Male only',          icon: '♂️' },
  { value: 'couple', label: 'Couples welcome',    icon: '💑' },
];

const LIFESTYLE_OPTIONS = [
  { id: 'non_smoker',   label: 'Non-smoker',               icon: '🚭' },
  { id: 'non_drinker',  label: 'Non-drinker',              icon: '🍷' },
  { id: 'no_pets',      label: 'No pets',                  icon: '🐾' },
  { id: 'early_riser',  label: 'Early riser',              icon: '🌅' },
  { id: 'night_owl',    label: 'Night owl',                icon: '🦉' },
  { id: 'clean_freak',  label: 'Very neat / tidy',         icon: '🧹' },
  { id: 'quiet',        label: 'Quiet / Private',          icon: '🔇' },
  { id: 'social',       label: 'Social / Friendly',        icon: '😊' },
  { id: 'work_home',    label: 'Works from home',          icon: '💻' },
  { id: 'religious',    label: 'Religious household',      icon: '🙏' },
  { id: 'no_visitors',  label: 'No overnight visitors',    icon: '🚫' },
  { id: 'veg',          label: 'Vegetarian household',     icon: '🥗' },
];

const ROOM_TYPES = [
  { value: 'private',  label: 'Private Room',        desc: 'Your own room, shared common areas' },
  { value: 'shared',   label: 'Shared Room',         desc: 'Sharing a room with another person'  },
  { value: 'master',   label: 'Master Bedroom',      desc: 'Ensuite or larger private room'       },
  { value: 'selfcon',  label: 'Self-Contained',      desc: 'Private room with private bathroom'  },
];

const MIN_STAY_OPTIONS = [
  { value: '1m',  label: '1 Month'  },
  { value: '3m',  label: '3 Months' },
  { value: '6m',  label: '6 Months' },
  { value: '1y',  label: '1 Year'   },
  { value: 'flex',label: 'Flexible' },
];

// ── Steps ────────────────────────────────────────────────────
const STEPS = ['verify', 'room', 'about', 'lifestyle', 'photos', 'preview'];
const STEP_LABELS = {
  verify:    'Verification',
  room:      'Room',
  about:     'About You',
  lifestyle: 'Lifestyle',
  photos:    'Photos',
  preview:   'Preview',
};

function initForm() {
  return {
    // ID Gate
    idType:          '',
    idConfirmed:     false,
    employmentStatus:'',
    // Room
    roomType:        '',
    state:           '',
    area:            '',
    monthlyRent:     '',
    availableFrom:   '',
    minStay:         '',
    genderPref:      'any',
    // About poster
    displayName:     '',
    age:             '',
    bio:             '',
    occupation:      '',
    // Lifestyle
    lifestyle:       new Set(),
    houseRules:      '',
    // Photos
    photos:          [],
  };
}

function validateStep(step, form) {
  const e = {};
  if (step === 'verify') {
    if (!form.idType)         e.idType       = 'Select your ID type.';
    if (!form.idConfirmed)    e.idConfirmed  = 'You must confirm you have a valid government ID.';
    if (!form.employmentStatus) e.employmentStatus = 'Select your employment status.';
  }
  if (step === 'room') {
    if (!form.roomType)         e.roomType    = 'Select room type.';
    if (!form.state)            e.state       = 'Select a state.';
    if (!sanitize(form.area).trim()) e.area  = 'Enter the area / neighbourhood.';
    if (!form.monthlyRent || Number(form.monthlyRent) <= 0) e.monthlyRent = 'Enter monthly rent contribution.';
    if (!form.availableFrom)    e.availableFrom = 'Enter move-in date.';
  }
  if (step === 'about') {
    if (!sanitize(form.displayName).trim() || form.displayName.length < 2)
                                e.displayName = 'Enter your first name or display name.';
    if (!form.bio || form.bio.length < 100)
                                e.bio         = 'Bio must be at least 100 characters.';
    if (!form.occupation)       e.occupation  = 'Select your occupation.';
  }
  if (step === 'photos') {
    if (form.photos.length < 3) e.photos = 'Upload at least 3 photos of the room/space.';
  }
  return e;
}

// ─────────────────────────────────────────────────────────────
export default function RoommateListingForm({ onBack }) {
  const { user }   = useAuth();
  const { symbol } = useCurrency();
  const navigate   = useNavigate();

  const [stepIdx,    setStepIdx]   = useState(0);
  const [form,       setForm]      = useState(initForm);
  const [errors,     setErrors]    = useState({});
  const [submitting, setSubmitting]= useState(false);
  const [submitted,  setSubmitted] = useState(false);

  const currentStep = STEPS[stepIdx];
  const isPreview   = currentStep === 'preview';

  const set = useCallback((field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: null }));
  }, []);

  const toggleLifestyle = (id) => {
    setForm(f => {
      const next = new Set(f.lifestyle);
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...f, lifestyle: next };
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

  if (submitted) {
    return (
      <div className="max-w-lg px-4 py-16 mx-auto text-center">
        <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-emerald-50 rounded-3xl">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h1 className="mb-2 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">Roommate post submitted!</h1>
        <p className="mb-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          Our team will verify your identity (usually within 6 hours) and publish your listing. You'll get a notification when it goes live.
        </p>
        <div className="p-4 mb-8 border border-blue-100 bg-blue-50 dark:bg-blue-500/10 rounded-2xl dark:border-blue-500/20">
          <p className="mb-1 text-xs font-bold text-blue-800 dark:text-blue-300">🔒 Safety reminder</p>
          <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-400">
            All communication happens on Aurban — you never need to share your phone number or address until both parties agree. Report any suspicious behaviour immediately.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button onClick={() => navigate('/')} className="btn-primary">Back to Home</button>
          <button onClick={() => { setSubmitted(false); setForm(initForm()); setStepIdx(0); }} className="text-sm btn-ghost">Post another listing</button>
        </div>
      </div>
    );
  }

  const selectedRoomType = ROOM_TYPES.find(r => r.value === form.roomType);

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
        <div className="mt-2">
          <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">
            {STEP_LABELS[currentStep]}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          STEP 1 — VERIFICATION GATE
      ═══════════════════════════════════════════════════ */}
      {currentStep === 'verify' && (
        <div className="space-y-5">
          <div>
            <h2 className="mb-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
              Identity Verification Required
            </h2>
            <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              For the safety of everyone in our community, we require strict identity verification before any roommate listing can be posted.
            </p>
          </div>

          {/* Why we verify */}
          <div className="p-4 space-y-3 bg-brand-charcoal-dark rounded-2xl">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-brand-gold" />
              <p className="text-sm font-bold text-white">Why we verify</p>
            </div>
            {[
              'Protects posters and applicants from scams',
              'Prevents identity theft and fraudulent listings',
              'Creates accountability in shared living arrangements',
              'Your information is encrypted and never shown publicly',
            ].map(point => (
              <div key={point} className="flex items-start gap-2.5">
                <CheckCircle2 size={14} className="text-brand-gold mt-0.5 shrink-0" />
                <p className="text-xs leading-relaxed text-white/80">{point}</p>
              </div>
            ))}
          </div>

          {/* ID type */}
          <div>
            <label className="mb-2 label-sm">Government ID Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                "National ID (NIN)", "Voter's Card", "International Passport",
                "Driver's License", "Bank Verification Number (BVN)",
              ].map(id => (
                <button key={id} type="button" onClick={() => set('idType', id)}
                  className={[
                    'px-3 py-3 rounded-xl border-2 text-sm font-semibold text-left transition-all',
                    form.idType === id
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-white/70 hover:border-gray-300',
                  ].join(' ')}>
                  {id}
                </button>
              ))}
            </div>
            {errors.idType && <p className="mt-1 text-xs text-red-500">{errors.idType}</p>}
          </div>

          {/* Employment status */}
          <div>
            <label className="mb-2 label-sm">Employment / Occupation Status *</label>
            <div className="grid grid-cols-2 gap-2">
              {OCCUPATION_OPTIONS.map(occ => (
                <button key={occ} type="button" onClick={() => set('employmentStatus', occ)}
                  className={[
                    'px-3 py-2.5 rounded-xl border-2 text-sm font-semibold text-left transition-all',
                    form.employmentStatus === occ
                      ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-white/70 hover:border-gray-300',
                  ].join(' ')}>
                  {occ}
                </button>
              ))}
            </div>
            {errors.employmentStatus && <p className="mt-1 text-xs text-red-500">{errors.employmentStatus}</p>}
          </div>

          {/* ID upload note */}
          <div className="p-4 border border-blue-100 bg-blue-50 dark:bg-blue-500/10 rounded-2xl dark:border-blue-500/20">
            <div className="flex items-start gap-2">
              <Upload size={15} className="text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="mb-1 text-xs font-bold text-blue-800 dark:text-blue-300">ID Upload</p>
                <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-400">
                  After your listing is submitted, you'll be prompted in your dashboard to upload a photo of your selected ID. Your listing will not go live until ID is verified by our team (usually within 6 hours).
                </p>
              </div>
            </div>
          </div>

          {/* Confirm checkbox */}
          <div className={`p-4 rounded-2xl border-2 transition-all ${form.idConfirmed ? 'border-brand-gold bg-brand-gold/5' : 'border-gray-200 dark:border-white/10'}`}>
            <div className="flex items-start gap-3">
              <input type="checkbox" id="id-confirmed" checked={form.idConfirmed}
                onChange={e => set('idConfirmed', e.target.checked)}
                className="w-4 h-4 accent-brand-gold mt-0.5 shrink-0" />
              <label htmlFor="id-confirmed" className="text-sm leading-relaxed cursor-pointer text-brand-charcoal-dark dark:text-white">
                I confirm I have a valid {form.idType || 'government-issued ID'} and agree to upload it for verification. I understand my listing will not be published until identity is confirmed by Aurban's team.
              </label>
            </div>
            {errors.idConfirmed && <p className="mt-2 text-xs text-red-500">{errors.idConfirmed}</p>}
          </div>

          {/* Safety policy link */}
          <p className="text-xs leading-relaxed text-center text-gray-400 dark:text-white/40">
            Read our{' '}
            <a href="/legal/safety-policy" className="font-semibold text-brand-gold hover:text-brand-gold-dark" target="_blank" rel="noopener noreferrer">
              Community Safety Policy
            </a>
            {' '}to understand how we protect all members of our platform.
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          STEP 2 — ROOM DETAILS
      ═══════════════════════════════════════════════════ */}
      {currentStep === 'room' && (
        <div className="space-y-5">
          <div>
            <h2 className="mb-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">Room Details</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tell potential roommates about the space.</p>
          </div>

          {/* Room type */}
          <div>
            <label className="mb-2 label-sm">Room Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {ROOM_TYPES.map(({ value, label, desc }) => (
                <button key={value} type="button" onClick={() => set('roomType', value)}
                  className={[
                    'p-4 rounded-2xl border-2 text-left transition-all',
                    form.roomType === value
                      ? 'border-brand-gold bg-brand-gold/10'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-gray-300',
                  ].join(' ')}>
                  <p className={`text-sm font-bold mb-1 ${form.roomType === value ? 'text-brand-charcoal-dark dark:text-white' : 'text-gray-600 dark:text-white/70'}`}>{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </button>
              ))}
            </div>
            {errors.roomType && <p className="mt-1 text-xs text-red-500">{errors.roomType}</p>}
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="rm-state" className="label-sm mb-1.5">State *</label>
              <select id="rm-state" value={form.state} onChange={e => set('state', e.target.value)}
                className={`input-field ${errors.state ? 'border-red-400' : ''}`}>
                <option value="">Select state…</option>
                {NIGERIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state}</p>}
            </div>
            <div>
              <label htmlFor="rm-area" className="label-sm mb-1.5">Area / Neighbourhood *</label>
              <input id="rm-area" type="text" value={form.area}
                onChange={e => set('area', sanitize(e.target.value))}
                placeholder="e.g. Yaba, Wuse 2"
                className={`input-field ${errors.area ? 'border-red-400' : ''}`}
              />
              {errors.area && <p className="mt-1 text-xs text-red-500">{errors.area}</p>}
            </div>
          </div>

          {/* Rent + Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="rm-rent" className="label-sm mb-1.5">Monthly Rent ({symbol}) *</label>
              <div className="relative">
                <span className="absolute text-sm font-bold text-gray-400 -translate-y-1/2 pointer-events-none left-3 top-1/2">{symbol}</span>
                <input id="rm-rent" type="number" inputMode="numeric" min={0}
                  value={form.monthlyRent}
                  onChange={e => set('monthlyRent', e.target.value)}
                  placeholder="e.g. 45000"
                  className={`input-field pl-8 ${errors.monthlyRent ? 'border-red-400' : ''}`}
                />
              </div>
              {errors.monthlyRent && <p className="mt-1 text-xs text-red-500">{errors.monthlyRent}</p>}
            </div>
            <div>
              <label htmlFor="rm-avail" className="label-sm mb-1.5">Available From *</label>
              <input id="rm-avail" type="date"
                value={form.availableFrom}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => set('availableFrom', e.target.value)}
                className={`input-field ${errors.availableFrom ? 'border-red-400' : ''}`}
              />
              {errors.availableFrom && <p className="mt-1 text-xs text-red-500">{errors.availableFrom}</p>}
            </div>
          </div>

          {/* Min stay */}
          <div>
            <label className="mb-2 label-sm">Minimum Stay</label>
            <div className="flex flex-wrap gap-2">
              {MIN_STAY_OPTIONS.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => set('minStay', value)}
                  className={[
                    'px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all',
                    form.minStay === value
                      ? 'border-brand-gold bg-brand-gold text-white'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-500 dark:text-white/60 hover:border-gray-300',
                  ].join(' ')}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Gender preference */}
          <div>
            <label className="mb-2 label-sm">Gender Preference</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GENDER_PREFS.map(({ value, label, icon }) => (
                <button key={value} type="button" onClick={() => set('genderPref', value)}
                  className={[
                    'p-3 rounded-xl border-2 text-center transition-all',
                    form.genderPref === value
                      ? 'border-brand-gold bg-brand-gold/10'
                      : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-gray-300',
                  ].join(' ')}>
                  <span className="block mb-1 text-xl">{icon}</span>
                  <p className={`text-xs font-bold ${form.genderPref === value ? 'text-brand-charcoal-dark dark:text-white' : 'text-gray-500 dark:text-white/60'}`}>{label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          STEP 3 — ABOUT POSTER
      ═══════════════════════════════════════════════════ */}
      {currentStep === 'about' && (
        <div className="space-y-5">
          <div>
            <h2 className="mb-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">About You</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Help potential roommates understand who they'd be living with. Be genuine — the right match matters.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="rm-name" className="label-sm mb-1.5">Display Name *</label>
              <input id="rm-name" type="text" value={form.displayName}
                onChange={e => set('displayName', sanitize(e.target.value))}
                placeholder="First name or nickname"
                className={`input-field ${errors.displayName ? 'border-red-400' : ''}`}
              />
              {errors.displayName && <p className="mt-1 text-xs text-red-500">{errors.displayName}</p>}
            </div>
            <div>
              <label htmlFor="rm-age" className="label-sm mb-1.5">Age <span className="font-normal text-gray-400">(optional)</span></label>
              <input id="rm-age" type="number" inputMode="numeric" min={18} max={100}
                value={form.age}
                onChange={e => set('age', e.target.value)}
                placeholder="e.g. 27"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <label htmlFor="rm-occ" className="label-sm mb-1.5">Occupation *</label>
            <select id="rm-occ" value={form.occupation} onChange={e => set('occupation', e.target.value)}
              className={`input-field ${errors.occupation ? 'border-red-400' : ''}`}>
              <option value="">Select occupation…</option>
              {OCCUPATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {errors.occupation && <p className="mt-1 text-xs text-red-500">{errors.occupation}</p>}
          </div>

          <div>
            <label htmlFor="rm-bio" className="label-sm mb-1.5">
              About Me * <span className="font-normal text-gray-400">({form.bio.length}/800) — minimum 100</span>
            </label>
            <textarea id="rm-bio" rows={7}
              value={form.bio}
              onChange={e => set('bio', sanitize(e.target.value).slice(0, 800))}
              placeholder="Tell potential roommates about yourself — your routine, interests, work schedule, what you're looking for in a flatmate, how you keep shared spaces, and what makes you a great person to live with…"
              className={`input-field resize-none ${errors.bio ? 'border-red-400' : ''}`}
            />
            {errors.bio && <p className="mt-1 text-xs text-red-500">{errors.bio}</p>}
          </div>

          <div className="p-3 border border-blue-100 bg-blue-50 dark:bg-blue-500/10 rounded-xl dark:border-blue-500/20">
            <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
              <strong>Privacy:</strong> Your full name, address, phone number, and employer are never shown publicly. Only your display name, age (optional), occupation, and bio will be visible to other users.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          STEP 4 — LIFESTYLE & RULES
      ═══════════════════════════════════════════════════ */}
      {currentStep === 'lifestyle' && (
        <div className="space-y-5">
          <div>
            <h2 className="mb-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">Lifestyle & House Rules</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Select what applies to you and your home. Clear expectations prevent conflicts.</p>
          </div>

          <div>
            <p className="mb-3 label-sm">
              Lifestyle Indicators
              {form.lifestyle.size > 0 && <span className="ml-2 font-semibold text-brand-gold">{form.lifestyle.size} selected</span>}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LIFESTYLE_OPTIONS.map(({ id, label, icon }) => {
                const active = form.lifestyle.has(id);
                return (
                  <button key={id} type="button" onClick={() => toggleLifestyle(id)}
                    className={[
                      'flex items-center gap-2.5 px-3 py-3 rounded-xl border-2 text-left transition-all text-sm font-medium',
                      active
                        ? 'border-brand-gold bg-brand-gold/10 text-brand-charcoal-dark dark:text-white'
                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-600 dark:text-white/70 hover:border-gray-300',
                    ].join(' ')}>
                    <span className="text-base shrink-0">{icon}</span>
                    <span className="text-xs font-semibold">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="rm-rules" className="label-sm mb-1.5">Additional House Rules <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea id="rm-rules" rows={4}
              value={form.houseRules}
              onChange={e => set('houseRules', sanitize(e.target.value).slice(0, 500))}
              placeholder="e.g. Kitchen must be cleaned after every use. No loud music after 10pm. Shared bills split equally. Monthly cleaning rota…"
              className="resize-none input-field"
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          STEP 5 — PHOTOS
      ═══════════════════════════════════════════════════ */}
      {currentStep === 'photos' && (
        <div className="space-y-6">
          <div>
            <h2 className="mb-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">Room Photos</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Listings with real photos attract 5× more genuine inquiries. Show the actual space — no stock photos.
            </p>
          </div>
          <PhotoUploader
            photos={form.photos}
            onChange={photos => set('photos', photos)}
            minPhotos={3}
            maxPhotos={12}
            requiredViews={['The Room / Space', 'Bathroom', 'Kitchen or Common Area']}
          />
          {errors.photos && (
            <p className="text-xs text-red-500 flex items-center gap-1.5"><AlertCircle size={12} />{errors.photos}</p>
          )}
          <div className="p-3 border bg-amber-50 dark:bg-amber-500/10 rounded-xl border-amber-100 dark:border-amber-500/20">
            <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
              <strong>No profile photos</strong> in listings. Photos must show the room and common areas only. Personal photos, stock images, or images of other properties are not allowed and will cause your listing to be rejected.
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          STEP 6 — PREVIEW
      ═══════════════════════════════════════════════════ */}
      {currentStep === 'preview' && (
        <div className="space-y-5">
          <div>
            <h2 className="mb-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">Review & Submit</h2>
          </div>

          {/* Preview card */}
          <div className="overflow-hidden bg-white dark:bg-brand-charcoal-dark rounded-2xl shadow-card">
            {form.photos[0] && (
              <div className="aspect-video">
                <img src={form.photos[0].url} alt="Room cover" className="object-cover w-full h-full" />
              </div>
            )}
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="mb-1 text-xs font-bold tracking-wide uppercase text-brand-gold">Roommate Wanted</p>
                  <h3 className="text-lg font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                    {selectedRoomType?.label || 'Room'} in {form.area || '—'}, {form.state || '—'}
                  </h3>
                  <p className="mt-1 text-xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
                    {symbol}{form.monthlyRent ? Number(form.monthlyRent).toLocaleString() : '0'}
                    <span className="ml-1 text-sm font-normal text-gray-400">/ month</span>
                  </p>
                </div>
                {/* User avatar placeholder */}
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-gold/20 shrink-0">
                  <User size={22} className="text-brand-gold-dark" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {form.genderPref !== 'any' && <span className="capitalize tag bg-brand-gray-soft dark:bg-white/10 text-brand-charcoal dark:text-white">{GENDER_PREFS.find(g=>g.value===form.genderPref)?.label}</span>}
                {form.minStay && <span className="tag bg-brand-gray-soft dark:bg-white/10 text-brand-charcoal dark:text-white">Min {MIN_STAY_OPTIONS.find(s=>s.value===form.minStay)?.label}</span>}
                {form.availableFrom && <span className="tag bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600">From {new Date(form.availableFrom).toLocaleDateString('en-NG', { day:'numeric', month:'short', year:'numeric' })}</span>}
                {form.lifestyle.size > 0 && <span className="text-blue-600 tag bg-blue-50 dark:bg-blue-500/10">{form.lifestyle.size} lifestyle match{form.lifestyle.size !== 1 ? 'es' : ''}</span>}
              </div>

              {form.bio && (
                <p className="pt-3 text-sm leading-relaxed text-gray-600 border-t border-gray-100 dark:text-gray-400 line-clamp-4 dark:border-white/10">
                  "{form.bio}"
                </p>
              )}
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            {[
              { label: 'ID type selected',        ok: !!form.idType            },
              { label: 'ID verification agreed',  ok: form.idConfirmed         },
              { label: 'Employment status',        ok: !!form.employmentStatus  },
              { label: 'Room type & location',     ok: !!form.roomType && !!form.state && !!form.area },
              { label: 'Monthly rent',             ok: Number(form.monthlyRent) > 0 },
              { label: 'About me (min 100 chars)', ok: form.bio.length >= 100   },
              { label: 'Photos (min 3)',           ok: form.photos.length >= 3  },
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

          {/* Final safety + agreement */}
          <div className="p-4 space-y-3 bg-brand-charcoal-dark rounded-2xl">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-brand-gold" />
              <p className="text-sm font-bold text-white">Safety & Agreement</p>
            </div>
            <p className="text-xs leading-relaxed text-white/70">
              By submitting, you confirm all information is truthful. False information, impersonation, or misrepresentation is grounds for permanent account suspension. You agree to Aurban's{' '}
              <a href="/legal/community-guidelines" className="font-semibold text-brand-gold" target="_blank" rel="noopener noreferrer">Community Guidelines</a>
              {' '}and{' '}
              <a href="/legal/safety-policy" className="font-semibold text-brand-gold" target="_blank" rel="noopener noreferrer">Safety Policy</a>.
              Contact details are only exchanged after both parties agree through the platform.
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
            : isPreview ? <><ShieldCheck size={16} />Submit & Verify ID</>
            : <>Continue <ChevronRight size={16} /></>
          }
        </button>
      </div>
    </div>
  );
}