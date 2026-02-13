import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home, Briefcase, ShoppingBag, Wrench, ArrowLeft, ArrowRight,
  CheckCircle2, Upload, Eye, EyeOff, Phone, Mail, MapPin,
  User, Building2, FileText, Shield, ChevronLeft,
} from 'lucide-react';
import { sanitize } from '../utils/security.js';

/* ════════════════════════════════════════════════════════════
   REGISTER HOST — Provider onboarding wizard
   
   4 steps:
   1. Choose Role (Host / Agent / Seller / Service Provider)
   2. Personal + Business Info
   3. Document Upload
   4. Review + Submit
════════════════════════════════════════════════════════════ */

const ROLES = [
  { id: 'host',    label: 'Host',             desc: 'List your properties for rent, lease, or shortlet', icon: Home,        color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600' },
  { id: 'agent',   label: 'Agent',            desc: 'Represent property owners and help buyers/renters',  icon: Briefcase,   color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600' },
  { id: 'seller',  label: 'Seller',           desc: 'Sell building materials, furniture, and fixtures',   icon: ShoppingBag, color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' },
  { id: 'service', label: 'Service Provider', desc: 'Offer plumbing, electrical, cleaning, legal services', icon: Wrench,   color: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600' },
];

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta',
  'Ebonyi','Edo','Ekiti','Enugu','FCT-Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina',
  'Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers',
  'Sokoto','Taraba','Yobe','Zamfara',
];

export default function RegisterHost() {
  const navigate = useNavigate();
  const [step, setStep]   = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const [form, setForm] = useState({
    role: '',
    firstName: '', lastName: '', email: '', phone: '', password: '',
    businessName: '', businessAddress: '', state: 'Lagos', city: '',
    bio: '',
    idType: 'nin', idNumber: '', cacNumber: '', agreeTerms: false,
  });

  useEffect(() => { document.title = 'Become a Provider — Aurban'; }, []);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: sanitize(val) }));

  const canProceed = () => {
    if (step === 1) return !!form.role;
    if (step === 2) return form.firstName && form.lastName && form.email && form.phone && form.password?.length >= 8 && form.state;
    if (step === 3) return form.idNumber;
    if (step === 4) return form.agreeTerms;
    return false;
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;
    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    setSubmitted(true);
  };

  /* ── Success screen ──────────────────────────────────────── */
  if (submitted) return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-white dark:bg-gray-950">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold font-display text-brand-charcoal-dark dark:text-white">Application Submitted!</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          We'll review your application within 24–48 hours. You'll receive an email at <strong>{form.email}</strong> once approved.
        </p>
        <Link to="/login" className="inline-flex items-center gap-2 text-sm btn-primary">
          Go to Login
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 dark:bg-gray-900 dark:border-white/10">
        <div className="flex items-center justify-between max-w-2xl px-4 mx-auto h-14">
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400">
            <ChevronLeft size={18} /> Back to Aurban
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg w-7 h-7 bg-brand-gold">
              <span className="text-xs font-black text-white font-display">A</span>
            </div>
            <span className="hidden text-sm font-bold font-display text-brand-charcoal-dark dark:text-white sm:block">Become a Provider</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl px-4 py-8 mx-auto">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {[1,2,3,4].map(s => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${s <= step ? 'bg-brand-gold' : 'bg-gray-200 dark:bg-white/10'}`} />
              <p className={`text-[9px] mt-1 font-semibold ${s <= step ? 'text-brand-gold' : 'text-gray-400'}`}>
                {s === 1 ? 'Role' : s === 2 ? 'Info' : s === 3 ? 'Docs' : 'Review'}
              </p>
            </div>
          ))}
        </div>

        {/* ══ STEP 1: Choose Role ═══════════════════════════ */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">What type of provider are you?</h2>
              <p className="mt-1 text-sm text-gray-400">Choose the role that best describes your business</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ROLES.map(role => (
                <button key={role.id} onClick={() => update('role', role.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${form.role === role.id
                    ? 'border-brand-gold bg-brand-gold/5 shadow-sm'
                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${role.color}`}>
                    <role.icon size={20} />
                  </div>
                  <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">{role.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{role.desc}</p>
                  {form.role === role.id && <CheckCircle2 size={16} className="mt-2 text-brand-gold" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ══ STEP 2: Personal + Business Info ══════════════ */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">Your Information</h2>
              <p className="mt-1 text-sm text-gray-400">Tell us about yourself and your business</p>
            </div>

            {/* Personal */}
            <div className="p-5 space-y-3 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
              <h3 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Personal Details</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">First Name *</label>
                  <input type="text" value={form.firstName} onChange={e => update('firstName', e.target.value)}
                    className="input-field text-sm py-2.5" placeholder="First name" maxLength={50} />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Last Name *</label>
                  <input type="text" value={form.lastName} onChange={e => update('lastName', e.target.value)}
                    className="input-field text-sm py-2.5" placeholder="Last name" maxLength={50} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Email *</label>
                <div className="relative">
                  <Mail size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  <input type="email" value={form.email} onChange={e => update('email', e.target.value)}
                    className="input-field text-sm py-2.5 pl-9" placeholder="you@example.com" maxLength={120} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Phone *</label>
                <div className="relative">
                  <Phone size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                    className="input-field text-sm py-2.5 pl-9" placeholder="+234 801 234 5678" maxLength={20} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Password *</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => update('password', e.target.value)}
                    className="input-field text-sm py-2.5 pr-10" placeholder="Min 8 characters" maxLength={64} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute text-gray-400 -translate-y-1/2 right-3 top-1/2">
                    {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {form.password && form.password.length < 8 && (
                  <p className="text-[10px] text-red-400 mt-0.5">Password must be at least 8 characters</p>
                )}
              </div>
            </div>

            {/* Business */}
            <div className="p-5 space-y-3 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
              <h3 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">Business Details (Optional)</h3>
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Business Name</label>
                <div className="relative">
                  <Building2 size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
                  <input type="text" value={form.businessName} onChange={e => update('businessName', e.target.value)}
                    className="input-field text-sm py-2.5 pl-9" placeholder="Your company name" maxLength={100} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">State *</label>
                  <select value={form.state} onChange={e => update('state', e.target.value)} className="input-field text-sm py-2.5">
                    {NIGERIAN_STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">City</label>
                  <input type="text" value={form.city} onChange={e => update('city', e.target.value)}
                    className="input-field text-sm py-2.5" placeholder="City" maxLength={50} />
                </div>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">Short Bio</label>
                <textarea value={form.bio} onChange={e => update('bio', e.target.value)}
                  className="input-field text-sm py-2.5 h-20 resize-none" placeholder="Tell potential clients about your experience..."
                  maxLength={500} />
                <p className="text-[9px] text-gray-400 text-right">{form.bio.length}/500</p>
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 3: Document Upload ══════════════════════ */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">Verification Documents</h2>
              <p className="mt-1 text-sm text-gray-400">Help us verify your identity for trust and safety</p>
            </div>

            <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
              {/* ID type selector */}
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">ID Type</label>
                <div className="flex gap-2">
                  {[{id:'nin',label:'NIN'},{id:'bvn',label:'BVN'},{id:'passport',label:'Passport'},{id:'voter',label:"Voter's Card"}].map(t => (
                    <button key={t.id} onClick={() => update('idType', t.id)}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${form.idType === t.id ? 'border-brand-gold bg-brand-gold/5 text-brand-charcoal-dark dark:text-white' : 'border-gray-200 dark:border-white/10 text-gray-400'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">{form.idType.toUpperCase()} Number *</label>
                <input type="text" value={form.idNumber} onChange={e => update('idNumber', e.target.value)}
                  className="input-field text-sm py-2.5" placeholder={`Enter your ${form.idType.toUpperCase()} number`} maxLength={30} />
              </div>

              {/* CAC (optional for agents/sellers) */}
              {(form.role === 'agent' || form.role === 'seller') && (
                <div>
                  <label className="text-[10px] text-gray-400 uppercase font-semibold block mb-1">CAC Registration Number (Optional)</label>
                  <input type="text" value={form.cacNumber} onChange={e => update('cacNumber', e.target.value)}
                    className="input-field text-sm py-2.5" placeholder="RC Number" maxLength={20} />
                </div>
              )}

              {/* Upload placeholder */}
              <div className="p-6 text-center border-2 border-gray-200 border-dashed dark:border-white/10 rounded-2xl">
                <Upload size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Upload a photo of your ID document</p>
                <p className="text-[9px] text-gray-400 mt-1">JPG, PNG or PDF · Max 5MB</p>
                <button className="px-4 py-2 mt-3 text-xs btn-outline">Choose File</button>
              </div>
            </div>

            <div className="flex gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
              <Shield size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-600 dark:text-blue-400">Your documents are encrypted and only used for verification. We never share your data with third parties.</p>
            </div>
          </div>
        )}

        {/* ══ STEP 4: Review + Submit ══════════════════════ */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">Review Your Application</h2>
              <p className="mt-1 text-sm text-gray-400">Make sure everything looks correct</p>
            </div>

            <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
              {/* Summary */}
              {[
                { label: 'Role', value: ROLES.find(r => r.id === form.role)?.label },
                { label: 'Name', value: `${form.firstName} ${form.lastName}` },
                { label: 'Email', value: form.email },
                { label: 'Phone', value: form.phone },
                { label: 'Business', value: form.businessName || '—' },
                { label: 'State', value: form.state },
                { label: 'ID Type', value: form.idType.toUpperCase() },
                { label: 'ID Number', value: form.idNumber ? '••••' + form.idNumber.slice(-4) : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-gray-100 dark:border-white/5 last:border-0">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-semibold text-brand-charcoal-dark dark:text-white">{value}</span>
                </div>
              ))}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 p-4 bg-white cursor-pointer dark:bg-gray-900 rounded-2xl shadow-card">
              <input type="checkbox" checked={form.agreeTerms} onChange={e => setForm(prev => ({ ...prev, agreeTerms: e.target.checked }))}
                className="w-4 h-4 mt-0.5 rounded border-gray-300 text-brand-gold focus:ring-brand-gold" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                I agree to Aurban's <a href="#" className="font-semibold text-brand-gold">Terms of Service</a>,{' '}
                <a href="#" className="font-semibold text-brand-gold">Privacy Policy</a>, and{' '}
                <a href="#" className="font-semibold text-brand-gold">Provider Agreement</a>. I confirm the information provided is accurate.
              </span>
            </label>
          </div>
        )}

        {/* ── Navigation buttons ───────────────────────────── */}
        <div className="flex items-center justify-between mt-8">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button onClick={() => canProceed() && setStep(step + 1)}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${canProceed() ? 'btn-primary' : 'bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed'}`}>
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit}
              disabled={!canProceed() || loading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${canProceed() && !loading ? 'btn-primary' : 'bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed'}`}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 rounded-full border-white/30 border-t-white animate-spin" />
                  Submitting...
                </>
              ) : (
                <>Submit Application <CheckCircle2 size={16} /></>
              )}
            </button>
          )}
        </div>

        {/* Already have an account */}
        <p className="mt-6 text-xs text-center text-gray-400">
          Already a provider? <Link to="/login" className="font-semibold text-brand-gold">Log in here</Link>
        </p>
      </div>
    </div>
  );
}