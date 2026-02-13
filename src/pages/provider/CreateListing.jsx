import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Home, Wrench, ShoppingBag, ChevronLeft, ChevronRight,
  Camera, X, Upload, Play, Check, AlertCircle, Loader2,
  MapPin, DollarSign, Calendar, Eye, Shield, Info,
  Image as ImageIcon, Trash2, GripVertical, Plus,
  Wifi, Car, Zap, Droplets, Wind, Flame, Tv, Lock,
  Trees, Dumbbell, Waves, UtensilsCrossed,
  WashingMachine, Refrigerator, BedDouble, Bath,
  PawPrint, Baby, Cigarette, Accessibility,
  ChevronDown, Search, Star, FileText, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { sanitize, RateLimiter } from '../../utils/security.js';

/* ════════════════════════════════════════════════════════════
   SECURITY
════════════════════════════════════════════════════════════ */
const listingLimiter = new RateLimiter(10, 3600000); // 10 listings per hour

// Sanitize all text inputs
const clean = (val) => sanitize(String(val || ''));

// Validate YouTube URL — only allow youtube.com and youtu.be
const YOUTUBE_RE = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})(?:\S*)?$/;
const extractYoutubeId = (url) => {
  const match = url.match(YOUTUBE_RE);
  return match ? match[1] : null;
};

// Validate image files
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 15;
const MIN_IMAGES = 3;

// Sanitize filename
const sanitizeFilename = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);

/* ════════════════════════════════════════════════════════════
   LISTING TYPE CONFIGURATIONS
════════════════════════════════════════════════════════════ */
const LISTING_TYPES = {
  property: {
    label: 'Property',
    icon: Home,
    color: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600',
    categories: [
      { id: 'rental',   label: 'Rental',           emoji: '🏠' },
      { id: 'shortlet', label: 'Shortlet',         emoji: '🏨' },
      { id: 'buy',      label: 'For Sale',         emoji: '🏡' },
      { id: 'land',     label: 'Land',             emoji: '🗺️' },
      { id: 'shared',   label: 'Shared Apartment', emoji: '👥' },
      { id: 'lease',    label: 'Lease',            emoji: '📋' },
      { id: 'commercial', label: 'Commercial',     emoji: '🏢' },
    ],
  },
  service: {
    label: 'Service',
    icon: Wrench,
    color: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600',
    categories: [
      { id: 'plumber',     label: 'Plumber',             emoji: '🔧' },
      { id: 'electrician', label: 'Electrician',          emoji: '⚡' },
      { id: 'carpenter',   label: 'Carpenter',            emoji: '🪚' },
      { id: 'painter',     label: 'Painter',              emoji: '🎨' },
      { id: 'architect',   label: 'Architect',            emoji: '📐' },
      { id: 'engineer',    label: 'Engineer',             emoji: '👷' },
      { id: 'cleaner',     label: 'Cleaner',              emoji: '🧹' },
      { id: 'mover',       label: 'Mover / Relocation',   emoji: '🚚' },
      { id: 'solar',       label: 'Solar Installation',   emoji: '☀️' },
      { id: 'fumigation',  label: 'Fumigation / Pest',   emoji: '🦟' },
      { id: 'interior',    label: 'Interior Design',      emoji: '🛋️' },
      { id: 'surveyor',    label: 'Land Surveyor',        emoji: '📏' },
      { id: 'legal',       label: 'Legal / Documentation',emoji: '⚖️' },
      { id: 'property_mgmt', label: 'Property Management',emoji: '🏘️' },
      { id: 'security',    label: 'Security Services',    emoji: '🔒' },
      { id: 'other_service', label: 'Other',              emoji: '🔨' },
    ],
  },
  product: {
    label: 'Product',
    icon: ShoppingBag,
    color: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600',
    categories: [
      { id: 'cement',      label: 'Cement / Blocks',       emoji: '🧱' },
      { id: 'roofing',     label: 'Roofing Materials',     emoji: '🏗️' },
      { id: 'tiles',       label: 'Tiles / Flooring',      emoji: '🔲' },
      { id: 'plumbing_mat',label: 'Plumbing Materials',    emoji: '🚿' },
      { id: 'electrical_mat', label: 'Electrical Materials',emoji: '💡' },
      { id: 'paint',       label: 'Paints / Finishes',     emoji: '🪣' },
      { id: 'doors_windows', label: 'Doors & Windows',     emoji: '🚪' },
      { id: 'furniture',   label: 'Furniture',             emoji: '🪑' },
      { id: 'appliances',  label: 'Appliances',            emoji: '🔌' },
      { id: 'generator',   label: 'Generators',            emoji: '⚙️' },
      { id: 'tank',        label: 'Water Tanks',           emoji: '🛢️' },
      { id: 'sand_granite',label: 'Sand / Granite',        emoji: '⛰️' },
      { id: 'iron_steel',  label: 'Iron & Steel',          emoji: '🔩' },
      { id: 'other_product', label: 'Other',               emoji: '📦' },
    ],
  },
};

/* ════════════════════════════════════════════════════════════
   AMENITIES / FEATURES LIST (for properties)
════════════════════════════════════════════════════════════ */
const AMENITIES = [
  { id: 'wifi',          label: 'Wi-Fi',              icon: Wifi           },
  { id: 'parking',       label: 'Parking',            icon: Car            },
  { id: 'electricity',   label: '24/7 Electricity',   icon: Zap            },
  { id: 'water',         label: 'Running Water',      icon: Droplets       },
  { id: 'ac',            label: 'Air Conditioning',   icon: Wind           },
  { id: 'gas',           label: 'Gas Cooker',         icon: Flame          },
  { id: 'tv',            label: 'Smart TV',           icon: Tv             },
  { id: 'security',      label: 'Security / Gated',   icon: Lock           },
  { id: 'garden',        label: 'Garden / Compound',  icon: Trees          },
  { id: 'gym',           label: 'Gym',                icon: Dumbbell       },
  { id: 'pool',          label: 'Swimming Pool',      icon: Waves   },
  { id: 'kitchen',       label: 'Fitted Kitchen',     icon: UtensilsCrossed},
  { id: 'laundry',       label: 'Washing Machine',    icon: WashingMachine },
  { id: 'fridge',        label: 'Refrigerator',       icon: Refrigerator   },
  { id: 'furnished',     label: 'Fully Furnished',    icon: BedDouble      },
  { id: 'ensuite',       label: 'Ensuite Bathrooms',  icon: Bath           },
  { id: 'pet_friendly',  label: 'Pet Friendly',       icon: PawPrint       },
  { id: 'child_friendly',label: 'Child Friendly',     icon: Baby           },
  { id: 'no_smoking',    label: 'No Smoking',         icon: Cigarette      },
  { id: 'accessible',    label: 'Wheelchair Access',  icon: Accessibility  },
];

