import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, User, Building2, Shield, Bell, Wallet, FileText,
  Plus, ChevronRight, ChevronDown, ChevronUp, Check, X,
  Eye, EyeOff, Lock, Smartphone, Mail, Globe, Camera,
  AlertCircle, CheckCircle, Clock, Trash2, Edit, Save,
  Briefcase, HardHat, Wrench, Home, ShoppingBag, Truck,
  Palette, Hammer, Zap, Droplets, Bug, Flame, TreePine,
  MonitorSmartphone, Scale, Landmark, Award, Star, Info,
  CreditCard, BadgeCheck, Upload, MapPin, Phone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

/* ════════════════════════════════════════════════════════════
   PROVIDER SETTINGS — Comprehensive, role-aware

   Sections:
   1. Account Type (Individual ↔ Company toggle)
   2. Personal / Company Information
   3. Services Management (multi-service w/ compliance)
   4. Verification & Documents
   5. Security & Login
   6. Notifications
   7. Payout Settings
   8. Danger Zone

   Key behaviors:
   • Individual vs Company → different fields
   • Each service type has unique compliance questions
   • Adding new service triggers compliance flow
   • Company accounts get team management, CAC, tax fields
════════════════════════════════════════════════════════════ */

/* ── Service types with their compliance requirements ──── */
const SERVICE_TYPES = {
  'property-rental': {
    label: 'Property Rental',
    icon: Home,
    description: 'Rental apartments, houses, rooms',
    compliance: [
      { id: 'ownership_proof', label: 'Do you have proof of ownership or authorized management?', type: 'confirm' },
      { id: 'property_insurance', label: 'Do you have property insurance?', type: 'select', options: ['Yes — comprehensive', 'Yes — basic', 'No — applying', 'No'] },
      { id: 'fire_safety', label: 'Is the property equipped with fire safety equipment?', type: 'confirm' },
      { id: 'lga_permit', label: 'Do you have a valid LGA permit for renting?', type: 'confirm' },
      { id: 'maintenance_plan', label: 'Do you have a maintenance plan in place?', type: 'confirm' },
    ],
  },
  'property-sale': {
    label: 'Property Sales',
    icon: Landmark,
    description: 'Selling properties, land, estates',
    compliance: [
      { id: 'title_doc', label: 'What title document do you have?', type: 'select', options: ['Certificate of Occupancy (C of O)', 'Governor\'s Consent', 'Deed of Assignment', 'Survey Plan Only', 'Other'] },
      { id: 'land_verified', label: 'Has the land been verified by a licensed surveyor?', type: 'confirm' },
      { id: 'family_consent', label: 'For family land: Do you have family consent documentation?', type: 'select', options: ['Yes', 'Not applicable', 'In progress'] },
      { id: 'excision_status', label: 'Excision or gazette status', type: 'select', options: ['Excised', 'Gazetted', 'Pending', 'Not applicable'] },
      { id: 'registered_agent', label: 'Are you a registered estate agent?', type: 'confirm' },
    ],
  },
  'shortlet': {
    label: 'Short-let / Serviced Apartments',
    icon: Building2,
    description: 'Daily/weekly apartment rentals',
    compliance: [
      { id: 'shortlet_license', label: 'Do you have a short-let operation license?', type: 'confirm' },
      { id: 'furnished', label: 'Are your units fully furnished?', type: 'confirm' },
      { id: 'security_available', label: 'Is 24/7 security available?', type: 'confirm' },
      { id: 'cleaning_service', label: 'Do you provide professional cleaning between guests?', type: 'confirm' },
      { id: 'cancellation_policy', label: 'Your cancellation policy', type: 'select', options: ['Flexible (24hr)', 'Moderate (48hr)', 'Strict (7 days)', 'Non-refundable'] },
      { id: 'max_guests', label: 'Maximum guest capacity management system in place?', type: 'confirm' },
    ],
  },
  'plumbing': {
    label: 'Plumbing Services',
    icon: Droplets,
    description: 'Pipe fitting, repairs, installations',
    compliance: [
      { id: 'plumbing_cert', label: 'Do you have a professional plumbing certification?', type: 'confirm' },
      { id: 'experience_years', label: 'Years of experience', type: 'select', options: ['1-2 years', '3-5 years', '5-10 years', '10+ years'] },
      { id: 'insurance_coverage', label: 'Do you carry professional liability insurance?', type: 'confirm' },
      { id: 'emergency_available', label: 'Do you offer emergency/after-hours service?', type: 'confirm' },
      { id: 'warranty', label: 'Do you provide warranty on your work?', type: 'select', options: ['30 days', '90 days', '6 months', '1 year', 'No warranty'] },
    ],
  },
  'electrical': {
    label: 'Electrical Services',
    icon: Zap,
    description: 'Wiring, repairs, installations',
    compliance: [
      { id: 'electrical_license', label: 'Do you have a valid electrical contractor license?', type: 'confirm' },
      { id: 'safety_training', label: 'Are you certified in electrical safety (e.g., IET Wiring Regulations)?', type: 'confirm' },
      { id: 'experience_years', label: 'Years of experience', type: 'select', options: ['1-2 years', '3-5 years', '5-10 years', '10+ years'] },
      { id: 'insurance_coverage', label: 'Do you carry professional liability insurance?', type: 'confirm' },
      { id: 'solar_capable', label: 'Can you install and maintain solar power systems?', type: 'confirm' },
    ],
  },
  'construction': {
    label: 'Construction & Building',
    icon: HardHat,
    description: 'Building, renovation, construction',
    compliance: [
      { id: 'contractor_license', label: 'Do you have a contractor registration with CORBON?', type: 'confirm' },
      { id: 'project_types', label: 'What project types do you handle?', type: 'select', options: ['Residential only', 'Commercial only', 'Both residential & commercial', 'Industrial'] },
      { id: 'team_size', label: 'Average team size', type: 'select', options: ['1-5 workers', '6-15 workers', '16-30 workers', '30+ workers'] },
      { id: 'safety_record', label: 'Do you have a documented safety record?', type: 'confirm' },
      { id: 'insurance', label: 'Do you carry construction all-risk insurance?', type: 'confirm' },
      { id: 'timeline_guarantee', label: 'Do you offer completion timeline guarantees?', type: 'confirm' },
    ],
  },
  'interior-design': {
    label: 'Interior Design',
    icon: Palette,
    description: 'Interior decoration, furnishing',
    compliance: [
      { id: 'portfolio', label: 'Do you have a professional portfolio of past work?', type: 'confirm' },
      { id: 'design_software', label: 'Do you use professional design software (AutoCAD, SketchUp, etc.)?', type: 'confirm' },
      { id: 'style_specialization', label: 'Design style specialization', type: 'select', options: ['Modern/Contemporary', 'Traditional/Classic', 'Minimalist', 'Eclectic', 'All styles'] },
      { id: 'material_sourcing', label: 'Do you handle material sourcing and procurement?', type: 'confirm' },
    ],
  },
  'cleaning': {
    label: 'Cleaning Services',
    icon: Bug,
    description: 'Residential & commercial cleaning',
    compliance: [
      { id: 'cleaning_products', label: 'Do you use eco-friendly cleaning products?', type: 'select', options: ['Always', 'Upon request', 'No'] },
      { id: 'background_checks', label: 'Have your staff undergone background checks?', type: 'confirm' },
      { id: 'equipment_owned', label: 'Do you own professional cleaning equipment?', type: 'confirm' },
      { id: 'deep_cleaning', label: 'Do you offer deep cleaning / post-construction cleaning?', type: 'confirm' },
    ],
  },
  'pest-control': {
    label: 'Pest Control / Fumigation',
    icon: Bug,
    description: 'Fumigation, pest management',
    compliance: [
      { id: 'fumigation_license', label: 'Do you have a NAFDAC-approved fumigation license?', type: 'confirm' },
      { id: 'chemicals_approved', label: 'Are all chemicals used government-approved and safe?', type: 'confirm' },
      { id: 'safety_equipment', label: 'Do your team use proper safety equipment (PPE)?', type: 'confirm' },
      { id: 'follow_up', label: 'Do you offer follow-up visits?', type: 'select', options: ['Free follow-up within 30 days', 'Paid follow-up', 'No follow-up'] },
    ],
  },
  'product-seller': {
    label: 'Real Estate Products',
    icon: ShoppingBag,
    description: 'Building materials, furniture, fixtures',
    compliance: [
      { id: 'product_source', label: 'Are your products sourced from verified manufacturers?', type: 'confirm' },
      { id: 'warranty_offered', label: 'Do you offer product warranty?', type: 'select', options: ['Manufacturer warranty', 'Store warranty', 'Both', 'No warranty'] },
      { id: 'delivery_available', label: 'Do you offer delivery services?', type: 'confirm' },
      { id: 'return_policy', label: 'Return policy', type: 'select', options: ['7-day returns', '14-day returns', '30-day returns', 'No returns', 'Exchange only'] },
      { id: 'bulk_orders', label: 'Do you handle bulk/contractor orders?', type: 'confirm' },
    ],
  },
  'moving': {
    label: 'Moving & Logistics',
    icon: Truck,
    description: 'House/office moving, logistics',
    compliance: [
      { id: 'vehicle_fleet', label: 'Do you own your vehicle fleet?', type: 'select', options: ['Yes — full fleet', 'Partial (own + contracted)', 'All contracted vehicles'] },
      { id: 'insurance_transit', label: 'Do you provide goods-in-transit insurance?', type: 'confirm' },
      { id: 'packing_service', label: 'Do you offer professional packing services?', type: 'confirm' },
      { id: 'interstate', label: 'Do you handle interstate relocations?', type: 'confirm' },
    ],
  },
  'landscaping': {
    label: 'Landscaping & Gardening',
    icon: TreePine,
    description: 'Garden design, lawn care, landscaping',
    compliance: [
      { id: 'equipment_owned', label: 'Do you own landscaping equipment?', type: 'confirm' },
      { id: 'design_capable', label: 'Do you offer landscape design services?', type: 'confirm' },
      { id: 'maintenance_contracts', label: 'Do you offer ongoing maintenance contracts?', type: 'confirm' },
    ],
  },
  'smart-home': {
    label: 'Smart Home / Tech Installation',
    icon: MonitorSmartphone,
    description: 'Smart home, CCTV, automation',
    compliance: [
      { id: 'brand_partnerships', label: 'Are you an authorized installer for any brands?', type: 'confirm' },
      { id: 'network_setup', label: 'Can you handle full network infrastructure setup?', type: 'confirm' },
      { id: 'support_available', label: 'Do you provide after-installation technical support?', type: 'select', options: ['24/7 support', 'Business hours only', 'By appointment', 'No ongoing support'] },
    ],
  },
  'legal-survey': {
    label: 'Legal / Survey Services',
    icon: Scale,
    description: 'Property law, surveying, documentation',
    compliance: [
      { id: 'bar_membership', label: 'Are you a member of the Nigerian Bar Association?', type: 'confirm' },
      { id: 'surcon_reg', label: 'Are you registered with SURCON (for surveyors)?', type: 'confirm' },
      { id: 'specialization', label: 'Area of specialization', type: 'select', options: ['Property Law', 'Land Survey', 'Title Perfection', 'Due Diligence', 'Multiple areas'] },
      { id: 'court_representation', label: 'Do you offer court representation for property disputes?', type: 'confirm' },
    ],
  },
};

