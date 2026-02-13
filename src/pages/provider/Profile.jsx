import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Camera, Star, MapPin, Phone, Mail, Globe, Clock,
  CheckCircle, Shield, Award, Edit, Eye, Save, Plus,
  X, Image, ExternalLink, Calendar, Briefcase, MessageCircle,
  Heart, Share2, TrendingUp, Upload, Trash2, GripVertical,
  Building2, BadgeCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

/* ════════════════════════════════════════════════════════════
   PROVIDER PROFILE EDIT — Public profile management

   This is what providers see when editing their public-facing
   profile on Aurban. The profile is visible to users at
   /providers/:id (ProviderProfile.jsx)

   Sections:
   1. Cover photo + avatar
   2. Display info (name, tagline, bio)
   3. Service areas & availability
   4. Portfolio / gallery
   5. Certifications & badges
   6. Social links
   7. Preview mode
════════════════════════════════════════════════════════════ */

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

export default function Profile() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  /* ── Profile state ──────────────────────────────────────── */
  const [profile, setProfile] = useState({
    displayName: user?.name || 'Provider Name',
    tagline: 'Experienced Property Manager & Real Estate Professional',
    bio: 'With over 8 years of experience in the Lagos property market, I specialize in residential rentals, property sales, and building maintenance services. My focus is on transparency, quick response times, and ensuring both landlords and tenants have a smooth experience.\n\nI manage properties across Lekki, Ikoyi, Victoria Island, and Yaba. Whether you\'re looking for your next home or need a reliable service provider, I\'m here to help.',
    coverPhoto: null,
    avatar: null,
    yearsExperience: '8',
    projectsCompleted: '120+',
    responseTime: 'Under 1 hour',
    satisfaction: '97%',
  });

  /* ── Service areas ──────────────────────────────────────── */
  const [serviceAreas, setServiceAreas] = useState([
    { state: 'Lagos', areas: ['Lekki', 'Ikoyi', 'Victoria Island', 'Yaba', 'Surulere'] },
    { state: 'Ogun', areas: ['Ibafo', 'Mowe'] },
  ]);
  const [newAreaState, setNewAreaState] = useState('');
  const [newAreaLocal, setNewAreaLocal] = useState('');

  /* ── Availability ───────────────────────────────────────── */
  const [availability, setAvailability] = useState({
    Monday:    { available: true, from: '08:00', to: '18:00' },
    Tuesday:   { available: true, from: '08:00', to: '18:00' },
    Wednesday: { available: true, from: '08:00', to: '18:00' },
    Thursday:  { available: true, from: '08:00', to: '18:00' },
    Friday:    { available: true, from: '08:00', to: '18:00' },
    Saturday:  { available: true, from: '09:00', to: '15:00' },
    Sunday:    { available: false, from: '', to: '' },
  });

  /* ── Portfolio ──────────────────────────────────────────── */
  const [portfolio, setPortfolio] = useState([
    { id: 'p1', title: '3BR Renovation — Lekki Phase 1', description: 'Full renovation including kitchen, bathrooms, and living areas', category: 'renovation' },
    { id: 'p2', title: 'Luxury Shortlet Interior — VI', description: 'Designed and furnished a 2-bedroom serviced apartment', category: 'interior' },
    { id: 'p3', title: 'Plumbing Overhaul — Ikoyi Estate', description: 'Complete replumbing of a 5-unit apartment complex', category: 'plumbing' },
  ]);

  /* ── Certifications ─────────────────────────────────────── */
  const [certifications, setCertifications] = useState([
    { id: 'c1', name: 'NIESV Certified Valuer', issuer: 'Nigerian Institution of Estate Surveyors', year: '2020', verified: true },
    { id: 'c2', name: 'Licensed Real Estate Agent', issuer: 'Lagos State Real Estate Board', year: '2019', verified: true },
    { id: 'c3', name: 'Professional Plumber Certificate', issuer: 'National Technical Board', year: '2018', verified: false },
  ]);

  /* ── Social links ───────────────────────────────────────── */
  const [socialLinks, setSocialLinks] = useState({
    website: 'https://example.com',
    instagram: '@provider_lagos',
    facebook: '',
    linkedin: '',
    twitter: '',
    tiktok: '',
  });

  const updateProfile = (key, value) => setProfile((p) => ({ ...p, [key]: value }));
  const updateSocial = (key, value) => setSocialLinks((s) => ({ ...s, [key]: value }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addServiceArea = () => {
    if (!newAreaState || !newAreaLocal) return;
    setServiceAreas((prev) => {
      const existing = prev.find((a) => a.state === newAreaState);
      if (existing) {
        return prev.map((a) => a.state === newAreaState ? { ...a, areas: [...new Set([...a.areas, newAreaLocal])] } : a);
      }
      return [...prev, { state: newAreaState, areas: [newAreaLocal] }];
    });
    setNewAreaLocal('');
  };

  const removeArea = (state, area) => {
    setServiceAreas((prev) => prev.map((a) => a.state === state ? { ...a, areas: a.areas.filter((ar) => ar !== area) } : a).filter((a) => a.areas.length > 0));
  };

  const TABS = [
    { id: 'info', label: 'Profile Info' },
    { id: 'areas', label: 'Service Areas' },
    { id: 'availability', label: 'Availability' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'certs', label: 'Certifications' },
    { id: 'social', label: 'Social Links' },
  ];

  /* ══════════════════════════════════════════════════════════
     PREVIEW MODE — Shows how the public profile will look
  ══════════════════════════════════════════════════════════ */
  if (previewMode) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">
            <Eye size={18} /> Profile Preview
          </h2>
          <button onClick={() => setPreviewMode(false)}
            className="flex items-center gap-1 px-4 py-2 text-xs text-white rounded-lg bg-brand-charcoal-dark hover:bg-gray-800">
            <Edit size={12} /> Back to Editing
          </button>
        </div>

        {/* Preview card */}
        <div className="overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          {/* Cover */}
          <div className="relative h-32 bg-gradient-to-br from-brand-charcoal-dark to-gray-700">
            <div className="absolute -bottom-8 left-5">
              <div className="flex items-center justify-center w-16 h-16 text-xl font-bold border-4 border-white rounded-full bg-brand-gold/20 text-brand-gold dark:border-gray-900">
                {profile.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
            </div>
          </div>

          <div className="px-5 pt-10 pb-5 space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-brand-charcoal-dark dark:text-white">{profile.displayName}</h3>
                <BadgeCheck size={16} className="text-blue-500" />
              </div>
              <p className="text-sm font-medium text-brand-gold">{profile.tagline}</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Years Exp.', value: profile.yearsExperience },
                { label: 'Projects', value: profile.projectsCompleted },
                { label: 'Response', value: profile.responseTime },
                { label: 'Satisfaction', value: profile.satisfaction },
              ].map((s, i) => (
                <div key={i} className="p-2 text-center bg-gray-50 dark:bg-white/5 rounded-xl">
                  <p className="text-sm font-bold text-brand-charcoal-dark dark:text-white">{s.value}</p>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>

            <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line dark:text-gray-300">{profile.bio}</p>

            {/* Service areas */}
            <div>
              <p className="mb-2 text-xs font-semibold text-brand-charcoal-dark dark:text-white">Service Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {serviceAreas.flatMap((sa) => sa.areas.map((area) => (
                  <span key={`${sa.state}-${area}`} className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-full flex items-center gap-1">
                    <MapPin size={8} /> {area}, {sa.state}
                  </span>
                )))}
              </div>
            </div>

            {/* Portfolio preview */}
            {portfolio.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-brand-charcoal-dark dark:text-white">Portfolio ({portfolio.length})</p>
                <div className="grid grid-cols-3 gap-2">
                  {portfolio.map((p) => (
                    <div key={p.id} className="flex items-center justify-center bg-gray-100 aspect-square dark:bg-white/10 rounded-xl">
                      <Image size={20} className="text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-brand-charcoal-dark dark:text-white">Certifications</p>
                <div className="flex flex-wrap gap-1.5">
                  {certifications.map((c) => (
                    <span key={c.id} className={`text-[10px] px-2 py-1 rounded-full flex items-center gap-1 ${c.verified ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-gray-100 dark:bg-white/10 text-gray-500'}`}>
                      {c.verified ? <CheckCircle size={8} /> : <Clock size={8} />} {c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-center text-gray-400">This is how your profile appears to potential clients on Aurban</p>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
     EDIT MODE
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">Edit Profile</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage your public-facing provider profile</p>
        </div>
        <div className="flex gap-2">
          {saved && (
            <span className="text-xs text-emerald-600 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full">
              <CheckCircle size={12} /> Saved
            </span>
          )}
          <button onClick={() => setPreviewMode(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 font-medium flex items-center gap-1">
            <Eye size={12} /> Preview
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`text-xs font-medium px-3 py-2 rounded-xl whitespace-nowrap transition-colors shrink-0
              ${activeTab === t.id ? 'bg-brand-charcoal-dark text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Profile Info ──────────────────────────────────── */}
      {activeTab === 'info' && (
        <div className="space-y-4">
          {/* Cover + Avatar */}
          <div className="overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="relative h-28 bg-gradient-to-br from-brand-charcoal-dark to-gray-700">
              <button className="absolute top-3 right-3 text-[10px] px-3 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm flex items-center gap-1">
                <Camera size={10} /> Change Cover
              </button>
              <div className="absolute -bottom-8 left-5">
                <div className="relative flex items-center justify-center w-16 h-16 text-xl font-bold border-4 border-white rounded-full bg-brand-gold/20 text-brand-gold dark:border-gray-900">
                  {profile.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  <button className="absolute flex items-center justify-center w-6 h-6 text-white rounded-full shadow -bottom-1 -right-1 bg-brand-gold">
                    <Camera size={10} />
                  </button>
                </div>
              </div>
            </div>
            <div className="px-5 pt-12 pb-5 space-y-4">
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Display Name</label>
                <input value={profile.displayName} onChange={(e) => updateProfile('displayName', e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-brand-charcoal-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold" />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Tagline</label>
                <input value={profile.tagline} onChange={(e) => updateProfile('tagline', e.target.value)}
                  placeholder="A short description of what you do"
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-brand-charcoal-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold" />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">About / Bio</label>
                <textarea value={profile.bio} onChange={(e) => updateProfile('bio', e.target.value)}
                  rows={5}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-brand-charcoal-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold resize-none" />
                <p className="text-[10px] text-gray-400 mt-1">This appears on your public profile. Be detailed but concise.</p>
              </div>

              {/* Quick stats */}
              <div>
                <p className="mb-2 text-xs font-semibold text-brand-charcoal-dark dark:text-white">Profile Statistics (displayed publicly)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-gray-400 mb-1 block">Years of Experience</label>
                    <input value={profile.yearsExperience} onChange={(e) => updateProfile('yearsExperience', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg dark:border-white/10 dark:bg-gray-800 text-brand-charcoal-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-400 mb-1 block">Projects Completed</label>
                    <input value={profile.projectsCompleted} onChange={(e) => updateProfile('projectsCompleted', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg dark:border-white/10 dark:bg-gray-800 text-brand-charcoal-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-400 mb-1 block">Typical Response Time</label>
                    <input value={profile.responseTime} onChange={(e) => updateProfile('responseTime', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg dark:border-white/10 dark:bg-gray-800 text-brand-charcoal-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30" />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-gray-400 mb-1 block">Client Satisfaction</label>
                    <input value={profile.satisfaction} onChange={(e) => updateProfile('satisfaction', e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg dark:border-white/10 dark:bg-gray-800 text-brand-charcoal-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button onClick={handleSave}
            className="flex items-center justify-center w-full gap-2 py-3 text-sm font-semibold transition-colors bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark rounded-xl">
            <Save size={14} /> Save Profile
          </button>
        </div>
      )}

      {/* ── Service Areas ─────────────────────────────────── */}
      {activeTab === 'areas' && (
        <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Service Areas</h3>
          <p className="text-xs text-gray-400">Define where you operate. This helps clients find you by location.</p>

          {serviceAreas.map((sa) => (
            <div key={sa.state}>
              <p className="text-xs font-semibold text-brand-charcoal-dark dark:text-white mb-1.5 flex items-center gap-1">
                <MapPin size={12} className="text-brand-gold" /> {sa.state}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sa.areas.map((area) => (
                  <span key={area} className="text-[11px] px-2.5 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-full flex items-center gap-1 group">
                    {area}
                    <button onClick={() => removeArea(sa.state, area)} className="text-gray-400 transition-opacity opacity-0 hover:text-red-500 group-hover:opacity-100">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}

          <div className="pt-3 border-t border-gray-100 dark:border-white/10">
            <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">Add Area</p>
            <div className="flex gap-2">
              <select value={newAreaState} onChange={(e) => setNewAreaState(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg dark:border-white/10 dark:bg-gray-800 text-brand-charcoal-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30">
                <option value="">State...</option>
                {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input value={newAreaLocal} onChange={(e) => setNewAreaLocal(e.target.value)} placeholder="Area/LGA name"
                className="flex-1 px-3 py-2 text-xs placeholder-gray-400 bg-white border border-gray-200 rounded-lg dark:border-white/10 dark:bg-gray-800 text-brand-charcoal-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30" />
              <button onClick={addServiceArea}
                disabled={!newAreaState || !newAreaLocal}
                className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark disabled:opacity-40">
                <Plus size={12} /> Add
              </button>
            </div>
          </div>

          <button onClick={handleSave}
            className="flex items-center justify-center w-full gap-2 py-3 text-sm font-semibold transition-colors bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark rounded-xl">
            <Save size={14} /> Save Areas
          </button>
        </div>
      )}

      {/* ── Availability ──────────────────────────────────── */}
      {activeTab === 'availability' && (
        <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Working Hours</h3>
          <p className="text-xs text-gray-400">Set your availability for each day. Clients will see when you're reachable.</p>

          <div className="space-y-2">
            {DAYS.map((day) => {
              const dayAvail = availability[day];
              return (
                <div key={day} className="flex items-center gap-3 py-2">
                  <button onClick={() => setAvailability((a) => ({ ...a, [day]: { ...a[day], available: !a[day].available } }))}
                    className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${dayAvail.available ? 'bg-brand-gold' : 'bg-gray-300 dark:bg-gray-700'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${dayAvail.available ? 'translate-x-5' : ''}`} />
                  </button>
                  <span className={`text-sm w-24 shrink-0 ${dayAvail.available ? 'text-brand-charcoal-dark dark:text-white font-medium' : 'text-gray-400'}`}>
                    {day}
                  </span>
                  {dayAvail.available ? (
                    <div className="flex items-center gap-2">
                      <input type="time" value={dayAvail.from}
                        onChange={(e) => setAvailability((a) => ({ ...a, [day]: { ...a[day], from: e.target.value } }))}
                        className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-lg dark:border-white/10 dark:bg-gray-800 text-brand-charcoal-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30" />
                      <span className="text-xs text-gray-400">to</span>
                      <input type="time" value={dayAvail.to}
                        onChange={(e) => setAvailability((a) => ({ ...a, [day]: { ...a[day], to: e.target.value } }))}
                        className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-lg dark:border-white/10 dark:bg-gray-800 text-brand-charcoal-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30" />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Closed</span>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={handleSave}
            className="flex items-center justify-center w-full gap-2 py-3 text-sm font-semibold transition-colors bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark rounded-xl">
            <Save size={14} /> Save Schedule
          </button>
        </div>
      )}

      {/* ── Portfolio ─────────────────────────────────────── */}
      {activeTab === 'portfolio' && (
        <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Portfolio</h3>
            <button className="text-xs px-3 py-1.5 rounded-lg bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark font-semibold flex items-center gap-1">
              <Plus size={12} /> Add Project
            </button>
          </div>
          <p className="text-xs text-gray-400">Showcase your best work. Photos and descriptions help clients trust your quality.</p>

          {portfolio.length === 0 ? (
            <div className="py-8 text-center">
              <Image size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-400">No portfolio items yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {portfolio.map((p) => (
                <div key={p.id} className="flex gap-3 p-3 border border-gray-100 rounded-xl dark:border-white/10 group">
                  <div className="flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-xl shrink-0">
                    <Image size={20} className="text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-charcoal-dark dark:text-white">{p.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 mt-1 inline-block capitalize">{p.category}</span>
                  </div>
                  <div className="flex flex-col gap-1 transition-opacity opacity-0 group-hover:opacity-100">
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"><Edit size={12} className="text-gray-400" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 size={12} className="text-red-400" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Certifications ────────────────────────────────── */}
      {activeTab === 'certs' && (
        <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Certifications & Licenses</h3>
            <button className="text-xs px-3 py-1.5 rounded-lg bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark font-semibold flex items-center gap-1">
              <Plus size={12} /> Add Cert
            </button>
          </div>

          <div className="space-y-2">
            {certifications.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl dark:border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.verified ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-gray-100 dark:bg-white/10'}`}>
                    {c.verified ? <CheckCircle size={16} className="text-emerald-500" /> : <Clock size={16} className="text-gray-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-charcoal-dark dark:text-white">{c.name}</p>
                    <p className="text-[10px] text-gray-400">{c.issuer} · {c.year}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-medium ${c.verified ? 'text-emerald-600' : 'text-yellow-600'}`}>
                  {c.verified ? 'Verified' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Social Links ──────────────────────────────────── */}
      {activeTab === 'social' && (
        <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Social & Web Links</h3>
          <p className="text-xs text-gray-400">Add your social media and website links. These appear on your public profile.</p>

          {[
            { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://yoursite.com' },
            { key: 'instagram', label: 'Instagram', icon: Camera, placeholder: '@username' },
            { key: 'facebook', label: 'Facebook', icon: User, placeholder: 'facebook.com/yourpage' },
            { key: 'linkedin', label: 'LinkedIn', icon: Briefcase, placeholder: 'linkedin.com/in/yourname' },
            { key: 'twitter', label: 'X (Twitter)', icon: MessageCircle, placeholder: '@username' },
            { key: 'tiktok', label: 'TikTok', icon: Star, placeholder: '@username' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg dark:bg-white/10 shrink-0">
                  <Icon size={14} className="text-gray-400" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-gray-400 mb-0.5 block">{s.label}</label>
                  <input value={socialLinks[s.key]} onChange={(e) => updateSocial(s.key, e.target.value)}
                    placeholder={s.placeholder}
                    className="w-full px-3 py-2 text-xs placeholder-gray-400 bg-white border border-gray-200 rounded-lg dark:border-white/10 dark:bg-gray-800 text-brand-charcoal-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30" />
                </div>
              </div>
            );
          })}

          <button onClick={handleSave}
            className="flex items-center justify-center w-full gap-2 py-3 text-sm font-semibold transition-colors bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark rounded-xl">
            <Save size={14} /> Save Links
          </button>
        </div>
      )}
    </div>
  );
}