/* ════════════════════════════════════════════════════════════
   PRICING PERIODS
════════════════════════════════════════════════════════════ */
const PRICE_PERIODS = {
  rental:   [{ id: 'year', label: '/year' }, { id: 'month', label: '/month' }, { id: '6months', label: '/6 months' }],
  shortlet: [{ id: 'night', label: '/night' }, { id: 'week', label: '/week' }, { id: 'weekend', label: '/weekend' }],
  buy:      [{ id: 'total', label: 'Total' }],
  land:     [{ id: 'total', label: 'Total' }, { id: 'sqm', label: '/sqm' }],
  shared:   [{ id: 'month', label: '/month' }, { id: 'year', label: '/year' }],
  lease:    [{ id: 'year', label: '/year' }],
  commercial: [{ id: 'year', label: '/year' }, { id: 'month', label: '/month' }, { id: 'sqm', label: '/sqm' }],
};

/* ════════════════════════════════════════════════════════════
   NIGERIAN STATES + LGAs (top locations)
════════════════════════════════════════════════════════════ */
const STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

/* ════════════════════════════════════════════════════════════
   STEPS CONFIGURATION
════════════════════════════════════════════════════════════ */
const STEPS = {
  property: ['Type', 'Details', 'Photos', 'Amenities', 'Pricing', 'Inspection', 'Preview'],
  service:  ['Type', 'Details', 'Photos', 'Pricing', 'Availability', 'Preview'],
  product:  ['Type', 'Details', 'Photos', 'Pricing', 'Preview'],
};

