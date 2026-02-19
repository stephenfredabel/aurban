import { useState, useCallback } from 'react';
import { useNavigate }           from 'react-router-dom';
import {
  User, Mail, Phone, Bell, Shield, Globe,
  Smartphone, Eye, EyeOff, Trash2, ChevronRight,
  CheckCircle2, X, LogOut, Camera, MapPin,
  Save, AlertTriangle, Link as LinkIcon, Zap,
  Calendar, MessageSquare, Heart, Search,
  ExternalLink, Lock,
} from 'lucide-react';
import { useAuth }      from '../../context/AuthContext.jsx';
import { updateProfile, updatePassword as sbUpdatePassword } from '../../services/supabase-auth.service.js';
import { isSupabaseConfigured } from '../../lib/supabase.js';
import { format }      from 'date-fns';

/* ── Shared save-settings helper ─────────────────────────── */
async function saveSettings(user, updateUser, key, value) {
  const merged = { ...(user?.settings || {}), [key]: value };
  if (isSupabaseConfigured() && user?.id) {
    const res = await updateProfile(user.id, { settings: merged });
    if (!res.success) throw new Error(res.error || 'Failed to save');
  }
  updateUser({ settings: merged });
}

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const SETTINGS_TABS = [
  { id: 'profile',       label: 'Profile',        icon: User         },
  { id: 'notifications', label: 'Notifications',  icon: Bell         },
  { id: 'privacy',       label: 'Privacy',        icon: Eye          },
  { id: 'security',      label: 'Security',       icon: Shield       },
  { id: 'preferences',   label: 'Preferences',    icon: Globe        },
  { id: 'searches',      label: 'Saved Searches', icon: Search       },
  { id: 'linked',        label: 'Linked Accounts',icon: LinkIcon     },
  { id: 'danger',        label: 'Account',        icon: AlertTriangle},
];

const NOTIFICATION_CHANNELS = [
  { id: 'email', label: 'Email',        icon: Mail       },
  { id: 'push',  label: 'Push',         icon: Smartphone },
  { id: 'sms',   label: 'SMS',          icon: MessageSquare },
];

const NOTIFICATION_TYPES = [
  { id: 'new_listings',    label: 'New listings matching saved searches', defaultEmail: true,  defaultPush: true,  defaultSms: false },
  { id: 'price_drops',     label: 'Price drops on saved properties',      defaultEmail: true,  defaultPush: true,  defaultSms: false },
  { id: 'messages',        label: 'New messages from providers',          defaultEmail: true,  defaultPush: true,  defaultSms: true  },
  { id: 'bookings',        label: 'Inspection reminders',                 defaultEmail: true,  defaultPush: true,  defaultSms: true  },
  { id: 'payments',        label: 'Payment confirmations & receipts',     defaultEmail: true,  defaultPush: false, defaultSms: false },
  { id: 'marketing',       label: 'Aurban news & feature updates',        defaultEmail: false, defaultPush: false, defaultSms: false },
];

const LANGUAGES = [
  'English','Hausa','Igbo','Yoruba','Pidgin','Swahili','French','Arabic','Portuguese','Amharic','Zulu','Afrikaans'
];

const CURRENCIES = ['NGN (₦)','USD ($)','GBP (£)','EUR (€)','ZAR (R)','KES (KSh)','GHS (₵)'];

const LINKED_PROVIDERS = [
  { id: 'google',    name: 'Google',    icon: '🔵', connected: true,  email: 'user@gmail.com'      },
  { id: 'whatsapp',  name: 'WhatsApp',  icon: '💚', connected: false, email: null                   },
  { id: 'facebook',  name: 'Facebook',  icon: '🔷', connected: false, email: null                   },
];

const ACTIVE_SESSIONS = [
  { id: 's1', device: 'Chrome on MacBook Pro',    location: 'Lagos, NG',  lastActive: Date.now() - 300_000,   current: true  },
  { id: 's2', device: 'Safari on iPhone 15',     location: 'Lagos, NG',  lastActive: Date.now() - 3600_000,  current: false },
  { id: 's3', device: 'Chrome on Windows',       location: 'Abuja, NG',  lastActive: Date.now() - 86400_000, current: false },
];

// ─────────────────────────────────────────────────────────────
// TAB COMPONENTS
// ─────────────────────────────────────────────────────────────

