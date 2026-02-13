// ─────────────────────────────────────────────────────────────
// Aurban — Service listing options & config
// ─────────────────────────────────────────────────────────────

export const SERVICE_CATEGORIES = [
  {
    value: 'plumbing',
    label: 'Plumbing',
    icon: '🔧',
    desc: 'Pipe installation, repairs, drainage',
    subcategories: [
      'General Plumbing','Pipe Installation','Borehole Drilling',
      'Water Tank Installation','Drainage & Sewage','Bathroom Fitting',
      'Kitchen Plumbing','Emergency Leak Repair',
    ],
  },
  {
    value: 'electrical',
    label: 'Electrical',
    icon: '⚡',
    desc: 'Wiring, panels, fittings, solar',
    subcategories: [
      'General Electrical','Wiring & Rewiring','Panel / DB Box Installation',
      'Inverter Installation','Solar System Installation','CCTV Installation',
      'Intercom & Gate Automation','Generator Installation','Lighting Installation',
    ],
  },
  {
    value: 'construction',
    label: 'Construction',
    icon: '🏗️',
    desc: 'Building, renovation, structural work',
    subcategories: [
      'New Building Construction','Renovation & Remodelling','Roofing',
      'Painting & Plastering','Tiling & Flooring','False Ceiling (POP)',
      'Fence & Gate Construction','Waterproofing','Structural Repairs',
    ],
  },
  {
    value: 'interior_design',
    label: 'Interior Design',
    icon: '🛋️',
    desc: 'Space planning, furnishing, décor',
    subcategories: [
      'Full Interior Design','Space Planning','Furniture Selection & Sourcing',
      'Home Staging','Office Interior Design','3D Rendering & Visualisation',
      'Colour Consultation','Curtains & Blinds','Lighting Design',
    ],
  },
  {
    value: 'cleaning',
    label: 'Cleaning',
    icon: '🧹',
    desc: 'Residential and commercial cleaning',
    subcategories: [
      'General House Cleaning','Post-Construction Cleaning','Deep Cleaning',
      'Office Cleaning','End-of-Tenancy Cleaning','Carpet & Upholstery Cleaning',
      'Window Cleaning','Pest Control','Fumigation',
    ],
  },
  {
    value: 'architecture',
    label: 'Architecture',
    icon: '📐',
    desc: 'Design, planning, approvals',
    subcategories: [
      'Architectural Design','Structural Design','Building Plan Drawing',
      'Town Planning Approval','Environmental Impact','3D Design & BIM',
      'Quantity Surveying','Project Management','Inspection & Survey',
    ],
  },
  {
    value: 'security',
    label: 'Security Systems',
    icon: '🔒',
    desc: 'CCTV, alarms, access control',
    subcategories: [
      'CCTV Installation','Alarm System Installation','Electric Fence',
      'Access Control Systems','Smart Lock Installation','Gate Automation',
      'Security Consulting','Remote Monitoring Setup',
    ],
  },
  {
    value: 'property_management',
    label: 'Property Management',
    icon: '🏢',
    desc: 'Tenant management, maintenance',
    subcategories: [
      'Full Property Management','Tenant Sourcing','Rent Collection',
      'Maintenance Coordination','Property Inspection','Estate Management',
      'Facility Management','Short-Let Management',
    ],
  },
  {
    value: 'landscaping',
    label: 'Landscaping',
    icon: '🌿',
    desc: 'Gardens, lawns, outdoor spaces',
    subcategories: [
      'Garden Design & Installation','Lawn Maintenance','Tree Trimming',
      'Irrigation Systems','Paving & Decking','Outdoor Lighting',
      'Swimming Pool Installation','Water Features',
    ],
  },
  {
    value: 'moving',
    label: 'Moving & Relocation',
    icon: '🚚',
    desc: 'Packing, moving, storage',
    subcategories: [
      'Residential Moving','Office Relocation','Furniture Assembly',
      'Packing & Unpacking','Storage Solutions','Long-Distance Moving',
      'International Shipping Coordination',
    ],
  },
  {
    value: 'solar',
    label: 'Solar & Power',
    icon: '☀️',
    desc: 'Solar panels, inverters, batteries',
    subcategories: [
      'Solar Panel Installation','Inverter Installation','Battery Storage',
      'Solar Maintenance & Repair','Energy Audit','Generator Installation',
      'Power System Upgrade',
    ],
  },
  {
    value: 'ac_hvac',
    label: 'AC & HVAC',
    icon: '❄️',
    desc: 'Air conditioning, ventilation',
    subcategories: [
      'AC Installation','AC Servicing & Repair','AC Gas Refill',
      'Ducted System Installation','Ventilation Systems',
      'Commercial HVAC','Ceiling Fan Installation',
    ],
  },
];

// Pricing modes per service
export const SERVICE_PRICING_MODES = [
  { value: 'per_job',     label: 'Per Job (Fixed)'   },
  { value: 'per_day',     label: 'Per Day'            },
  { value: 'per_hour',    label: 'Per Hour'           },
  { value: 'per_sqm',     label: 'Per sqm'            },
  { value: 'quote',       label: 'Custom Quote / Negotiable' },
];

// Experience levels
export const EXPERIENCE_LEVELS = [
  { value: 'entry',    label: '0–2 years (Entry Level)'   },
  { value: 'mid',      label: '3–5 years (Mid Level)'     },
  { value: 'senior',   label: '6–10 years (Senior)'       },
  { value: 'expert',   label: '10+ years (Expert)'        },
];

// Response time options
export const RESPONSE_TIMES = [
  { value: '1h',  label: 'Within 1 hour'  },
  { value: '3h',  label: 'Within 3 hours' },
  { value: '6h',  label: 'Within 6 hours' },
  { value: '24h', label: 'Within 24 hours'},
  { value: '48h', label: 'Within 48 hours'},
];

// Project duration estimates
export const PROJECT_DURATIONS = [
  { value: 'hours',   label: 'A few hours'    },
  { value: '1_day',   label: '1 day'          },
  { value: '2_3days', label: '2–3 days'       },
  { value: '1_week',  label: 'About 1 week'   },
  { value: '2_weeks', label: '1–2 weeks'      },
  { value: '1_month', label: 'About 1 month'  },
  { value: 'custom',  label: 'Depends on project size' },
];

// Days available
export const WORK_DAYS = [
  { key: 'monday',    label: 'Mon' },
  { key: 'tuesday',   label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday',  label: 'Thu' },
  { key: 'friday',    label: 'Fri' },
  { key: 'saturday',  label: 'Sat' },
  { key: 'sunday',    label: 'Sun' },
];

// Logistics — base zones
export const LOGISTICS_ZONES = [
  { value: '10',  label: 'Up to 10km'  },
  { value: '20',  label: 'Up to 20km'  },
  { value: '40',  label: 'Up to 40km'  },
  { value: '60',  label: 'Up to 60km'  },
  { value: '100', label: 'Up to 100km' },
  { value: '999', label: 'No limit / Nationwide' },
];