/* ════════════════════════════════════════════════════════════
   IMAGE COMPRESSOR — Reduces file size before upload
════════════════════════════════════════════════════════════ */
function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      reject(new Error('Invalid image type. Use JPG, PNG, or WebP.'));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      reject(new Error('Image too large. Maximum 5MB per image.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image.'));
    reader.onload = (e) => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = (h * maxWidth) / w;
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Compression failed.')); return; }
            const compressed = new File([blob], sanitizeFilename(file.name), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve({
              file: compressed,
              preview: URL.createObjectURL(compressed),
              name: sanitizeFilename(file.name),
              size: compressed.size,
            });
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════════ */
export default function CreateListing() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const { type: urlType } = useParams();

  /* ── Core state ─────────────────────────────────────────── */
  const [listingType, setListingType] = useState(urlType && LISTING_TYPES[urlType] ? urlType : '');
  const [step, setStep]     = useState(listingType ? 1 : 0); // 0 = type selection
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /* ── Form data ──────────────────────────────────────────── */
  const [form, setForm] = useState({
    // Common
    title: '',
    description: '',
    category: '',
    state: '',
    city: '',
    address: '',
    landmark: '',

    // Property-specific
    bedrooms: '',
    bathrooms: '',
    toilets: '',
    squareMeters: '',
    yearBuilt: '',
    propertyCondition: '',
    furnishing: '',
    amenities: [],

    // Pricing
    price: '',
    pricePeriod: '',
    cautionFee: '',
    serviceFee: '',
    legalFee: '',
    agentFee: '',
    negotiable: false,

    // Media
    images: [],
    youtubeUrl: '',

    // Inspection
    inspectionDays: [],
    inspectionStartTime: '09:00',
    inspectionEndTime: '17:00',
    inspectionNote: '',

    // Service-specific
    serviceArea: '',
    experience: '',
    responseTime: '',
    availability: 'weekdays',

    // Product-specific
    brand: '',
    quantity: '',
    unit: '',
    deliveryAvailable: false,
    deliveryFee: '',
    warranty: '',

    // Contact override
    contactPhone: '',
    contactWhatsapp: '',
    contactEmail: '',
  });

  /* ── Honeypot ───────────────────────────────────────────── */
  const [honeypot, setHoneypot] = useState('');

  const fileInputRef = useRef(null);

  /* ── Steps for current listing type ─────────────────────── */
  const steps = listingType ? STEPS[listingType] : [];
  const totalSteps = steps.length;
  const currentStepLabel = steps[step - 1] || '';

  /* ── Set field helper ───────────────────────────────────── */
  const set = useCallback((field, value) => {
    const cleaned = typeof value === 'string' ? clean(value) : value;
    setForm((prev) => ({ ...prev, [field]: cleaned }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    setSubmitError('');
  }, [errors]);

  /* ── Toggle amenity ─────────────────────────────────────── */
  const toggleAmenity = useCallback((id) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((a) => a !== id)
        : [...prev.amenities, id],
    }));
  }, []);

  /* ── Toggle inspection day ──────────────────────────────── */
  const toggleInspectionDay = useCallback((day) => {
    setForm((prev) => ({
      ...prev,
      inspectionDays: prev.inspectionDays.includes(day)
        ? prev.inspectionDays.filter((d) => d !== day)
        : [...prev.inspectionDays, day],
    }));
  }, []);

  /* ── Image handling ─────────────────────────────────────── */
  const handleImageUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (form.images.length + files.length > MAX_IMAGES) {
      setErrors((prev) => ({ ...prev, images: `Maximum ${MAX_IMAGES} images allowed.` }));
      return;
    }

    const newErrors = {};
    const compressed = [];

    for (const file of files) {
      try {
        const result = await compressImage(file);
        compressed.push(result);
      } catch (err) {
        newErrors.images = err.message;
      }
    }

    if (compressed.length > 0) {
      setForm((prev) => ({ ...prev, images: [...prev.images, ...compressed] }));
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [form.images.length]);

  const removeImage = useCallback((index) => {
    setForm((prev) => {
      const updated = [...prev.images];
      // Revoke object URL to prevent memory leaks
      if (updated[index]?.preview) URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return { ...prev, images: updated };
    });
  }, []);

  const moveImage = useCallback((from, to) => {
    if (to < 0 || to >= form.images.length) return;
    setForm((prev) => {
      const updated = [...prev.images];
      const [item] = updated.splice(from, 1);
      updated.splice(to, 0, item);
      return { ...prev, images: updated };
    });
  }, [form.images.length]);

  /* ── Cleanup object URLs on unmount ─────────────────────── */
  useEffect(() => {
    return () => {
      form.images.forEach((img) => {
        if (img?.preview) URL.revokeObjectURL(img.preview);
      });
    };
  }, []);

  /* ── Step validation ────────────────────────────────────── */
  const validateStep = useCallback(() => {
    const e = {};

    if (step === 1) {
      // Type step — category required
      if (!form.category) e.category = 'Select a category';
    }

    if (step === 2) {
      // Details
      if (!form.title.trim()) e.title = 'Title is required';
      else if (form.title.length < 10) e.title = 'Title must be at least 10 characters';
      else if (form.title.length > 120) e.title = 'Title must be under 120 characters';
      if (!form.description.trim()) e.description = 'Description is required';
      else if (form.description.length < 30) e.description = 'Minimum 30 characters';
      else if (form.description.length > 3000) e.description = 'Maximum 3000 characters';
      if (!form.state) e.state = 'Select a state';
      if (!form.city.trim()) e.city = 'City / area is required';
      if (!form.address.trim()) e.address = 'Address is required';

      if (listingType === 'property' && form.category !== 'land') {
        if (!form.bedrooms) e.bedrooms = 'Required';
        if (!form.bathrooms) e.bathrooms = 'Required';
      }
      if (listingType === 'property' && form.category === 'land') {
        if (!form.squareMeters) e.squareMeters = 'Land size is required';
      }
    }

    if (currentStepLabel === 'Photos') {
      if (form.images.length < MIN_IMAGES) e.images = `Upload at least ${MIN_IMAGES} images`;
      if (form.youtubeUrl && !extractYoutubeId(form.youtubeUrl)) e.youtubeUrl = 'Invalid YouTube URL';
    }

    if (currentStepLabel === 'Pricing') {
      if (!form.price) e.price = 'Price is required';
      else if (isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = 'Enter a valid price';
      if (listingType === 'property' && !form.pricePeriod) e.pricePeriod = 'Select a pricing period';

      if (listingType === 'product') {
        if (!form.quantity) e.quantity = 'Quantity is required';
      }
    }

    if (currentStepLabel === 'Inspection') {
      if (form.inspectionDays.length === 0) e.inspectionDays = 'Select at least one day';
    }

    if (currentStepLabel === 'Availability') {
      if (!form.availability) e.availability = 'Select availability';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }, [step, form, listingType, currentStepLabel]);

  /* ── Navigation ─────────────────────────────────────────── */
  const goNext = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, totalSteps));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, listingType ? 1 : 0));

  /* ── Select listing type ────────────────────────────────── */
  const selectType = (type) => {
    setListingType(type);
    setStep(1);
    setForm((prev) => ({ ...prev, category: '' }));
    setErrors({});
  };

  /* ── Submit ─────────────────────────────────────────────── */
  const handleSubmit = async () => {
    // Honeypot check
    if (honeypot) return;

    // Rate limit
    if (!listingLimiter.attempt()) {
      setSubmitError('Too many listings created. Please wait before trying again.');
      return;
    }

    if (!validateStep()) return;

    setLoading(true);
    setSubmitError('');

    try {
      // In production: POST to API with form data + images
      // For now: simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(err?.message || 'Failed to create listing. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ─────────────────────────────────────── */
  if (submitSuccess) {
    return (
      <div className="max-w-lg px-4 py-16 mx-auto text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-5 rounded-full bg-green-50 dark:bg-green-500/10">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h1 className="mb-2 text-2xl font-bold font-display text-brand-charcoal-dark dark:text-white">
          Listing Submitted!
        </h1>
        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
          Your listing is under review. You'll be notified once it's approved and live on Aurban.
        </p>
        <p className="mb-8 text-xs text-gray-400">
          Review typically takes 1–24 hours.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/provider" className="text-sm btn-primary">Back to Dashboard</Link>
          <button onClick={() => { setSubmitSuccess(false); setStep(0); setListingType(''); setForm((prev) => ({ ...prev, title: '', description: '', images: [], category: '' })); }}
            className="text-sm btn-outline">
            Create Another
          </button>
        </div>
      </div>
    );
  }

  /* ── Price formatter ────────────────────────────────────── */
  const formatPrice = (val) => {
    const num = Number(String(val).replace(/[^0-9]/g, ''));
    return isNaN(num) ? '' : num.toLocaleString();
  };

  const youtubeId = form.youtubeUrl ? extractYoutubeId(form.youtubeUrl) : null;

  return (
    <div className="max-w-3xl px-4 py-6 pb-32 mx-auto">

      {/* ── Honeypot ──────────────────────────────────────── */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input type="text" tabIndex={-1} value={honeypot} onChange={(e) => setHoneypot(e.target.value)} autoComplete="off" />
      </div>

      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => step > (listingType ? 1 : 0) ? goBack() : navigate('/provider')}
          className="p-2 text-gray-500 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 dark:text-gray-400">
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
            {step === 0 ? 'New Listing' : `New ${LISTING_TYPES[listingType]?.label || ''}`}
          </h1>
          {step > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">Step {step} of {totalSteps} — {currentStepLabel}</p>
          )}
        </div>
      </div>

      {/* ── Progress bar ──────────────────────────────────── */}
      {step > 0 && (
        <div className="mb-6">
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((s, i) => (
              <span key={s} className={`text-[10px] font-medium ${i < step ? 'text-brand-gold' : 'text-gray-300 dark:text-gray-600'}`}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <div className="flex items-center gap-2 px-4 py-3 mb-5 border border-red-200 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20 rounded-xl" role="alert">
          <AlertCircle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 0 — Listing Type Selection
      ══════════════════════════════════════════════════════ */}
      {step === 0 && (
        <div className="space-y-3">
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">What would you like to list on Aurban?</p>
          {Object.entries(LISTING_TYPES).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button key={key} onClick={() => selectType(key)}
                className="flex items-center w-full gap-4 p-5 text-left transition-shadow bg-white dark:bg-gray-900 rounded-2xl shadow-card hover:shadow-card-hover">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${cfg.color}`}>
                  <Icon size={22} />
                </div>
                <div>
                  <p className="font-semibold text-brand-charcoal-dark dark:text-white">{cfg.label}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{cfg.categories.length} categories available</p>
                </div>
                <ChevronRight size={18} className="ml-auto text-gray-300" />
              </button>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 1 — Category Selection
      ══════════════════════════════════════════════════════ */}
      {step === 1 && listingType && (
        <div>
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">Choose a category for your {LISTING_TYPES[listingType].label.toLowerCase()}:</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LISTING_TYPES[listingType].categories.map((cat) => (
              <button key={cat.id} onClick={() => set('category', cat.id)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all
                  ${form.category === cat.id
                    ? 'border-brand-gold bg-brand-gold/5 dark:bg-brand-gold/10 ring-1 ring-brand-gold/30'
                    : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5'
                  }`}>
                <span className="text-xl">{cat.emoji}</span>
                <span className={`text-sm font-medium ${form.category === cat.id ? 'text-brand-charcoal-dark dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
          {errors.category && <p role="alert" className="mt-2 text-xs text-red-500">{errors.category}</p>}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          STEP 2 — Details
      ══════════════════════════════════════════════════════ */}
      {currentStepLabel === 'Details' && (
        <div className="space-y-5">

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Listing Title *</label>
            <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)}
              className={`input-field ${errors.title ? 'border-red-300' : ''}`}
              placeholder="e.g. Spacious 3 Bedroom Flat in Lekki Phase 1"
              maxLength={120} />
            <div className="flex justify-between mt-1">
              {errors.title && <p role="alert" className="text-xs text-red-500">{errors.title}</p>}
              <span className="ml-auto text-xs text-gray-400">{form.title.length}/120</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Description *</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
              className={`input-field min-h-[120px] resize-y ${errors.description ? 'border-red-300' : ''}`}
              placeholder="Describe your listing in detail — condition, features, what makes it special..."
              maxLength={3000} />
            <div className="flex justify-between mt-1">
              {errors.description && <p role="alert" className="text-xs text-red-500">{errors.description}</p>}
              <span className="ml-auto text-xs text-gray-400">{form.description.length}/3000</span>
            </div>
          </div>

          {/* Location — State */}
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">
              <MapPin size={14} className="inline mr-1 -mt-0.5" /> State *
            </label>
            <select value={form.state} onChange={(e) => set('state', e.target.value)}
              className={`input-field ${errors.state ? 'border-red-300' : ''}`}>
              <option value="">Select state</option>
              {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {errors.state && <p role="alert" className="mt-1 text-xs text-red-500">{errors.state}</p>}
          </div>

          {/* City + Address */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">City / Area *</label>
              <input type="text" value={form.city} onChange={(e) => set('city', e.target.value)}
                className={`input-field ${errors.city ? 'border-red-300' : ''}`}
                placeholder="e.g. Lekki, Ikeja, Wuse" maxLength={60} />
              {errors.city && <p role="alert" className="mt-1 text-xs text-red-500">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Street Address *</label>
              <input type="text" value={form.address} onChange={(e) => set('address', e.target.value)}
                className={`input-field ${errors.address ? 'border-red-300' : ''}`}
                placeholder="Full address" maxLength={200} />
              {errors.address && <p role="alert" className="mt-1 text-xs text-red-500">{errors.address}</p>}
            </div>
          </div>

          {/* Landmark */}
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Nearest Landmark</label>
            <input type="text" value={form.landmark} onChange={(e) => set('landmark', e.target.value)}
              className="input-field" placeholder="e.g. Opposite Shoprite, beside GTBank" maxLength={120} />
          </div>

          {/* ── Property-specific fields ───────────────────── */}
          {listingType === 'property' && form.category !== 'land' && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Bedrooms *</label>
                  <select value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)}
                    className={`input-field ${errors.bedrooms ? 'border-red-300' : ''}`}>
                    <option value="">--</option>
                    {['Studio', '1', '2', '3', '4', '5', '6', '7+'].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  {errors.bedrooms && <p role="alert" className="mt-1 text-xs text-red-500">{errors.bedrooms}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Bathrooms *</label>
                  <select value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)}
                    className={`input-field ${errors.bathrooms ? 'border-red-300' : ''}`}>
                    <option value="">--</option>
                    {['1', '2', '3', '4', '5', '6+'].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                  {errors.bathrooms && <p role="alert" className="mt-1 text-xs text-red-500">{errors.bathrooms}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Toilets</label>
                  <select value={form.toilets} onChange={(e) => set('toilets', e.target.value)}
                    className="input-field">
                    <option value="">--</option>
                    {['1', '2', '3', '4', '5', '6+'].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Property Condition</label>
                  <select value={form.propertyCondition} onChange={(e) => set('propertyCondition', e.target.value)} className="input-field">
                    <option value="">Select</option>
                    {['Newly Built', 'Renovated', 'Good Condition', 'Needs Renovation', 'Under Construction'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Furnishing</label>
                  <select value={form.furnishing} onChange={(e) => set('furnishing', e.target.value)} className="input-field">
                    <option value="">Select</option>
                    {['Fully Furnished', 'Semi-Furnished', 'Unfurnished'].map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Land-specific */}
          {listingType === 'property' && form.category === 'land' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Land Size (sqm) *</label>
                <input type="number" value={form.squareMeters} onChange={(e) => set('squareMeters', e.target.value)}
                  className={`input-field ${errors.squareMeters ? 'border-red-300' : ''}`}
                  placeholder="e.g. 500" min="1" />
                {errors.squareMeters && <p role="alert" className="mt-1 text-xs text-red-500">{errors.squareMeters}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Document Type</label>
                <select value={form.propertyCondition} onChange={(e) => set('propertyCondition', e.target.value)} className="input-field">
                  <option value="">Select</option>
                  {['C of O', 'Governor\'s Consent', 'Deed of Assignment', 'Survey Plan', 'Gazette', 'Excision', 'Registered Survey', 'Other'].map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Service-specific */}
          {listingType === 'service' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Years of Experience</label>
                <input type="number" value={form.experience} onChange={(e) => set('experience', e.target.value)}
                  className="input-field" placeholder="e.g. 5" min="0" max="50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Service Area</label>
                <input type="text" value={form.serviceArea} onChange={(e) => set('serviceArea', e.target.value)}
                  className="input-field" placeholder="e.g. Lagos, Ogun" maxLength={100} />
              </div>
            </div>
          )}

          {/* Product-specific */}
          {listingType === 'product' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Brand / Manufacturer</label>
                <input type="text" value={form.brand} onChange={(e) => set('brand', e.target.value)}
                  className="input-field" placeholder="e.g. Dangote, BUA" maxLength={80} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Warranty</label>
                <input type="text" value={form.warranty} onChange={(e) => set('warranty', e.target.value)}
                  className="input-field" placeholder="e.g. 1 year" maxLength={60} />
              </div>
            </div>
          )}
        </div>
      )}
      {/* ══════════════════════════════════════════════════════
          PHOTOS / MEDIA STEP
      ══════════════════════════════════════════════════════ */}
      {currentStepLabel === 'Photos' && (
        <div className="space-y-5">

          {/* Upload area */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200">
              <Camera size={14} className="inline mr-1.5 -mt-0.5" />
              Photos * <span className="font-normal text-gray-400">({form.images.length}/{MAX_IMAGES} — min {MIN_IMAGES})</span>
            </label>

            {/* Drop zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const dt = e.dataTransfer;
                if (dt?.files?.length) {
                  // Create a synthetic event-like object for the handler
                  handleImageUpload({ target: { files: dt.files } });
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors
                ${errors.images
                  ? 'border-red-300 bg-red-50/50 dark:bg-red-500/5'
                  : 'border-gray-200 dark:border-white/10 hover:border-brand-gold/50 hover:bg-brand-gold/5 dark:hover:bg-brand-gold/5'
                }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              aria-label="Upload images"
            >
              <Upload size={28} className="mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-medium text-brand-charcoal-dark dark:text-white">
                Tap to upload or drag photos here
              </p>
              <p className="mt-1 text-xs text-gray-400">
                JPG, PNG, WebP · Max 5MB each · First image = cover photo
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              aria-hidden="true"
            />

            {errors.images && <p role="alert" className="mt-2 text-xs text-red-500">{errors.images}</p>}
          </div>

          {/* Image preview grid */}
          {form.images.length > 0 && (
            <div>
              <p className="mb-2 text-xs text-gray-400">Drag to reorder · First image is the cover photo</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {form.images.map((img, i) => (
                  <div key={i} className="relative overflow-hidden bg-gray-100 group aspect-square rounded-xl dark:bg-white/5">
                    <img
                      src={img.preview}
                      alt={`Upload ${i + 1}`}
                      className="object-cover w-full h-full"
                      loading="lazy"
                    />

                    {/* Cover badge */}
                    {i === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-brand-gold text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        COVER
                      </span>
                    )}

                    {/* Size label */}
                    <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-md">
                      {(img.size / 1024).toFixed(0)}KB
                    </span>

                    {/* Actions overlay */}
                    <div className="absolute inset-0 flex items-center justify-center gap-1 transition-colors opacity-0 bg-black/0 group-hover:bg-black/30 group-hover:opacity-100">
                      {i > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); moveImage(i, i - 1); }}
                          className="flex items-center justify-center text-gray-700 rounded-lg w-7 h-7 bg-white/90 hover:bg-white"
                          aria-label="Move left">
                          <ChevronLeft size={14} />
                        </button>
                      )}
                      {i < form.images.length - 1 && (
                        <button onClick={(e) => { e.stopPropagation(); moveImage(i, i + 1); }}
                          className="flex items-center justify-center text-gray-700 rounded-lg w-7 h-7 bg-white/90 hover:bg-white"
                          aria-label="Move right">
                          <ChevronRight size={14} />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                        className="flex items-center justify-center text-white rounded-lg w-7 h-7 bg-red-500/90 hover:bg-red-600"
                        aria-label="Remove image">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add more button */}
                {form.images.length < MAX_IMAGES && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center text-gray-400 transition-colors border-2 border-gray-200 border-dashed aspect-square rounded-xl dark:border-white/10 hover:border-brand-gold/50 hover:text-brand-gold"
                  >
                    <Plus size={20} />
                    <span className="text-[10px] mt-1">Add</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* YouTube video embed */}
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">
              <Play size={14} className="inline mr-1.5 -mt-0.5" />
              Virtual Tour / Video <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="url"
              value={form.youtubeUrl}
              onChange={(e) => set('youtubeUrl', e.target.value)}
              className={`input-field ${errors.youtubeUrl ? 'border-red-300' : ''}`}
              placeholder="https://youtube.com/watch?v=..."
              maxLength={200}
            />
            {errors.youtubeUrl && <p role="alert" className="mt-1 text-xs text-red-500">{errors.youtubeUrl}</p>}

            {/* Preview embed */}
            {youtubeId && (
              <div className="mt-3 overflow-hidden bg-black rounded-xl aspect-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                  title="Video tour"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                />
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
            <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
              <p className="font-medium">Photo tips for faster approval:</p>
              <p>• Use natural lighting — no heavy filters</p>
              <p>• Show all rooms, exterior, and surroundings</p>
              <p>• First photo should be the most attractive angle</p>
              <p>• No watermarks, text overlays, or collages</p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          AMENITIES STEP (Properties only)
      ══════════════════════════════════════════════════════ */}
      {currentStepLabel === 'Amenities' && (
        <div className="space-y-5">
          <div>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Select all amenities and features available. This helps buyers and tenants make informed decisions.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AMENITIES.map(({ id, label, icon: Icon }) => {
                const selected = form.amenities.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleAmenity(id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-sm transition-all
                      ${selected
                        ? 'border-brand-gold bg-brand-gold/5 dark:bg-brand-gold/10 text-brand-charcoal-dark dark:text-white ring-1 ring-brand-gold/30'
                        : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    aria-pressed={selected}
                  >
                    <Icon size={16} className={selected ? 'text-brand-gold' : 'text-gray-400'} />
                    <span className="font-medium truncate">{label}</span>
                    {selected && <Check size={14} className="ml-auto text-brand-gold shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Square meters (for non-land properties) */}
          {form.category !== 'land' && (
            <div>
              <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">
                Total Area (sqm) <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input type="number" value={form.squareMeters} onChange={(e) => set('squareMeters', e.target.value)}
                className="input-field" placeholder="e.g. 150" min="1" />
            </div>
          )}

          {/* Year built */}
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">
              Year Built <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input type="number" value={form.yearBuilt} onChange={(e) => set('yearBuilt', e.target.value)}
              className="input-field" placeholder="e.g. 2022" min="1960" max={new Date().getFullYear()} />
          </div>

          {/* Selection count */}
          <p className="text-xs text-center text-gray-400">
            {form.amenities.length} amenities selected
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          PRICING STEP
      ══════════════════════════════════════════════════════ */}
      {currentStepLabel === 'Pricing' && (
        <div className="space-y-5">

          {/* Main price */}
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">
              <DollarSign size={14} className="inline mr-1 -mt-0.5" /> Price (₦) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold text-sm">₦</span>
              <input
                type="text"
                value={formatPrice(form.price)}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  set('price', raw);
                }}
                className={`input-field pl-8 text-lg font-bold ${errors.price ? 'border-red-300' : ''}`}
                placeholder="0"
                maxLength={15}
                inputMode="numeric"
              />
            </div>
            {errors.price && <p role="alert" className="mt-1 text-xs text-red-500">{errors.price}</p>}
          </div>

          {/* Price period (properties) */}
          {listingType === 'property' && PRICE_PERIODS[form.category] && (
            <div>
              <label className="block mb-2 text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200">Pricing Period *</label>
              <div className="flex flex-wrap gap-2">
                {PRICE_PERIODS[form.category].map((period) => (
                  <button key={period.id} type="button" onClick={() => set('pricePeriod', period.id)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all
                      ${form.pricePeriod === period.id
                        ? 'border-brand-gold bg-brand-gold/5 dark:bg-brand-gold/10 text-brand-charcoal-dark dark:text-white ring-1 ring-brand-gold/30'
                        : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                      }`}>
                    {period.label}
                  </button>
                ))}
              </div>
              {errors.pricePeriod && <p role="alert" className="mt-1 text-xs text-red-500">{errors.pricePeriod}</p>}
            </div>
          )}

          {/* Negotiable toggle */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-white/10">
            <span className="text-sm font-medium text-brand-charcoal-dark dark:text-gray-200">Price is negotiable</span>
            <button type="button" onClick={() => set('negotiable', !form.negotiable)}
              className={`w-11 h-6 rounded-full relative transition-colors ${form.negotiable ? 'bg-brand-gold' : 'bg-gray-300 dark:bg-white/20'}`}
              role="switch" aria-checked={form.negotiable}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.negotiable ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          {/* ── Fee transparency (property only) ───────────── */}
          {listingType === 'property' && form.category !== 'land' && (
            <div className="p-4 space-y-3 bg-gray-50 dark:bg-white/5 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <Shield size={14} className="text-brand-gold" />
                <span className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Fee Transparency</span>
              </div>
              <p className="text-xs text-gray-400">
                Help tenants/buyers understand the full cost. All fees are shown to users upfront.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Caution / Security Deposit</label>
                  <div className="relative">
                    <span className="absolute text-xs text-gray-400 -translate-y-1/2 left-3 top-1/2">₦</span>
                    <input type="text" value={formatPrice(form.cautionFee)}
                      onChange={(e) => set('cautionFee', e.target.value.replace(/[^0-9]/g, ''))}
                      className="text-sm input-field pl-7" placeholder="0" inputMode="numeric" maxLength={12} />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Service Charge</label>
                  <div className="relative">
                    <span className="absolute text-xs text-gray-400 -translate-y-1/2 left-3 top-1/2">₦</span>
                    <input type="text" value={formatPrice(form.serviceFee)}
                      onChange={(e) => set('serviceFee', e.target.value.replace(/[^0-9]/g, ''))}
                      className="text-sm input-field pl-7" placeholder="0" inputMode="numeric" maxLength={12} />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Legal / Agreement Fee</label>
                  <div className="relative">
                    <span className="absolute text-xs text-gray-400 -translate-y-1/2 left-3 top-1/2">₦</span>
                    <input type="text" value={formatPrice(form.legalFee)}
                      onChange={(e) => set('legalFee', e.target.value.replace(/[^0-9]/g, ''))}
                      className="text-sm input-field pl-7" placeholder="0" inputMode="numeric" maxLength={12} />
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Agent / Commission Fee</label>
                  <div className="relative">
                    <span className="absolute text-xs text-gray-400 -translate-y-1/2 left-3 top-1/2">₦</span>
                    <input type="text" value={formatPrice(form.agentFee)}
                      onChange={(e) => set('agentFee', e.target.value.replace(/[^0-9]/g, ''))}
                      className="text-sm input-field pl-7" placeholder="0" inputMode="numeric" maxLength={12} />
                  </div>
                </div>
              </div>

              {/* Total breakdown */}
              {Number(form.price) > 0 && (
                <div className="pt-3 mt-3 border-t border-gray-200 dark:border-white/10">
                  <div className="flex justify-between mb-1 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Base Price</span>
                    <span className="font-medium text-brand-charcoal-dark dark:text-white">₦{formatPrice(form.price)}</span>
                  </div>
                  {Number(form.cautionFee) > 0 && (
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Caution Fee</span>
                      <span className="text-brand-charcoal dark:text-gray-300">₦{formatPrice(form.cautionFee)}</span>
                    </div>
                  )}
                  {Number(form.serviceFee) > 0 && (
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Service Charge</span>
                      <span className="text-brand-charcoal dark:text-gray-300">₦{formatPrice(form.serviceFee)}</span>
                    </div>
                  )}
                  {Number(form.legalFee) > 0 && (
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Legal Fee</span>
                      <span className="text-brand-charcoal dark:text-gray-300">₦{formatPrice(form.legalFee)}</span>
                    </div>
                  )}
                  {Number(form.agentFee) > 0 && (
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Agent Fee</span>
                      <span className="text-brand-charcoal dark:text-gray-300">₦{formatPrice(form.agentFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 mt-2 text-sm border-t border-gray-200 dark:border-white/10">
                    <span className="font-semibold text-brand-charcoal-dark dark:text-white">Total Cost to Tenant</span>
                    <span className="text-base font-bold text-brand-gold">
                      ₦{formatPrice(
                        Number(form.price || 0) +
                        Number(form.cautionFee || 0) +
                        Number(form.serviceFee || 0) +
                        Number(form.legalFee || 0) +
                        Number(form.agentFee || 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Product-specific: quantity + delivery */}
          {listingType === 'product' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Quantity Available *</label>
                  <input type="number" value={form.quantity} onChange={(e) => set('quantity', e.target.value)}
                    className={`input-field ${errors.quantity ? 'border-red-300' : ''}`}
                    placeholder="e.g. 100" min="1" />
                  {errors.quantity && <p role="alert" className="mt-1 text-xs text-red-500">{errors.quantity}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Unit</label>
                  <select value={form.unit} onChange={(e) => set('unit', e.target.value)} className="input-field">
                    <option value="">Select</option>
                    {['Pieces', 'Bags', 'Trips', 'Bundles', 'Packs', 'Sheets', 'Litres', 'Kg', 'Tonnes', 'Sqm', 'Rolls'].map((u) =>
                      <option key={u} value={u}>{u}</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-white/10">
                <span className="text-sm font-medium text-brand-charcoal-dark dark:text-gray-200">Delivery available</span>
                <button type="button" onClick={() => set('deliveryAvailable', !form.deliveryAvailable)}
                  className={`w-11 h-6 rounded-full relative transition-colors ${form.deliveryAvailable ? 'bg-brand-gold' : 'bg-gray-300 dark:bg-white/20'}`}
                  role="switch" aria-checked={form.deliveryAvailable}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.deliveryAvailable ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>

              {form.deliveryAvailable && (
                <div>
                  <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Delivery Fee (₦)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₦</span>
                    <input type="text" value={formatPrice(form.deliveryFee)}
                      onChange={(e) => set('deliveryFee', e.target.value.replace(/[^0-9]/g, ''))}
                      className="input-field pl-7" placeholder="0 = Free delivery" inputMode="numeric" maxLength={12} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Service pricing note */}
          {listingType === 'service' && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
              <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Set your starting price. Clients can negotiate directly via messages.
                You can also set "0" and add "Contact for pricing" in your description.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          INSPECTION STEP (Properties only)
      ══════════════════════════════════════════════════════ */}
      {currentStepLabel === 'Inspection' && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Set your available days and times for property inspections. Interested users will book within these slots.
          </p>

          {/* Days */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200">
              <Calendar size={14} className="inline mr-1.5 -mt-0.5" /> Available Days *
            </label>
            <div className="flex flex-wrap gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                const selected = form.inspectionDays.includes(day);
                return (
                  <button key={day} type="button" onClick={() => toggleInspectionDay(day)}
                    className={`px-3.5 py-2 rounded-xl border text-sm font-medium transition-all
                      ${selected
                        ? 'border-brand-gold bg-brand-gold/5 dark:bg-brand-gold/10 text-brand-charcoal-dark dark:text-white ring-1 ring-brand-gold/30'
                        : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    aria-pressed={selected}>
                    {day.slice(0, 3)}
                    {selected && <Check size={12} className="inline ml-1 text-brand-gold" />}
                  </button>
                );
              })}
            </div>
            {errors.inspectionDays && <p role="alert" className="mt-1 text-xs text-red-500">{errors.inspectionDays}</p>}
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Start Time</label>
              <input type="time" value={form.inspectionStartTime}
                onChange={(e) => set('inspectionStartTime', e.target.value)}
                className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">End Time</label>
              <input type="time" value={form.inspectionEndTime}
                onChange={(e) => set('inspectionEndTime', e.target.value)}
                className="input-field" />
            </div>
          </div>

          {/* Note to visitors */}
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">
              Note to Visitors <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea value={form.inspectionNote} onChange={(e) => set('inspectionNote', e.target.value)}
              className="input-field min-h-[80px] resize-y"
              placeholder="e.g. Please call before coming. Bring valid ID. Security will direct you..."
              maxLength={300} />
            <span className="float-right mt-1 text-xs text-gray-400">{form.inspectionNote.length}/300</span>
          </div>

          {/* Contact override */}
          <div className="p-4 space-y-3 bg-gray-50 dark:bg-white/5 rounded-2xl">
            <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Contact for Inspections</p>
            <p className="text-xs text-gray-400">Leave blank to use your profile contact details.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Phone</label>
                <input type="tel" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)}
                  className="text-sm input-field" placeholder="+234..." maxLength={20} />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">WhatsApp</label>
                <input type="tel" value={form.contactWhatsapp} onChange={(e) => set('contactWhatsapp', e.target.value)}
                  className="text-sm input-field" placeholder="+234..." maxLength={20} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          AVAILABILITY STEP (Services only)
      ══════════════════════════════════════════════════════ */}
      {currentStepLabel === 'Availability' && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Let clients know when you're typically available for work.
          </p>

          {/* Availability type */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200">General Availability *</label>
            <div className="space-y-2">
              {[
                { id: 'weekdays',  label: 'Weekdays only',        desc: 'Monday – Friday' },
                { id: 'weekends',  label: 'Weekends only',        desc: 'Saturday – Sunday' },
                { id: 'all_week',  label: 'All week',             desc: 'Monday – Sunday' },
                { id: 'flexible',  label: 'Flexible / On demand', desc: 'Available by arrangement' },
              ].map((opt) => (
                <button key={opt.id} type="button" onClick={() => set('availability', opt.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all
                    ${form.availability === opt.id
                      ? 'border-brand-gold bg-brand-gold/5 dark:bg-brand-gold/10 ring-1 ring-brand-gold/30'
                      : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${form.availability === opt.id ? 'border-brand-gold' : 'border-gray-300 dark:border-gray-600'}`}>
                    {form.availability === opt.id && <div className="w-2 h-2 rounded-full bg-brand-gold" />}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${form.availability === opt.id ? 'text-brand-charcoal-dark dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            {errors.availability && <p role="alert" className="mt-1 text-xs text-red-500">{errors.availability}</p>}
          </div>

          {/* Response time */}
          <div>
            <label className="block text-sm font-semibold text-brand-charcoal-dark dark:text-gray-200 mb-1.5">Typical Response Time</label>
            <select value={form.responseTime} onChange={(e) => set('responseTime', e.target.value)} className="input-field">
              <option value="">Select</option>
              {['Within 1 hour', 'Within 2 hours', 'Same day', 'Within 24 hours', 'Within 48 hours'].map((t) =>
                <option key={t} value={t}>{t}</option>
              )}
            </select>
          </div>

          {/* Contact override */}
          <div className="p-4 space-y-3 bg-gray-50 dark:bg-white/5 rounded-2xl">
            <p className="text-sm font-semibold text-brand-charcoal-dark dark:text-white">Contact Details</p>
            <p className="text-xs text-gray-400">Leave blank to use your profile contact details.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Phone</label>
                <input type="tel" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)}
                  className="text-sm input-field" placeholder="+234..." maxLength={20} />
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
                <input type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)}
                  className="text-sm input-field" placeholder="you@email.com" maxLength={120} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          PREVIEW STEP
      ══════════════════════════════════════════════════════ */}
      {currentStepLabel === 'Preview' && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
            <Eye size={16} className="text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700 dark:text-blue-300">Review your listing before submitting. You can edit any section by going back.</p>
          </div>

          {/* Cover image */}
          {form.images.length > 0 && (
            <div className="rounded-2xl overflow-hidden aspect-[16/10] bg-gray-100 dark:bg-white/5">
              <img src={form.images[0].preview} alt="Cover" className="object-cover w-full h-full" />
            </div>
          )}

          {/* Image count */}
          {form.images.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto scroll-x">
              {form.images.slice(1, 6).map((img, i) => (
                <div key={i} className="w-16 h-16 overflow-hidden bg-gray-100 rounded-xl dark:bg-white/5 shrink-0">
                  <img src={img.preview} alt="" className="object-cover w-full h-full" />
                </div>
              ))}
              {form.images.length > 6 && (
                <div className="flex items-center justify-center w-16 h-16 bg-gray-200 rounded-xl dark:bg-white/10 shrink-0">
                  <span className="text-xs font-bold text-gray-500">+{form.images.length - 6}</span>
                </div>
              )}
            </div>
          )}

          {/* Details card */}
          <div className="p-5 space-y-4 bg-white dark:bg-gray-900 rounded-2xl shadow-card">
            {/* Category badge */}
            <span className="text-xs capitalize badge-gold">{form.category.replace(/_/g, ' ')}</span>

            <h2 className="text-xl font-bold font-display text-brand-charcoal-dark dark:text-white">
              {form.title || 'Untitled Listing'}
            </h2>

            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <MapPin size={14} />
              <span>{[form.address, form.city, form.state].filter(Boolean).join(', ') || 'No location set'}</span>
            </div>

            {form.landmark && (
              <p className="text-xs text-gray-400">Near: {form.landmark}</p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-display text-brand-gold">
                ₦{formatPrice(form.price)}
              </span>
              {form.pricePeriod && (
                <span className="text-sm text-gray-400">
                  /{form.pricePeriod}
                </span>
              )}
              {form.negotiable && <span className="badge-green text-[10px] ml-2">Negotiable</span>}
            </div>

            {/* Property specs */}
            {listingType === 'property' && form.category !== 'land' && (form.bedrooms || form.bathrooms) && (
              <div className="flex gap-4 pt-2 text-sm text-gray-500 border-t border-gray-100 dark:text-gray-400 dark:border-white/10">
                {form.bedrooms && <span>{form.bedrooms} Bed{form.bedrooms !== '1' && form.bedrooms !== 'Studio' ? 's' : ''}</span>}
                {form.bathrooms && <span>{form.bathrooms} Bath{form.bathrooms !== '1' ? 's' : ''}</span>}
                {form.toilets && <span>{form.toilets} Toilet{form.toilets !== '1' ? 's' : ''}</span>}
                {form.squareMeters && <span>{form.squareMeters} sqm</span>}
              </div>
            )}

            {/* Land specs */}
            {listingType === 'property' && form.category === 'land' && form.squareMeters && (
              <p className="pt-2 text-sm text-gray-500 border-t border-gray-100 dark:text-gray-400 dark:border-white/10">
                {Number(form.squareMeters).toLocaleString()} sqm
                {form.propertyCondition && ` · ${form.propertyCondition}`}
              </p>
            )}

            {/* Description */}
            <div className="pt-3 border-t border-gray-100 dark:border-white/10">
              <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line dark:text-gray-300">
                {form.description || 'No description provided.'}
              </p>
            </div>

            {/* Amenities */}
            {form.amenities.length > 0 && (
              <div className="pt-3 border-t border-gray-100 dark:border-white/10">
                <p className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">Amenities</p>
                <div className="flex flex-wrap gap-1.5">
                  {form.amenities.map((id) => {
                    const a = AMENITIES.find((x) => x.id === id);
                    if (!a) return null;
                    const Icon = a.icon;
                    return (
                      <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-xs text-gray-600 dark:text-gray-400">
                        <Icon size={12} /> {a.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Fee breakdown */}
            {listingType === 'property' && (Number(form.cautionFee) > 0 || Number(form.serviceFee) > 0 || Number(form.legalFee) > 0 || Number(form.agentFee) > 0) && (
              <div className="pt-3 border-t border-gray-100 dark:border-white/10">
                <p className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">Additional Fees</p>
                <div className="space-y-1">
                  {Number(form.cautionFee) > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Caution Fee</span><span className="text-gray-700 dark:text-gray-300">₦{formatPrice(form.cautionFee)}</span></div>}
                  {Number(form.serviceFee) > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Service Charge</span><span className="text-gray-700 dark:text-gray-300">₦{formatPrice(form.serviceFee)}</span></div>}
                  {Number(form.legalFee) > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Legal Fee</span><span className="text-gray-700 dark:text-gray-300">₦{formatPrice(form.legalFee)}</span></div>}
                  {Number(form.agentFee) > 0 && <div className="flex justify-between text-xs"><span className="text-gray-500">Agent Fee</span><span className="text-gray-700 dark:text-gray-300">₦{formatPrice(form.agentFee)}</span></div>}
                </div>
              </div>
            )}

            {/* Inspection schedule */}
            {form.inspectionDays.length > 0 && (
              <div className="pt-3 border-t border-gray-100 dark:border-white/10">
                <p className="mb-1 text-xs font-semibold tracking-wider text-gray-400 uppercase">Inspection Schedule</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {form.inspectionDays.join(', ')} · {form.inspectionStartTime} – {form.inspectionEndTime}
                </p>
                {form.inspectionNote && (
                  <p className="mt-1 text-xs text-gray-400">{form.inspectionNote}</p>
                )}
              </div>
            )}

            {/* YouTube */}
            {youtubeId && (
              <div className="pt-3 border-t border-gray-100 dark:border-white/10">
                <p className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">Video Tour</p>
                <div className="overflow-hidden bg-black rounded-xl aspect-video">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${youtubeId}`}
                    title="Video tour"
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Provider info */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-gold/10 shrink-0">
              <span className="font-bold text-brand-gold">{(user?.name || 'P')[0]}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate text-brand-charcoal-dark dark:text-white">{user?.name}</p>
              <p className="text-xs text-gray-400">Listed by you · Pending review</p>
            </div>
            <Shield size={16} className="ml-auto text-gray-300 shrink-0" />
          </div>

          {/* Submission note */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 dark:text-amber-300">
              <p className="mb-1 font-medium">Before you submit:</p>
              <p>• Listings are reviewed within 1–24 hours</p>
              <p>• Fake or misleading listings will be removed</p>
              <p>• You can edit after submission from your dashboard</p>
              <p>• Aurban may contact you for verification</p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          BOTTOM NAVIGATION — Back / Next / Submit
      ══════════════════════════════════════════════════════ */}
      {step > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 bg-white border-t border-gray-100 dark:bg-gray-950 dark:border-white/10">
          <div className="flex items-center max-w-3xl gap-3 mx-auto">

            {/* Back button */}
            <button onClick={goBack}
              className="btn-outline text-sm py-2.5 px-5">
              <ChevronLeft size={16} className="inline mr-1 -mt-0.5" />
              Back
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Next or Submit */}
            {step < totalSteps ? (
              <button onClick={goNext}
                className="btn-primary text-sm py-2.5 px-6">
                Next
                <ChevronRight size={16} className="inline ml-1 -mt-0.5" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2">
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Submit Listing
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}