function ProfileTab({ user }) {
  const { updateUser } = useAuth();
  const [form, setForm]       = useState({
    name:     user?.name  || '',
    email:    user?.email || '',
    phone:    user?.phone || '',
    location: user?.location || '',
    avatar:   user?.avatar || null,
  });
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);
  const [errors, setErrors]   = useState({});

  const handleSave = useCallback(async () => {
    const e = {};
    if (!form.name.trim())  e.name  = 'Name required';
    if (!form.email.trim()) e.email = 'Email required';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (form.phone && !/^(\+?234|0)[7-9][01]\d{8}$/.test(form.phone.replace(/\s/g,'')))
      e.phone = 'Enter a valid Nigerian mobile number';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    try {
      if (isSupabaseConfigured() && user?.id) {
        const res = await updateProfile(user.id, {
          name:     form.name.trim(),
          phone:    form.phone.trim(),
          location: form.location.trim(),
        });
        if (!res.success) {
          setErrors({ name: res.error || 'Failed to save. Please try again.' });
          return;
        }
      }
      // Update local auth state so the rest of the app reflects changes immediately
      updateUser({ name: form.name.trim(), phone: form.phone.trim(), location: form.location.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }, [form, user, updateUser]);

  return (
    <div className="space-y-5">
      {/* Avatar */}
      <div>
        <label className="mb-3 label-sm">Profile Photo</label>
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-gold/20 group">
            {form.avatar ? (
              <img src={form.avatar} alt="Avatar" className="object-cover w-full h-full rounded-3xl" />
            ) : (
              <span className="text-3xl font-extrabold font-display text-brand-gold-dark">
                {form.name.charAt(0)?.toUpperCase() || '?'}
              </span>
            )}
            <button type="button"
              className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/50 rounded-3xl group-hover:opacity-100">
              <Camera size={20} className="text-white" />
            </button>
          </div>
          <div>
            <button type="button"
              className="px-4 py-2 text-sm font-bold transition-colors border-2 border-gray-200 rounded-xl dark:border-white/20 text-brand-charcoal dark:text-white hover:border-brand-gold">
              Change Photo
            </button>
            <p className="mt-1 text-xs text-gray-400">PNG, JPG up to 5MB</p>
          </div>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="label-sm mb-1.5">Full Name *</label>
        <div className="relative">
          <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className={`input-field pl-10 ${errors.name ? 'border-red-300' : ''}`}
          />
        </div>
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="label-sm mb-1.5">Email Address *</label>
        <div className="relative">
          <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="email" inputMode="email" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className={`input-field pl-10 ${errors.email ? 'border-red-300' : ''}`}
          />
        </div>
        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="label-sm mb-1.5">Phone Number</label>
        <div className="relative">
          <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="tel" inputMode="tel" value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="0801 234 5678"
            className={`input-field pl-10 ${errors.phone ? 'border-red-300' : ''}`}
          />
        </div>
        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
      </div>

      {/* Location */}
      <div>
        <label className="label-sm mb-1.5">Location</label>
        <div className="relative">
          <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input type="text" value={form.location}
            onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            placeholder="e.g. Lekki, Lagos"
            className="pl-10 input-field"
          />
        </div>
      </div>

      <button type="button" onClick={handleSave} disabled={saving || saved}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition-colors">
        {saving ? <><span className="w-4 h-4 border-2 rounded-full border-white/40 border-t-white animate-spin" /> Saving…</>
        : saved  ? <><CheckCircle2 size={15} /> Saved!</>
        : <><Save size={15} /> Save Changes</>}
      </button>
    </div>
  );
}

function NotificationsTab() {
  const { user, updateUser } = useAuth();
  const [prefs, setPrefs] = useState(() => {
    const stored = user?.settings?.notifications;
    if (stored) return stored;
    const initial = {};
    NOTIFICATION_TYPES.forEach(t => {
      initial[t.id] = {
        email: t.defaultEmail,
        push:  t.defaultPush,
        sms:   t.defaultSms,
      };
    });
    return initial;
  });

  const toggle = (typeId, channel) => {
    setPrefs(p => ({
      ...p,
      [typeId]: { ...p[typeId], [channel]: !p[typeId][channel] },
    }));
  };

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await saveSettings(user, updateUser, 'notifications', prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Channel header — hidden on mobile */}
      <div className="hidden sm:grid grid-cols-12 gap-2 px-3 pb-2 border-b border-gray-100 dark:border-white/10">
        <div className="col-span-6" />
        {NOTIFICATION_CHANNELS.map(ch => (
          <div key={ch.id} className="col-span-2 text-center">
            <div className="flex flex-col items-center gap-0.5">
              <ch.icon size={14} className="text-gray-400" />
              <span className="text-[10px] font-bold text-gray-400 uppercase">{ch.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Notification rows */}
      {NOTIFICATION_TYPES.map(type => (
        <div key={type.id} className="flex flex-col gap-2 px-3 py-3 transition-colors rounded-xl hover:bg-brand-gray-soft dark:hover:bg-white/5 sm:grid sm:grid-cols-12 sm:items-center sm:gap-2 sm:py-2">
          <div className="sm:col-span-6">
            <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">{type.label}</p>
          </div>
          <div className="flex items-center gap-4 sm:contents">
            {NOTIFICATION_CHANNELS.map(ch => (
              <div key={ch.id} className="flex items-center gap-2 sm:justify-center sm:col-span-2">
                <span className="text-[10px] text-gray-400 sm:hidden">{ch.label}</span>
                <button type="button"
                  onClick={() => toggle(type.id, ch.id)}
                  className={[
                    'w-10 h-5 rounded-full transition-all relative',
                    prefs[type.id]?.[ch.id]
                      ? 'bg-brand-gold'
                      : 'bg-gray-200 dark:bg-white/20',
                  ].join(' ')}>
                  <span className={[
                    'absolute w-4 h-4 bg-white rounded-full top-0.5 transition-all shadow-sm',
                    prefs[type.id]?.[ch.id] ? 'right-0.5' : 'left-0.5',
                  ].join(' ')} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {error && <p className="text-xs text-red-500">{error}</p>}
      <button type="button" onClick={handleSave} disabled={saving || saved}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition-colors">
        {saving ? <><span className="w-4 h-4 border-2 rounded-full border-white/40 border-t-white animate-spin" /> Saving…</>
        : saved  ? <><CheckCircle2 size={15} /> Saved!</>
        : <><Save size={15} /> Save Preferences</>}
      </button>
    </div>
  );
}

function PrivacyTab() {
  const { user, updateUser } = useAuth();
  const storedPrivacy = user?.settings?.privacy;
  const [prefs, setPrefs] = useState({
    showSaved:       storedPrivacy?.showSaved ?? 'only_me',
    showActivity:    storedPrivacy?.showActivity ?? false,
    allowMessages:   storedPrivacy?.allowMessages ?? true,
    profileIndexing: storedPrivacy?.profileIndexing ?? true,
  });

  const [msgVisibility, setMsgVisibility] = useState({
    showPhone:       storedPrivacy?.msgVisibility?.showPhone ?? false,
    showEmail:       storedPrivacy?.msgVisibility?.showEmail ?? false,
    showLocation:    storedPrivacy?.msgVisibility?.showLocation ?? true,
    showJoinDate:    storedPrivacy?.msgVisibility?.showJoinDate ?? true,
    showVerified:    storedPrivacy?.msgVisibility?.showVerified ?? true,
    showOnlineStatus: storedPrivacy?.msgVisibility?.showOnlineStatus ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  const ToggleRow = ({ enabled, onChange, label, desc }) => (
    <div className="flex items-start gap-4 p-4 bg-brand-gray-soft dark:bg-white/5 rounded-2xl">
      <div className="flex-1">
        <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white mb-0.5">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
      <button type="button" onClick={() => onChange(!enabled)}
        className={[
          'w-11 h-6 rounded-full transition-all relative shrink-0',
          enabled ? 'bg-brand-gold' : 'bg-gray-200 dark:bg-white/20',
        ].join(' ')}>
        <span className={[
          'absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all shadow-sm',
          enabled ? 'right-0.5' : 'left-0.5',
        ].join(' ')} />
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ── General Privacy ── */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-brand-charcoal-dark dark:text-white">General Privacy</h3>

        {/* Who can see saved items */}
        <div>
          <label className="mb-2 label-sm">Who can see your saved listings?</label>
          <div className="space-y-2">
            {[
              { id: 'only_me',  label: 'Only Me',                desc: 'Private — no one else can see' },
              { id: 'everyone', label: 'Everyone on Aurban',     desc: 'Public profile shows saved items' },
            ].map(opt => (
              <button key={opt.id} type="button"
                onClick={() => setPrefs(p => ({ ...p, showSaved: opt.id }))}
                className={[
                  'w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all',
                  prefs.showSaved === opt.id
                    ? 'border-brand-gold bg-brand-gold/5 dark:bg-brand-gold/10'
                    : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-gray-300',
                ].join(' ')}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${prefs.showSaved === opt.id ? 'border-brand-gold' : 'border-gray-300'}`}>
                  {prefs.showSaved === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-brand-gold" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{opt.label}</p>
                  <p className="text-xs text-gray-400">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Other privacy toggles */}
        <ToggleRow enabled={prefs.showActivity} onChange={(v) => setPrefs(p => ({ ...p, showActivity: v }))}
          label="Show recent activity" desc="Let others see properties you viewed" />
        <ToggleRow enabled={prefs.allowMessages} onChange={(v) => setPrefs(p => ({ ...p, allowMessages: v }))}
          label="Allow messages from providers" desc="Providers can send you inquiries" />
        <ToggleRow enabled={prefs.profileIndexing} onChange={(v) => setPrefs(p => ({ ...p, profileIndexing: v }))}
          label="Allow search engine indexing" desc="Your public profile appears in Google search results" />
      </div>

      {/* ── Messaging Visibility ── */}
      <div className="pt-5 space-y-4 border-t border-gray-100 dark:border-white/10">
        <div>
          <h3 className="text-sm font-bold text-brand-charcoal-dark dark:text-white">Messaging Visibility</h3>
          <p className="text-xs text-gray-400 mt-0.5">Control what providers can see about you in conversations</p>
        </div>

        <ToggleRow enabled={msgVisibility.showPhone} onChange={(v) => setMsgVisibility(p => ({ ...p, showPhone: v }))}
          label="Show phone number" desc="Providers can see your phone number in chats" />
        <ToggleRow enabled={msgVisibility.showEmail} onChange={(v) => setMsgVisibility(p => ({ ...p, showEmail: v }))}
          label="Show email address" desc="Providers can see your email in conversations" />
        <ToggleRow enabled={msgVisibility.showLocation} onChange={(v) => setMsgVisibility(p => ({ ...p, showLocation: v }))}
          label="Show location" desc="Providers can see your city or area" />
        <ToggleRow enabled={msgVisibility.showJoinDate} onChange={(v) => setMsgVisibility(p => ({ ...p, showJoinDate: v }))}
          label="Show join date" desc="Providers can see when you joined Aurban" />
        <ToggleRow enabled={msgVisibility.showVerified} onChange={(v) => setMsgVisibility(p => ({ ...p, showVerified: v }))}
          label="Show verification status" desc="Display your verified badge to providers" />
        <ToggleRow enabled={msgVisibility.showOnlineStatus} onChange={(v) => setMsgVisibility(p => ({ ...p, showOnlineStatus: v }))}
          label="Show online status" desc="Providers can see when you are active" />

        <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20">
          <Shield size={14} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
            Your username and messages are always visible to providers you are in conversation with. These settings control the additional information shared in the messaging info panel.
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      <button type="button" disabled={saving || saved}
        onClick={async () => {
          setSaving(true); setError('');
          try {
            await saveSettings(user, updateUser, 'privacy', { ...prefs, msgVisibility });
            setSaved(true); setTimeout(() => setSaved(false), 3000);
          } catch (err) { setError(err.message || 'Failed to save'); }
          finally { setSaving(false); }
        }}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition-colors">
        {saving ? <><span className="w-4 h-4 border-2 rounded-full border-white/40 border-t-white animate-spin" /> Saving…</>
        : saved  ? <><CheckCircle2 size={15} /> Saved!</>
        : <><Save size={15} /> Save Privacy Settings</>}
      </button>
    </div>
  );
}

function SecurityTab() {
  const { user, updateUser } = useAuth();
  const [showOld,    setShowOld]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.settings?.security?.twoFactor ?? false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg,    setPwMsg]    = useState({ type: '', text: '' });

  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  const handlePasswordChange = async () => {
    setPwMsg({ type: '', text: '' });
    if (!form.newPassword || form.newPassword.length < 6) {
      setPwMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setPwMsg({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setPwSaving(true);
    try {
      if (isSupabaseConfigured()) {
        const res = await sbUpdatePassword(form.newPassword);
        if (!res.success) { setPwMsg({ type: 'error', text: res.error || 'Failed to update password' }); return; }
      }
      setPwMsg({ type: 'success', text: 'Password updated successfully' });
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      setPwMsg({ type: 'error', text: 'Failed to update password' });
    } finally {
      setPwSaving(false);
    }
  };

  const handle2FAToggle = async (val) => {
    setTwoFactorEnabled(val);
    try { await saveSettings(user, updateUser, 'security', { twoFactor: val }); } catch { /* non-critical */ }
  };

  return (
    <div className="space-y-6">
      {/* Change password */}
      <div>
        <h3 className="mb-4 text-sm font-bold text-brand-charcoal-dark dark:text-white">Change Password</h3>
        <div className="space-y-3">
          {/* Old password */}
          <div>
            <label className="label-sm mb-1.5">Current Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type={showOld ? 'text' : 'password'} value={form.oldPassword}
                onChange={e => setForm(f => ({ ...f, oldPassword: e.target.value }))}
                className="pl-10 pr-10 input-field"
              />
              <button type="button" onClick={() => setShowOld(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showOld ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="label-sm mb-1.5">New Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type={showNew ? 'text' : 'password'} value={form.newPassword}
                onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                className="pl-10 pr-10 input-field"
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="label-sm mb-1.5">Confirm New Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                className="pl-10 pr-10 input-field"
              />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {pwMsg.text && (
            <p className={`text-xs ${pwMsg.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>{pwMsg.text}</p>
          )}
          <button type="button" onClick={handlePasswordChange} disabled={pwSaving}
            className="w-full py-3 text-sm font-bold text-white transition-colors bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 rounded-2xl">
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Two-factor authentication */}
      <div className="pt-5 border-t border-gray-100 dark:border-white/10">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <h3 className="mb-1 text-sm font-bold text-brand-charcoal-dark dark:text-white">Two-Factor Authentication</h3>
            <p className="text-xs leading-relaxed text-gray-400">
              Add an extra layer of security. You'll be asked for a code from your phone when you sign in.
            </p>
          </div>
          <button type="button"
            onClick={() => handle2FAToggle(!twoFactorEnabled)}
            className={[
              'w-11 h-6 rounded-full transition-all relative shrink-0',
              twoFactorEnabled ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/20',
            ].join(' ')}>
            <span className={[
              'absolute w-5 h-5 bg-white rounded-full top-0.5 transition-all shadow-sm',
              twoFactorEnabled ? 'right-0.5' : 'left-0.5',
            ].join(' ')} />
          </button>
        </div>
        {twoFactorEnabled && (
          <div className="p-3 mt-3 border bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border-emerald-100 dark:border-emerald-500/20">
            <p className="text-xs leading-relaxed text-emerald-700 dark:text-emerald-300">
              ✓ Two-factor authentication is <strong>enabled</strong>. You'll receive a code via SMS when signing in from a new device.
            </p>
          </div>
        )}
      </div>

      {/* Active sessions */}
      <div className="pt-5 border-t border-gray-100 dark:border-white/10">
        <h3 className="mb-4 text-sm font-bold text-brand-charcoal-dark dark:text-white">Active Sessions</h3>
        <div className="space-y-2">
          {ACTIVE_SESSIONS.map(session => (
            <div key={session.id}
              className="flex items-center gap-3 p-3 bg-brand-gray-soft dark:bg-white/5 rounded-xl">
              <Smartphone size={16} className="text-gray-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate text-brand-charcoal-dark dark:text-white">
                    {session.device}
                  </p>
                  {session.current && (
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {session.location} · {format(new Date(session.lastActive), 'HH:mm · d MMM')}
                </p>
              </div>
              {!session.current && (
                <button type="button" aria-label="Revoke session"
                  className="text-red-400 transition-colors hover:text-red-500 shrink-0">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
        <button type="button"
          className="w-full mt-3 py-2.5 rounded-xl border-2 border-red-200 dark:border-red-500/30 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
          Sign Out All Other Devices
        </button>
      </div>
    </div>
  );
}

function PreferencesTab() {
  const { user, updateUser } = useAuth();
  const storedPrefs = user?.settings?.preferences;
  const [lang, setLang]         = useState(storedPrefs?.language ?? 'English');
  const [currency, setCurrency] = useState(storedPrefs?.currency ?? 'NGN (₦)');
  const [saving, setSaving]     = useState(false);
  const [saved,  setSaved]      = useState(false);
  const [error,  setError]      = useState('');

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await saveSettings(user, updateUser, 'preferences', { language: lang, currency });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (err) { setError(err.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      {/* Language */}
      <div>
        <label className="mb-2 label-sm">Language</label>
        <div className="relative">
          <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select value={lang} onChange={e => setLang(e.target.value)}
            className="pl-10 appearance-none input-field">
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
          <ChevronRight size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none rotate-90" />
        </div>
      </div>

      {/* Currency */}
      <div>
        <label className="mb-2 label-sm">Currency</label>
        <select value={currency} onChange={e => setCurrency(e.target.value)}
          className="appearance-none input-field">
          {CURRENCIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
      <button type="button" onClick={handleSave} disabled={saving || saved}
        className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold hover:bg-brand-gold-dark disabled:opacity-50 text-white font-bold text-sm rounded-2xl transition-colors">
        {saving ? <><span className="w-4 h-4 border-2 rounded-full border-white/40 border-t-white animate-spin" /> Saving…</>
        : saved  ? <><CheckCircle2 size={15} /> Saved!</>
        : <><Save size={15} /> Save Preferences</>}
      </button>
    </div>
  );
}

function SavedSearchesTab() {
  const [searches, setSearches] = useState([
    { id: 's1', label: '3-bed rental · Lekki · Under ₦1.5M', alertOn: true,  newMatches: 3, createdAt: Date.now() - 7 * 86400_000   },
    { id: 's2', label: 'Land for sale · Ibeju-Lekki',        alertOn: false, newMatches: 0, createdAt: Date.now() - 14 * 86400_000  },
    { id: 's3', label: 'Shortlet · Victoria Island',         alertOn: true,  newMatches: 1, createdAt: Date.now() - 21 * 86400_000  },
  ]);

  const toggleAlert = (id) => setSearches(s => s.map(srch => srch.id === id ? { ...srch, alertOn: !srch.alertOn } : srch));
  const remove      = (id) => setSearches(s => s.filter(srch => srch.id !== id));

  return (
    <div className="space-y-3">
      {searches.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <Search size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No saved searches</p>
        </div>
      ) : (
        searches.map(srch => (
          <div key={srch.id}
            className="flex items-center gap-3 p-4 bg-white border border-gray-100 dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10">
            <Search size={15} className="text-brand-gold shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-brand-charcoal-dark dark:text-white">{srch.label}</p>
              <p className="text-xs text-gray-400">Created {format(new Date(srch.createdAt), 'd MMM yyyy')}</p>
              {srch.newMatches > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-gold/10 rounded-full text-[11px] font-bold text-brand-gold mt-1">
                  <Zap size={9} />{srch.newMatches} new
                </span>
              )}
            </div>
            <button type="button"
              onClick={() => toggleAlert(srch.id)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${srch.alertOn ? 'bg-brand-gold/10 text-brand-gold' : 'bg-gray-100 dark:bg-white/10 text-gray-400'}`}>
              <Bell size={14} />
            </button>
            <button type="button" onClick={() => remove(srch.id)}
              className="flex items-center justify-center text-red-400 transition-colors w-9 h-9 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10">
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function LinkedAccountsTab() {
  const [providers, setProviders] = useState(LINKED_PROVIDERS);

  const toggleProvider = (id) => {
    setProviders(p => p.map(prov => prov.id === id ? { ...prov, connected: !prov.connected, email: prov.connected ? null : 'user@example.com' } : prov));
  };

  return (
    <div className="space-y-3">
      {providers.map(prov => (
        <div key={prov.id}
          className="flex items-center gap-4 p-4 bg-white border border-gray-100 dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10">
          <span className="text-2xl shrink-0">{prov.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{prov.name}</p>
            {prov.connected && prov.email && (
              <p className="text-xs text-gray-400 truncate">{prov.email}</p>
            )}
          </div>
          <button type="button" onClick={() => toggleProvider(prov.id)}
            className={[
              'px-4 py-2 rounded-xl text-sm font-bold transition-colors',
              prov.connected
                ? 'bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-500/20'
                : 'bg-brand-gold hover:bg-brand-gold-dark text-white',
            ].join(' ')}>
            {prov.connected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      ))}

      <div className="flex items-start gap-2.5 p-3.5 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20 mt-5">
        <Shield size={14} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
          Linking accounts lets you sign in faster and sync your data. You can disconnect anytime.
        </p>
      </div>
    </div>
  );
}

function DangerZoneTab() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText,  setDeleteConfirmText]  = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    await new Promise(r => setTimeout(r, 1500));
    logout();
    navigate('/');
  };

  return (
    <div className="space-y-4">
      {/* Logout */}
      <button type="button" onClick={handleLogout}
        className="flex items-center justify-between w-full p-4 text-left transition-colors border-2 border-gray-200 rounded-2xl dark:border-white/20 hover:border-gray-300 group">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 transition-colors bg-gray-100 rounded-xl dark:bg-white/10 group-hover:bg-brand-gold/10">
            <LogOut size={16} className="text-gray-400 transition-colors group-hover:text-brand-gold" />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">Sign Out</p>
            <p className="text-xs text-gray-400">Sign out of this device</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-400" />
      </button>

      {/* Delete account */}
      <button type="button" onClick={() => setShowDeleteConfirm(true)}
        className="flex items-center justify-between w-full p-4 text-left transition-colors border-2 border-red-200 rounded-2xl dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10 group">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-xl dark:bg-red-500/20">
            <Trash2 size={16} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-600 dark:text-red-400">Delete Account</p>
            <p className="text-xs text-red-500 dark:text-red-400">Permanent — cannot be undone</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-red-400" />
      </button>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          role="dialog" aria-modal="true">
          <div className="w-full max-w-sm p-6 bg-white shadow-2xl dark:bg-brand-charcoal-dark rounded-3xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-500/20 rounded-3xl">
              <AlertTriangle size={32} className="text-red-500" />
            </div>
            <h3 className="mb-2 text-xl font-extrabold text-center font-display text-brand-charcoal-dark dark:text-white">
              Delete Account?
            </h3>
            <p className="mb-5 text-sm leading-relaxed text-center text-gray-400">
              This action is <strong className="text-red-500">permanent</strong>. All your data — saved listings, searches, messages, payment history — will be deleted after a 30-day grace period.
            </p>
            <div className="mb-5">
              <label className="mb-2 label-sm">Type <strong>DELETE</strong> to confirm</label>
              <input type="text" value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="font-mono font-bold text-center input-field"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                className="flex-1 py-3 text-sm font-bold border-2 border-gray-200 rounded-xl dark:border-white/20 text-brand-charcoal dark:text-white">
                Cancel
              </button>
              <button type="button" onClick={handleDelete}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 py-3 text-sm font-bold text-white transition-colors bg-red-500 rounded-xl hover:bg-red-600 disabled:opacity-40">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────

export default function Settings() {
  const { user }        = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="max-w-4xl px-4 py-6 pb-24 mx-auto lg:pb-10">
      <h1 className="mb-6 text-2xl font-extrabold font-display text-brand-charcoal-dark dark:text-white">
        Settings
      </h1>

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* Sidebar */}
        <div className="lg:w-64 shrink-0">
          <nav className="p-2 space-y-1 bg-white border border-gray-100 dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10">
            {SETTINGS_TABS.map(tab => (
              <button key={tab.id} type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all',
                  activeTab === tab.id
                    ? 'bg-brand-gold/10 text-brand-gold'
                    : 'text-gray-500 dark:text-white/60 hover:bg-brand-gray-soft dark:hover:bg-white/5',
                ].join(' ')}>
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 bg-white border border-gray-100 dark:bg-brand-charcoal-dark rounded-2xl dark:border-white/10">
          {activeTab === 'profile'       && <ProfileTab user={user} />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'privacy'       && <PrivacyTab />}
          {activeTab === 'security'      && <SecurityTab />}
          {activeTab === 'preferences'   && <PreferencesTab />}
          {activeTab === 'searches'      && <SavedSearchesTab />}
          {activeTab === 'linked'        && <LinkedAccountsTab />}
          {activeTab === 'danger'        && <DangerZoneTab />}
        </div>
      </div>
    </div>
  );
}