/* ── Settings section navigation ──────────────────────────── */
const SECTIONS = [
  { id: 'account',       label: 'Account Type',           icon: User },
  { id: 'personal',      label: 'Personal / Company Info', icon: Building2 },
  { id: 'services',      label: 'Services',               icon: Briefcase },
  { id: 'verification',  label: 'Verification',           icon: BadgeCheck },
  { id: 'privacy',       label: 'Privacy',                icon: Eye },
  { id: 'security',      label: 'Security & Login',       icon: Shield },
  { id: 'notifications', label: 'Notifications',          icon: Bell },
  { id: 'payouts',       label: 'Payout Settings',        icon: Wallet },
  { id: 'danger',        label: 'Danger Zone',            icon: AlertCircle },
];

export default function Settings() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('account');
  const [saved, setSaved] = useState(false);

  /* ── Account state ──────────────────────────────────────── */
  const [accountType, setAccountType] = useState('individual'); // 'individual' | 'company'

  /* ── Personal info (individual) ─────────────────────────── */
  const [personalInfo, setPersonalInfo] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: '+234 812 345 6789',
    whatsapp: '+234 812 345 6789',
    bio: 'Experienced property manager and real estate professional based in Lagos. Specializing in residential rentals and property sales in Lekki, Ikoyi, and Victoria Island.',
    address: '15 Admiralty Way, Lekki Phase 1',
    city: 'Lagos',
    state: 'Lagos',
    lga: 'Eti-Osa',
    languages: ['English', 'Yoruba'],
    responseTime: '< 1 hour',
  });

  /* ── Company info ───────────────────────────────────────── */
  const [companyInfo, setCompanyInfo] = useState({
    companyName: '',
    rcNumber: '',
    cacCertificate: null,
    tinNumber: '',
    companyEmail: '',
    companyPhone: '',
    website: '',
    companyAddress: '',
    companyCity: 'Lagos',
    companyState: 'Lagos',
    companyLga: '',
    yearEstablished: '',
    teamSize: '1-5',
    description: '',
    ceo: '',
    contactPerson: '',
    contactPersonRole: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
  });

  /* ── Services ───────────────────────────────────────────── */
  const [activeServices, setActiveServices] = useState([
    { type: 'property-rental', enabled: true, compliance: { ownership_proof: true, property_insurance: 'Yes — comprehensive', fire_safety: true, lga_permit: true, maintenance_plan: true } },
    { type: 'plumbing', enabled: true, compliance: { plumbing_cert: true, experience_years: '5-10 years', insurance_coverage: true, emergency_available: true, warranty: '90 days' } },
  ]);
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceType, setNewServiceType] = useState(null);
  const [newServiceCompliance, setNewServiceCompliance] = useState({});
  const [expandedService, setExpandedService] = useState(null);

  /* ── Security ───────────────────────────────────────────── */
  const [twoFactor, setTwoFactor] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginSessions, setLoginSessions] = useState([
    { device: 'Chrome on MacBook Pro', location: 'Lagos, Nigeria', lastActive: 'Now', current: true },
    { device: 'Aurban App on iPhone 15', location: 'Lagos, Nigeria', lastActive: '2 hours ago', current: false },
  ]);

  /* ── Notifications ──────────────────────────────────────── */
  const [notifications, setNotifications] = useState({
    newInquiry: { email: true, push: true, sms: true },
    newBooking: { email: true, push: true, sms: true },
    newReview: { email: true, push: true, sms: false },
    payoutUpdate: { email: true, push: true, sms: false },
    listingExpiry: { email: true, push: true, sms: false },
    promotions: { email: false, push: false, sms: false },
    weeklyReport: { email: true, push: false, sms: false },
    agreementUpdate: { email: true, push: true, sms: true },
  });

  /* ── Payout ─────────────────────────────────────────────── */
  const [payoutInfo, setPayoutInfo] = useState({
    bankName: 'GTBank',
    accountName: user?.name || '',
    accountNumber: '0123456789',
    payoutSchedule: 'weekly',
    minimumPayout: '10000',
    currency: 'NGN',
  });

  /* ── Privacy / Visibility ──────────────────────────────── */
  const [privacy, setPrivacy] = useState({
    showPhone:          true,
    showEmail:          false,
    showExactAddress:   false,
    showResponseTime:   true,
    showCompletedDeals: true,
    showReviews:        true,
    showJoinDate:       true,
    showListingCount:   true,
    allowUserMessages:  true,
    showOnlineStatus:   true,
  });
  const updatePrivacy = (key, value) => setPrivacy((p) => ({ ...p, [key]: value }));

  /* ── Save handler ───────────────────────────────────────── */
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  /* ── Add service flow ───────────────────────────────────── */
  const handleAddService = () => {
    if (!newServiceType) return;
    setActiveServices((prev) => [...prev, {
      type: newServiceType,
      enabled: true,
      compliance: { ...newServiceCompliance },
    }]);
    setNewServiceType(null);
    setNewServiceCompliance({});
    setShowAddService(false);
  };

  const removeService = (type) => {
    setActiveServices((prev) => prev.filter((s) => s.type !== type));
  };

  const availableServices = Object.entries(SERVICE_TYPES).filter(
    ([key]) => !activeServices.some((s) => s.type === key)
  );

  /* ── Field updater helpers ──────────────────────────────── */
  const updatePersonal = (key, value) => setPersonalInfo((p) => ({ ...p, [key]: value }));
  const updateCompany = (key, value) => setCompanyInfo((p) => ({ ...p, [key]: value }));
  const updateNotif = (key, channel, value) => setNotifications((n) => ({ ...n, [key]: { ...n[key], [channel]: value } }));
  const updatePayout = (key, value) => setPayoutInfo((p) => ({ ...p, [key]: value }));

  /* ── Input component ────────────────────────────────────── */
  const Field = ({ label, value, onChange, type = 'text', placeholder, required, helpText, disabled }) => (
    <div>
      <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} disabled={disabled}
          className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-brand-charcoal-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold resize-none disabled:opacity-50" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
          className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-brand-charcoal-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold/30 focus:border-brand-gold disabled:opacity-50" />
      )}
      {helpText && <p className="text-[10px] text-gray-400 mt-1">{helpText}</p>}
    </div>
  );

  /* ── Toggle ─────────────────────────────────────────────── */
  const Toggle = ({ enabled, onChange, label, description }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm text-brand-charcoal-dark dark:text-white">{label}</p>
        {description && <p className="text-[10px] text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-brand-gold' : 'bg-gray-300 dark:bg-gray-700'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold font-display text-brand-charcoal-dark dark:text-white">Settings</h2>
          <p className="text-xs text-gray-400 mt-0.5">Manage your provider account</p>
        </div>
        {saved && (
          <span className="text-xs text-emerald-600 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full">
            <CheckCircle size={12} /> Saved
          </span>
        )}
      </div>

      {/* ── Section navigation (horizontal scroll on mobile) ── */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const active = activeSection === s.id;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0
                ${active ? 'bg-brand-charcoal-dark text-white shadow-sm' : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10'}`}>
              <Icon size={13} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION: Account Type
      ══════════════════════════════════════════════════════ */}
      {activeSection === 'account' && (
        <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Account Type</h3>
          <p className="text-xs text-gray-400">Choose whether you operate as an individual or a registered company. Company accounts get advanced features like team management, CAC documentation, and corporate billing.</p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'individual', label: 'Individual', desc: 'Sole proprietor or freelancer', icon: User },
              { key: 'company', label: 'Company', desc: 'Registered business entity', icon: Building2 },
            ].map((t) => {
              const Icon = t.icon;
              const active = accountType === t.key;
              return (
                <button key={t.key} onClick={() => setAccountType(t.key)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${active ? 'border-brand-gold bg-brand-gold/5' : 'border-gray-200 dark:border-white/10 hover:border-gray-300'}`}>
                  <Icon size={20} className={active ? 'text-brand-gold' : 'text-gray-400'} />
                  <p className={`text-sm font-semibold mt-2 ${active ? 'text-brand-charcoal-dark dark:text-white' : 'text-gray-500'}`}>{t.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
                  {active && <CheckCircle size={14} className="mt-2 text-brand-gold" />}
                </button>
              );
            })}
          </div>

          {accountType === 'company' && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
              <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Company accounts require CAC registration number and TIN. You'll also get access to team management, corporate analytics, and higher transaction limits.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION: Personal / Company Info
      ══════════════════════════════════════════════════════ */}
      {activeSection === 'personal' && (
        <div className="space-y-4">
          {accountType === 'individual' ? (
            /* ── Individual fields ─────────────────────────── */
            <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
              <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Personal Information</h3>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center w-16 h-16 text-xl font-bold rounded-full bg-brand-gold/20 text-brand-gold">
                  {personalInfo.firstName[0]}{personalInfo.lastName[0]}
                  <button className="absolute flex items-center justify-center text-white rounded-full shadow -bottom-1 -right-1 w-7 h-7 bg-brand-gold">
                    <Camera size={12} />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-charcoal-dark dark:text-white">Profile Photo</p>
                  <p className="text-[10px] text-gray-400">JPG or PNG, max 5MB</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="First Name" value={personalInfo.firstName} onChange={(v) => updatePersonal('firstName', v)} required />
                <Field label="Last Name" value={personalInfo.lastName} onChange={(v) => updatePersonal('lastName', v)} required />
              </div>
              <Field label="Email" value={personalInfo.email} onChange={(v) => updatePersonal('email', v)} type="email" required />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone Number" value={personalInfo.phone} onChange={(v) => updatePersonal('phone', v)} type="tel" required />
                <Field label="WhatsApp" value={personalInfo.whatsapp} onChange={(v) => updatePersonal('whatsapp', v)} type="tel" />
              </div>
              <Field label="Bio / About" value={personalInfo.bio} onChange={(v) => updatePersonal('bio', v)} type="textarea" placeholder="Tell potential clients about yourself..." />
              <Field label="Address" value={personalInfo.address} onChange={(v) => updatePersonal('address', v)} />
              <div className="grid grid-cols-3 gap-3">
                <Field label="City" value={personalInfo.city} onChange={(v) => updatePersonal('city', v)} />
                <Field label="State" value={personalInfo.state} onChange={(v) => updatePersonal('state', v)} />
                <Field label="LGA" value={personalInfo.lga} onChange={(v) => updatePersonal('lga', v)} />
              </div>
              <Field label="Typical Response Time" value={personalInfo.responseTime} onChange={(v) => updatePersonal('responseTime', v)} helpText="Displayed on your public profile" />

              <button onClick={handleSave}
                className="flex items-center justify-center w-full gap-2 py-3 text-sm font-semibold transition-colors bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark rounded-xl">
                <Save size={14} /> Save Changes
              </button>
            </div>
          ) : (
            /* ── Company fields ────────────────────────────── */
            <div className="space-y-4">
              <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                  <Building2 size={16} className="text-brand-gold" /> Company Information
                </h3>

                {/* Company logo */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-xl">
                    <Building2 size={24} className="text-gray-400" />
                  </div>
                  <div>
                    <button className="text-xs px-3 py-1.5 rounded-lg bg-brand-gold/10 text-brand-gold font-medium hover:bg-brand-gold/20 transition-colors flex items-center gap-1">
                      <Upload size={10} /> Upload Logo
                    </button>
                    <p className="text-[10px] text-gray-400 mt-1">PNG or SVG, min 200×200px</p>
                  </div>
                </div>

                <Field label="Company Name" value={companyInfo.companyName} onChange={(v) => updateCompany('companyName', v)} required />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="RC Number" value={companyInfo.rcNumber} onChange={(v) => updateCompany('rcNumber', v)} required helpText="CAC Registration Number" />
                  <Field label="TIN" value={companyInfo.tinNumber} onChange={(v) => updateCompany('tinNumber', v)} helpText="Tax Identification Number" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Company Email" value={companyInfo.companyEmail} onChange={(v) => updateCompany('companyEmail', v)} type="email" required />
                  <Field label="Company Phone" value={companyInfo.companyPhone} onChange={(v) => updateCompany('companyPhone', v)} type="tel" required />
                </div>
                <Field label="Website" value={companyInfo.website} onChange={(v) => updateCompany('website', v)} placeholder="https://" />
                <Field label="Company Description" value={companyInfo.description} onChange={(v) => updateCompany('description', v)} type="textarea" />
                <Field label="Company Address" value={companyInfo.companyAddress} onChange={(v) => updateCompany('companyAddress', v)} />
                <div className="grid grid-cols-3 gap-3">
                  <Field label="City" value={companyInfo.companyCity} onChange={(v) => updateCompany('companyCity', v)} />
                  <Field label="State" value={companyInfo.companyState} onChange={(v) => updateCompany('companyState', v)} />
                  <Field label="LGA" value={companyInfo.companyLga} onChange={(v) => updateCompany('companyLga', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Year Established" value={companyInfo.yearEstablished} onChange={(v) => updateCompany('yearEstablished', v)} type="number" />
                  <div>
                    <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Team Size</label>
                    <select value={companyInfo.teamSize} onChange={(e) => updateCompany('teamSize', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-brand-charcoal-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30">
                      <option value="1-5">1–5 employees</option>
                      <option value="6-15">6–15 employees</option>
                      <option value="16-50">16–50 employees</option>
                      <option value="50+">50+ employees</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact person (company only) */}
              <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                  <User size={16} className="text-brand-gold" /> Primary Contact Person
                </h3>
                <Field label="Full Name" value={companyInfo.contactPerson} onChange={(v) => updateCompany('contactPerson', v)} required />
                <Field label="Role / Title" value={companyInfo.contactPersonRole} onChange={(v) => updateCompany('contactPersonRole', v)} placeholder="e.g. Managing Director, Property Manager" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone" value={companyInfo.contactPersonPhone} onChange={(v) => updateCompany('contactPersonPhone', v)} type="tel" required />
                  <Field label="Email" value={companyInfo.contactPersonEmail} onChange={(v) => updateCompany('contactPersonEmail', v)} type="email" />
                </div>
              </div>

              {/* CAC upload (company only) */}
              <div className="p-5 space-y-3 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                  <FileText size={16} className="text-brand-gold" /> CAC Certificate
                </h3>
                <div className="p-6 text-center border-2 border-gray-200 border-dashed dark:border-white/10 rounded-xl">
                  <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-xs text-gray-400">Upload your CAC certificate (PDF, JPG, PNG)</p>
                  <button className="px-4 py-2 mt-2 text-xs font-medium rounded-lg bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20">
                    Choose File
                  </button>
                </div>
              </div>

              <button onClick={handleSave}
                className="flex items-center justify-center w-full gap-2 py-3 text-sm font-semibold transition-colors bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark rounded-xl">
                <Save size={14} /> Save Company Details
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION: Services Management
      ══════════════════════════════════════════════════════ */}
      {activeSection === 'services' && (
        <div className="space-y-4">
          <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Active Services</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{activeServices.length} service{activeServices.length !== 1 ? 's' : ''} configured</p>
              </div>
              <button onClick={() => setShowAddService(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark font-semibold transition-colors flex items-center gap-1">
                <Plus size={12} /> Add Service
              </button>
            </div>

            {activeServices.length === 0 ? (
              <div className="py-8 text-center">
                <Briefcase size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-400">No services configured yet</p>
                <button onClick={() => setShowAddService(true)}
                  className="inline-block mt-2 text-xs font-medium text-brand-gold">
                  Add your first service →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {activeServices.map((svc) => {
                  const svcConfig = SERVICE_TYPES[svc.type];
                  if (!svcConfig) return null;
                  const Icon = svcConfig.icon;
                  const isExpanded = expandedService === svc.type;

                  return (
                    <div key={svc.type} className="overflow-hidden border border-gray-100 dark:border-white/10 rounded-xl">
                      <button onClick={() => setExpandedService(isExpanded ? null : svc.type)}
                        className="flex items-center w-full gap-3 p-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-gold/10 shrink-0">
                          <Icon size={16} className="text-brand-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-brand-charcoal-dark dark:text-white">{svcConfig.label}</p>
                          <p className="text-[10px] text-gray-400">{svcConfig.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 font-medium flex items-center gap-0.5">
                            <CheckCircle size={8} /> Active
                          </span>
                          {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-3 space-y-3 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Compliance Answers</p>
                          {svcConfig.compliance.map((q) => (
                            <div key={q.id} className="flex items-center justify-between py-1">
                              <p className="flex-1 pr-3 text-xs text-gray-600 dark:text-gray-300">{q.label}</p>
                              <span className="text-xs font-medium text-brand-gold shrink-0">
                                {typeof svc.compliance[q.id] === 'boolean' ? (svc.compliance[q.id] ? 'Yes ✓' : 'No ✗') : svc.compliance[q.id] || '—'}
                              </span>
                            </div>
                          ))}
                          <div className="flex gap-2 pt-2">
                            <button className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 hover:bg-gray-200 flex items-center gap-1">
                              <Edit size={10} /> Edit Answers
                            </button>
                            <button onClick={() => removeService(svc.type)}
                              className="text-xs px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-100 flex items-center gap-1">
                              <Trash2 size={10} /> Remove Service
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Add Service Modal ────────────────────────── */}
          {showAddService && (
            <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/40 lg:items-center">
              <div className="bg-white dark:bg-gray-900 rounded-t-2xl lg:rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b border-gray-100 dark:bg-gray-900 dark:border-white/10">
                  <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">
                    {newServiceType ? `Compliance — ${SERVICE_TYPES[newServiceType]?.label}` : 'Add New Service'}
                  </h3>
                  <button onClick={() => { setShowAddService(false); setNewServiceType(null); setNewServiceCompliance({}); }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>

                <div className="p-4">
                  {!newServiceType ? (
                    /* ── Service picker ──────────────────── */
                    <div className="space-y-2">
                      <p className="mb-3 text-xs text-gray-400">Select a service to add to your profile. You'll need to answer compliance questions specific to that service.</p>
                      {availableServices.length === 0 ? (
                        <p className="py-8 text-sm text-center text-gray-400">You've added all available services!</p>
                      ) : (
                        availableServices.map(([key, config]) => {
                          const Icon = config.icon;
                          return (
                            <button key={key} onClick={() => setNewServiceType(key)}
                              className="flex items-center w-full gap-3 p-3 text-left transition-all border border-gray-100 rounded-xl dark:border-white/10 hover:border-brand-gold hover:bg-brand-gold/5">
                              <div className="flex items-center justify-center bg-gray-100 rounded-lg w-9 h-9 dark:bg-white/10 shrink-0">
                                <Icon size={16} className="text-gray-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-brand-charcoal-dark dark:text-white">{config.label}</p>
                                <p className="text-[10px] text-gray-400">{config.description}</p>
                              </div>
                              <ChevronRight size={14} className="ml-auto text-gray-400 shrink-0" />
                            </button>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    /* ── Compliance questions ────────────── */
                    <div className="space-y-4">
                      <div className="flex items-start gap-2 p-3 bg-brand-gold/5 rounded-xl">
                        <Shield size={14} className="text-brand-gold shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Please answer these compliance questions to activate <strong>{SERVICE_TYPES[newServiceType]?.label}</strong>. These help us verify your qualifications and build trust with clients.
                        </p>
                      </div>

                      {SERVICE_TYPES[newServiceType]?.compliance.map((q) => (
                        <div key={q.id} className="space-y-1.5">
                          <p className="text-xs font-medium text-brand-charcoal-dark dark:text-white">{q.label}</p>
                          {q.type === 'confirm' ? (
                            <div className="flex gap-3">
                              {['Yes', 'No'].map((opt) => (
                                <button key={opt} onClick={() => setNewServiceCompliance((p) => ({ ...p, [q.id]: opt === 'Yes' }))}
                                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                                    newServiceCompliance[q.id] === (opt === 'Yes')
                                      ? 'bg-brand-gold text-brand-charcoal-dark'
                                      : 'bg-gray-100 dark:bg-white/10 text-gray-500 hover:bg-gray-200'
                                  }`}>
                                  {opt}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <select
                              value={newServiceCompliance[q.id] || ''}
                              onChange={(e) => setNewServiceCompliance((p) => ({ ...p, [q.id]: e.target.value }))}
                              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-brand-charcoal-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30">
                              <option value="">Select...</option>
                              {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
                            </select>
                          )}
                        </div>
                      ))}

                      <div className="flex gap-2 pt-3">
                        <button onClick={() => { setNewServiceType(null); setNewServiceCompliance({}); }}
                          className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 text-sm font-medium hover:bg-gray-200">
                          Back
                        </button>
                        <button onClick={handleAddService}
                          className="flex-1 py-2.5 rounded-xl bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark text-sm font-semibold transition-colors flex items-center justify-center gap-1">
                          <CheckCircle size={14} /> Add Service
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION: Verification
      ══════════════════════════════════════════════════════ */}
      {activeSection === 'verification' && (
        <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Verification & Documents</h3>

          <div className="space-y-2">
            {[
              { label: 'Phone Number', status: 'verified', detail: '+234 812 *** 6789' },
              { label: 'Email Address', status: 'verified', detail: user?.email },
              { label: 'Government ID (NIN/BVN)', status: 'pending', detail: 'Under review' },
              { label: 'Address Verification', status: 'unverified', detail: 'Upload utility bill' },
              ...(accountType === 'company' ? [
                { label: 'CAC Certificate', status: 'unverified', detail: 'Upload required' },
                { label: 'TIN Certificate', status: 'unverified', detail: 'Upload required' },
                { label: 'Company Bank Statement', status: 'unverified', detail: 'Last 3 months required' },
              ] : []),
            ].map((v, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  {v.status === 'verified' ? <CheckCircle size={16} className="text-emerald-500" /> :
                   v.status === 'pending' ? <Clock size={16} className="text-yellow-500" /> :
                   <AlertCircle size={16} className="text-gray-400" />}
                  <div>
                    <p className="text-sm text-brand-charcoal-dark dark:text-white">{v.label}</p>
                    <p className="text-[10px] text-gray-400">{v.detail}</p>
                  </div>
                </div>
                {v.status === 'unverified' && (
                  <button className="text-xs px-3 py-1.5 rounded-lg bg-brand-gold/10 text-brand-gold font-medium hover:bg-brand-gold/20 flex items-center gap-1">
                    <Upload size={10} /> Upload
                  </button>
                )}
                {v.status === 'verified' && (
                  <span className="text-[10px] text-emerald-600 font-medium">Verified ✓</span>
                )}
                {v.status === 'pending' && (
                  <span className="text-[10px] text-yellow-600 font-medium">Reviewing...</span>
                )}
              </div>
            ))}
          </div>

          {/* Tier progress */}
          <div className="pt-4 border-t border-gray-100 dark:border-white/10">
            <p className="flex items-center gap-1 mb-2 text-xs font-semibold text-brand-charcoal-dark dark:text-white">
              <Award size={14} className="text-brand-gold" /> Provider Tier Progress
            </p>
            <div className="flex gap-1">
              {['Starter', 'Verified', 'Pro', 'Elite'].map((tier, i) => (
                <div key={tier} className={`flex-1 text-center py-2 rounded-lg text-[10px] font-medium ${i <= 1 ? 'bg-brand-gold text-brand-charcoal-dark' : 'bg-gray-100 dark:bg-white/10 text-gray-400'}`}>
                  {tier}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Complete address verification to reach Pro tier</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION: Privacy & Visibility
      ══════════════════════════════════════════════════════ */}
      {activeSection === 'privacy' && (
        <div className="space-y-4">
          <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Profile Visibility</h3>
            <p className="text-xs text-gray-400">Control what information users and visitors can see on your public profile and in messaging.</p>

            <div className="space-y-1">
              <Toggle enabled={privacy.showPhone} onChange={(v) => updatePrivacy('showPhone', v)}
                label="Show phone number" description="Users can see your contact number on your profile" />
              <Toggle enabled={privacy.showEmail} onChange={(v) => updatePrivacy('showEmail', v)}
                label="Show email address" description="Display your email on your public profile" />
              <Toggle enabled={privacy.showExactAddress} onChange={(v) => updatePrivacy('showExactAddress', v)}
                label="Show exact address" description="If off, only city/area is shown" />
              <Toggle enabled={privacy.showJoinDate} onChange={(v) => updatePrivacy('showJoinDate', v)}
                label="Show join date" description="Users can see when you joined Aurban" />
            </div>
          </div>

          <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Messaging Privacy</h3>
            <p className="text-xs text-gray-400">Control what users see when they message you or view your info in conversations.</p>

            <div className="space-y-1">
              <Toggle enabled={privacy.allowUserMessages} onChange={(v) => updatePrivacy('allowUserMessages', v)}
                label="Allow messages from users" description="Users can initiate conversations with you" />
              <Toggle enabled={privacy.showOnlineStatus} onChange={(v) => updatePrivacy('showOnlineStatus', v)}
                label="Show online status" description="Users can see when you are active" />
              <Toggle enabled={privacy.showResponseTime} onChange={(v) => updatePrivacy('showResponseTime', v)}
                label="Show response time" description="Display your average response time to users" />
            </div>
          </div>

          <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Business Info Visibility</h3>
            <p className="text-xs text-gray-400">Choose which business metrics are visible to potential clients.</p>

            <div className="space-y-1">
              <Toggle enabled={privacy.showCompletedDeals} onChange={(v) => updatePrivacy('showCompletedDeals', v)}
                label="Show completed deals" description="Display the number of transactions you have completed" />
              <Toggle enabled={privacy.showReviews} onChange={(v) => updatePrivacy('showReviews', v)}
                label="Show reviews" description="Users can see your review history and ratings" />
              <Toggle enabled={privacy.showListingCount} onChange={(v) => updatePrivacy('showListingCount', v)}
                label="Show listing count" description="Display total number of active listings" />
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
            <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Your name, verification badge, and listing details are always visible to users you are in conversation with. These settings control additional information shared on your public profile and in messaging.
            </p>
          </div>

          <button onClick={handleSave}
            className="flex items-center justify-center w-full gap-2 py-3 text-sm font-semibold transition-colors bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark rounded-xl">
            <Save size={14} /> Save Privacy Settings
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION: Security & Login
      ══════════════════════════════════════════════════════ */}
      {activeSection === 'security' && (
        <div className="space-y-4">
          <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Password</h3>
            <Field label="Current Password" value="" onChange={() => {}} type="password" placeholder="Enter current password" />
            <Field label="New Password" value="" onChange={() => {}} type="password" placeholder="Enter new password" />
            <Field label="Confirm New Password" value="" onChange={() => {}} type="password" placeholder="Confirm new password" />
            <button className="w-full py-3 text-sm font-semibold text-white transition-colors bg-brand-charcoal-dark hover:bg-gray-800 rounded-xl">
              Update Password
            </button>
          </div>

          <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Two-Factor Authentication</h3>
            <Toggle enabled={twoFactor} onChange={setTwoFactor} label="Enable 2FA" description="Add an extra layer of security to your account" />
            {twoFactor && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl">
                <p className="text-xs text-emerald-600">2FA is active. Authentication codes are sent to your phone via SMS.</p>
              </div>
            )}
          </div>

          <div className="p-5 space-y-3 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Active Sessions</h3>
            {loginSessions.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <Smartphone size={16} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-brand-charcoal-dark dark:text-white">{s.device}</p>
                    <p className="text-[10px] text-gray-400">{s.location} · {s.lastActive}</p>
                  </div>
                </div>
                {s.current ? (
                  <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">Current</span>
                ) : (
                  <button className="text-[10px] text-red-500 font-medium hover:text-red-600">Revoke</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION: Notifications
      ══════════════════════════════════════════════════════ */}
      {activeSection === 'notifications' && (
        <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Notification Preferences</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10">
                  <th className="py-2 pr-4 text-xs font-medium text-gray-400">Notification</th>
                  <th className="px-3 py-2 text-xs font-medium text-center text-gray-400">Email</th>
                  <th className="px-3 py-2 text-xs font-medium text-center text-gray-400">Push</th>
                  <th className="px-3 py-2 text-xs font-medium text-center text-gray-400">SMS</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { key: 'newInquiry', label: 'New inquiry received' },
                  { key: 'newBooking', label: 'New booking / service request' },
                  { key: 'newReview', label: 'New review posted' },
                  { key: 'payoutUpdate', label: 'Payout processed' },
                  { key: 'listingExpiry', label: 'Listing about to expire' },
                  { key: 'agreementUpdate', label: 'Agreement signed / updated' },
                  { key: 'weeklyReport', label: 'Weekly performance report' },
                  { key: 'promotions', label: 'Promotional offers from Aurban' },
                ].map((n) => (
                  <tr key={n.key} className="border-b border-gray-50 dark:border-white/5">
                    <td className="py-3 pr-4 text-sm text-brand-charcoal-dark dark:text-white">{n.label}</td>
                    {['email', 'push', 'sms'].map((ch) => (
                      <td key={ch} className="px-3 py-3 text-center">
                        <button onClick={() => updateNotif(n.key, ch, !notifications[n.key][ch])}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            notifications[n.key][ch] ? 'bg-brand-gold border-brand-gold' : 'border-gray-300 dark:border-white/20'
                          }`}>
                          {notifications[n.key][ch] && <Check size={10} className="text-white" />}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={handleSave}
            className="flex items-center justify-center w-full gap-2 py-3 text-sm font-semibold transition-colors bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark rounded-xl">
            <Save size={14} /> Save Preferences
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION: Payout Settings
      ══════════════════════════════════════════════════════ */}
      {activeSection === 'payouts' && (
        <div className="space-y-4">
          <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Bank Details</h3>
            <Field label="Bank Name" value={payoutInfo.bankName} onChange={(v) => updatePayout('bankName', v)} required />
            <Field label="Account Name" value={payoutInfo.accountName} onChange={(v) => updatePayout('accountName', v)} required />
            <Field label="Account Number" value={payoutInfo.accountNumber} onChange={(v) => updatePayout('accountNumber', v)} required helpText="NUBAN 10-digit account number" />
          </div>

          <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            <h3 className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Payout Preferences</h3>
            <div>
              <label className="block mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">Payout Schedule</label>
              <select value={payoutInfo.payoutSchedule} onChange={(e) => updatePayout('payoutSchedule', e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-brand-charcoal-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-gold/30">
                <option value="instant">Instant (within 24hrs)</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <Field label="Minimum Payout (₦)" value={payoutInfo.minimumPayout} onChange={(v) => updatePayout('minimumPayout', v)} type="number" helpText="Minimum amount before automatic payout triggers" />
          </div>

          <button onClick={handleSave}
            className="flex items-center justify-center w-full gap-2 py-3 text-sm font-semibold transition-colors bg-brand-gold hover:bg-brand-gold-dark text-brand-charcoal-dark rounded-xl">
            <Save size={14} /> Save Payout Settings
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION: Danger Zone
      ══════════════════════════════════════════════════════ */}
      {activeSection === 'danger' && (
        <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-red-500">
            <AlertCircle size={16} /> Danger Zone
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl dark:border-white/10">
              <div>
                <p className="text-sm text-brand-charcoal-dark dark:text-white">Pause All Listings</p>
                <p className="text-[10px] text-gray-400">Temporarily hide all your listings from public view</p>
              </div>
              <button className="text-xs px-3 py-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 font-medium hover:bg-yellow-100">
                Pause All
              </button>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl dark:border-white/10">
              <div>
                <p className="text-sm text-brand-charcoal-dark dark:text-white">Downgrade to User Account</p>
                <p className="text-[10px] text-gray-400">Remove provider features, keep your user account</p>
              </div>
              <button className="text-xs px-3 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-500/10 text-orange-600 font-medium hover:bg-orange-100">
                Downgrade
              </button>
            </div>

            <div className="flex items-center justify-between p-3 border border-red-200 rounded-xl dark:border-red-500/20">
              <div>
                <p className="text-sm text-red-600">Delete Provider Account</p>
                <p className="text-[10px] text-gray-400">Permanently delete your provider account and all data</p>
              </div>
              <button className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}