// ─────────────────────────────────────────────────────────────
// Aurban Pro — Service Category Definitions
// 13 categories with tiers, observation windows, listing fields,
// and category-specific escrow configuration
// ─────────────────────────────────────────────────────────────

/**
 * PRO_SERVICE_CATEGORY_MAP
 *
 * Each category defines:
 *  - label, icon, desc          — display metadata
 *  - tier (1-4)                 — escrow tier (observation duration)
 *  - observationDays            — days the escrow stays in observation
 *  - commitmentFeePercent       — % released on OTP check-in
 *  - subcategories[]            — specific service types
 *  - fields[]                   — category-specific listing form fields
 *  - pricingModes[]             — allowed pricing models
 *  - requiredCertifications[]   — certs expected for verification
 *  - milestoneSchedule?         — Tier 4 only (construction)
 */

export const PRO_SERVICE_CATEGORY_MAP = {

  // ═══════════════════════════════════════════════
  // TIER 1 — Visual / Immediate (3-day observation)
  // ═══════════════════════════════════════════════

  cleaning: {
    label: 'Cleaning Services',
    icon: '🧹',
    desc: 'Residential & commercial cleaning, deep clean, move-in/out',
    tier: 1,
    observationDays: 3,
    commitmentFeePercent: 20,
    subcategories: [
      'Deep Clean', 'Post-Construction Cleaning', 'Move-in / Move-out',
      'Regular House Cleaning', 'Office Cleaning', 'Carpet & Upholstery',
      'Window Cleaning', 'Kitchen Degreasing', 'End-of-Tenancy',
    ],
    fields: [
      { id: 'serviceType',     label: 'Service Type',       type: 'select',  options: ['Deep Clean', 'Post-Construction', 'Move-in/Out', 'Regular', 'Office'], required: true },
      { id: 'propertySize',    label: 'Property Size',      type: 'select',  options: ['Studio', '1-Bed', '2-Bed', '3-Bed', '4-Bed+', 'Office'], required: true },
      { id: 'whatsIncluded',   label: "What's Included",    type: 'multi',   options: ['Kitchen degreasing', 'Bathroom scrubbing', 'Floor mopping', 'AC filter clean', 'Wardrobe interior', 'Window wash', 'Balcony'], required: true },
      { id: 'products',        label: 'Cleaning Products',  type: 'select',  options: ['Provider supplies', 'Client provides', 'Eco-friendly (premium)'], required: true },
      { id: 'teamSize',        label: 'Team Size',          type: 'number',  placeholder: '2', required: true },
      { id: 'addOns',          label: 'Add-on Services',    type: 'textarea', placeholder: 'Oven deep clean: ₦5,000 / Fridge: ₦3,000 / Fumigation combo: ₦8,000', required: false },
    ],
    pricingModes: ['per_job', 'per_sqm'],
    requiredCertifications: [],
  },

  fumigation: {
    label: 'Fumigation & Pest Control',
    icon: '🐛',
    desc: 'Pest control, termite treatment, rodent control',
    tier: 1,
    observationDays: 3,
    commitmentFeePercent: 20,
    subcategories: [
      'General Fumigation', 'Termite Treatment', 'Cockroach Control',
      'Rodent Control', 'Mosquito Control', 'Bed Bug Treatment',
      'Snake Repellent', 'Commercial Pest Control',
    ],
    fields: [
      { id: 'pestType',        label: 'Target Pests',       type: 'multi',   options: ['Cockroaches', 'Termites', 'Rodents', 'Mosquitoes', 'Bed bugs', 'Ants', 'Snakes', 'General'], required: true },
      { id: 'propertySize',    label: 'Property Size',      type: 'select',  options: ['Studio', '1-Bed', '2-Bed', '3-Bed', '4-Bed+', 'Office', 'Warehouse'], required: true },
      { id: 'chemicals',       label: 'Chemicals Used',     type: 'select',  options: ['Standard grade', 'Premium (odourless)', 'Eco-friendly / organic'], required: true },
      { id: 'evacuationTime',  label: 'Evacuation Time',    type: 'select',  options: ['No evacuation needed', '2-4 hours', '6-8 hours', '24 hours'], required: true },
      { id: 'warranty',        label: 'Warranty Period',     type: 'select',  options: ['30 days', '60 days', '90 days', '6 months'], required: true },
      { id: 'followUp',        label: 'Free Follow-up',     type: 'toggle',  required: true },
    ],
    pricingModes: ['per_job'],
    requiredCertifications: ['Pest Control License'],
  },

  painting: {
    label: 'Painting & Decoration',
    icon: '🎨',
    desc: 'Interior / exterior painting, wallpaper, POP',
    tier: 1,
    observationDays: 3,
    commitmentFeePercent: 20,
    subcategories: [
      'Interior Painting', 'Exterior Painting', 'POP / False Ceiling',
      'Wallpaper Installation', 'Texture / Feature Wall', 'Spray Painting',
      'Epoxy Flooring', 'Wood Staining & Varnish',
    ],
    fields: [
      { id: 'serviceType',     label: 'Service Type',       type: 'select',  options: ['Interior Painting', 'Exterior Painting', 'POP', 'Wallpaper', 'Texture', 'Spray', 'Epoxy'], required: true },
      { id: 'numberOfRooms',   label: 'Number of Rooms',    type: 'number',  placeholder: '4', required: true },
      { id: 'totalSqm',        label: 'Total Area (sqm)',   type: 'number',  placeholder: '120', required: false },
      { id: 'paintBrand',      label: 'Paint Brand',        type: 'combo',   options: ['Dulux', 'Berger', 'Saclux', 'Asian Paints', 'Client provides'], required: true },
      { id: 'coats',           label: 'Number of Coats',    type: 'select',  options: ['1 coat', '2 coats', '3 coats'], required: true },
      { id: 'materialsBy',     label: 'Materials By',       type: 'select',  options: ['Provider sources (itemized)', 'Client provides', 'Mixed'], required: true },
      { id: 'surfacePrep',     label: 'Surface Preparation', type: 'multi',  options: ['Scraping', 'Sanding', 'Priming', 'Filling cracks', 'Waterproofing'], required: false },
    ],
    pricingModes: ['per_job', 'per_sqm'],
    requiredCertifications: [],
  },

  interior_design: {
    label: 'Interior Design Consultation',
    icon: '🛋️',
    desc: 'Space planning, décor, furniture sourcing',
    tier: 1,
    observationDays: 3,
    commitmentFeePercent: 25,
    subcategories: [
      'Full Interior Design', 'Space Planning', 'Furniture Selection',
      'Home Staging', 'Office Design', '3D Rendering',
      'Colour Consultation', 'Lighting Design',
    ],
    fields: [
      { id: 'serviceScope',    label: 'Scope',              type: 'select',  options: ['Full design', 'Single room', 'Consultation only', '3D rendering', 'Furniture sourcing'], required: true },
      { id: 'propertyType',    label: 'Property Type',      type: 'select',  options: ['Apartment', 'Duplex', 'Office', 'Retail / Shop', 'Restaurant / Hotel'], required: true },
      { id: 'style',           label: 'Design Style',       type: 'multi',   options: ['Modern', 'Contemporary', 'Minimalist', 'Traditional', 'Industrial', 'Scandinavian', 'Afro-fusion'], required: false },
      { id: 'budgetRange',     label: 'Client Budget Range', type: 'select', options: ['Under ₦500K', '₦500K–₦2M', '₦2M–₦5M', '₦5M–₦10M', '₦10M+'], required: false },
      { id: 'deliverables',    label: 'Deliverables',       type: 'multi',   options: ['Mood board', '2D layout', '3D renders', 'Material schedule', 'Shopping list', 'Project management'], required: true },
      { id: 'revisions',       label: 'Revisions Included', type: 'select',  options: ['1 revision', '2 revisions', '3 revisions', 'Unlimited'], required: true },
    ],
    pricingModes: ['per_job', 'per_sqm', 'per_hour', 'quote'],
    requiredCertifications: [],
  },

  // ═══════════════════════════════════════════════
  // TIER 2 — Functional (5-day observation)
  // ═══════════════════════════════════════════════

  plumbing: {
    label: 'Plumbing Services',
    icon: '🔧',
    desc: 'Repairs, installations, maintenance, emergency',
    tier: 2,
    observationDays: 5,
    commitmentFeePercent: 25,
    subcategories: [
      'Repair / Fixing', 'New Installation', 'Maintenance',
      'Emergency', 'Bathroom Remodel', 'Borehole / Water System',
      'Drainage & Sewage', 'Water Heater',
    ],
    fields: [
      { id: 'serviceType',     label: 'Service Type',       type: 'select',  options: ['Repair', 'New Installation', 'Maintenance', 'Emergency', 'Remodel'], required: true },
      { id: 'scope',           label: 'Scope of Work',      type: 'textarea', placeholder: 'Install 2 WC sets, 2 wash basins, connect to water line', required: true },
      { id: 'materialsBy',     label: 'Materials By',       type: 'select',  options: ['Provider sources (itemized)', 'Client provides', 'Mixed'], required: true },
      { id: 'materialEstimate', label: 'Material Estimate (₦)', type: 'number', placeholder: '85000', required: false },
      { id: 'warranty',        label: 'Warranty',           type: 'select',  options: ['30 days', '60 days', '90 days'], required: true },
      { id: 'emergency',       label: 'Emergency Available', type: 'toggle', required: true },
      { id: 'emergencySurcharge', label: 'Emergency Surcharge', type: 'select', options: ['25%', '50%', '75%', '100%'], required: false },
    ],
    pricingModes: ['per_job', 'per_day', 'per_hour', 'quote'],
    requiredCertifications: ['Trade Certificate'],
  },

  electrical: {
    label: 'Electrical Services',
    icon: '⚡',
    desc: 'Wiring, panel installation, repairs, automation',
    tier: 2,
    observationDays: 5,
    commitmentFeePercent: 25,
    subcategories: [
      'Wiring & Rewiring', 'Panel / DB Box', 'Lighting Installation',
      'Generator Installation', 'Intercom & Automation', 'Repair',
      'Surge Protection', 'Emergency Electrical',
    ],
    fields: [
      { id: 'serviceType',     label: 'Service Type',       type: 'select',  options: ['New Wiring', 'Rewiring', 'Repair', 'Panel Installation', 'Lighting', 'Generator', 'Automation'], required: true },
      { id: 'scope',           label: 'Scope of Work',      type: 'textarea', placeholder: 'Rewire 3-bedroom flat, install new DB panel', required: true },
      { id: 'materialsBy',     label: 'Materials By',       type: 'select',  options: ['Provider sources (itemized)', 'Client provides', 'Mixed'], required: true },
      { id: 'materialEstimate', label: 'Material Estimate (₦)', type: 'number', placeholder: '120000', required: false },
      { id: 'cableSpec',       label: 'Cable Specification', type: 'select', options: ['1.5mm', '2.5mm', '4mm', '6mm', 'Mixed'], required: false },
      { id: 'warranty',        label: 'Warranty',           type: 'select',  options: ['30 days', '60 days', '90 days'], required: true },
      { id: 'emergency',       label: 'Emergency Available', type: 'toggle', required: true },
    ],
    pricingModes: ['per_job', 'per_day', 'per_hour', 'quote'],
    requiredCertifications: ['Electrical Trade Certificate'],
  },

  tiling: {
    label: 'Tiling & Flooring',
    icon: '🔲',
    desc: 'Floor tiles, wall tiles, marble, granite, epoxy',
    tier: 2,
    observationDays: 5,
    commitmentFeePercent: 25,
    subcategories: [
      'Floor Tiling', 'Wall Tiling', 'Marble / Granite Installation',
      'Epoxy Flooring', 'Wood Flooring', 'Outdoor Paving',
      'Tile Removal & Re-tiling', 'Grouting & Polishing',
    ],
    fields: [
      { id: 'serviceType',     label: 'Service Type',       type: 'select',  options: ['Floor Tiling', 'Wall Tiling', 'Marble', 'Granite', 'Epoxy', 'Wood Floor', 'Paving'], required: true },
      { id: 'totalSqm',        label: 'Total Area (sqm)',   type: 'number',  placeholder: '60', required: true },
      { id: 'tileType',        label: 'Tile Type',          type: 'select',  options: ['Ceramic', 'Porcelain', 'Vitrified', 'Marble', 'Granite', 'Wood', 'Client provides'], required: true },
      { id: 'materialsBy',     label: 'Materials By',       type: 'select',  options: ['Provider sources (itemized)', 'Client provides', 'Mixed'], required: true },
      { id: 'surfacePrep',     label: 'Surface Prep Needed', type: 'toggle', required: true },
      { id: 'warranty',        label: 'Warranty',           type: 'select',  options: ['30 days', '60 days', '90 days'], required: true },
    ],
    pricingModes: ['per_sqm', 'per_job', 'quote'],
    requiredCertifications: [],
  },

  handyman: {
    label: 'Handyman Services',
    icon: '🔨',
    desc: 'General repairs, assembly, minor installations',
    tier: 2,
    observationDays: 5,
    commitmentFeePercent: 20,
    subcategories: [
      'General Repairs', 'Furniture Assembly', 'Door & Lock Repairs',
      'Curtain & Blind Installation', 'TV Mounting', 'Shelving',
      'Minor Plumbing', 'Minor Electrical', 'Appliance Installation',
    ],
    fields: [
      { id: 'taskDescription', label: 'Task Description',   type: 'textarea', placeholder: 'Mount 3 TVs, install curtain rails in 4 rooms, fix kitchen cabinet', required: true },
      { id: 'numberOfTasks',   label: 'Number of Tasks',    type: 'number',  placeholder: '5', required: true },
      { id: 'materialsBy',     label: 'Materials By',       type: 'select',  options: ['Provider brings', 'Client provides', 'Mixed'], required: true },
      { id: 'tools',           label: 'Special Tools Needed', type: 'toggle', required: false },
    ],
    pricingModes: ['per_job', 'per_day', 'per_hour'],
    requiredCertifications: [],
  },

  landscaping: {
    label: 'Landscaping & Garden',
    icon: '🌿',
    desc: 'Garden design, lawn maintenance, irrigation, paving',
    tier: 2,
    observationDays: 5,
    commitmentFeePercent: 25,
    subcategories: [
      'Garden Design & Installation', 'Lawn Maintenance', 'Tree Trimming',
      'Irrigation Systems', 'Paving & Decking', 'Outdoor Lighting',
      'Swimming Pool', 'Water Features', 'Artificial Grass',
    ],
    fields: [
      { id: 'serviceType',     label: 'Service Type',       type: 'select',  options: ['Garden Design', 'Lawn Maintenance', 'Irrigation', 'Paving', 'Pool', 'Tree Work', 'Full Landscaping'], required: true },
      { id: 'areaSqm',         label: 'Area (sqm)',         type: 'number',  placeholder: '200', required: true },
      { id: 'materialsBy',     label: 'Materials By',       type: 'select',  options: ['Provider sources', 'Client provides', 'Mixed'], required: true },
      { id: 'maintenance',     label: 'Maintenance Plan',   type: 'select',  options: ['One-time', 'Weekly', 'Bi-weekly', 'Monthly'], required: false },
      { id: 'irrigation',      label: 'Irrigation Included', type: 'toggle', required: false },
    ],
    pricingModes: ['per_job', 'per_sqm', 'per_day', 'quote'],
    requiredCertifications: [],
  },

  // ═══════════════════════════════════════════════
  // TIER 3 — Complex / Specialist (7-day observation)
  // ═══════════════════════════════════════════════

  ac_hvac: {
    label: 'AC & HVAC',
    icon: '❄️',
    desc: 'AC install, servicing, gas refill, ducting',
    tier: 3,
    observationDays: 7,
    commitmentFeePercent: 30,
    subcategories: [
      'New Installation', 'Repair', 'Servicing', 'Gas Refill',
      'Ducted System', 'Ventilation', 'Commercial HVAC',
    ],
    fields: [
      { id: 'serviceType',     label: 'Service Type',       type: 'select',  options: ['New Install', 'Repair', 'Servicing', 'Gas Refill', 'Ducting'], required: true },
      { id: 'acType',          label: 'AC Type',            type: 'select',  options: ['Split 1HP', 'Split 1.5HP', 'Split 2HP', 'Split 2.5HP', 'Window', 'Floor Standing', 'Cassette', 'Central'], required: true },
      { id: 'numberOfUnits',   label: 'Number of Units',    type: 'number',  placeholder: '3', required: true },
      { id: 'includesUnit',    label: 'Includes AC Unit?',  type: 'toggle',  required: true },
      { id: 'unitBrand',       label: 'AC Brand (if supplied)', type: 'combo', options: ['LG', 'Samsung', 'Hisense', 'Daikin', 'Midea', 'Panasonic', 'Client provides'], required: false },
      { id: 'pipingLength',    label: 'Piping Length',      type: 'select',  options: ['Standard 3m', 'Extended 5m (+₦5K/m)', 'Extended 8m+ (+₦5K/m)'], required: false },
      { id: 'warranty',        label: 'Workmanship Warranty', type: 'select', options: ['30 days', '60 days', '90 days'], required: true },
    ],
    pricingModes: ['per_job', 'per_day', 'quote'],
    requiredCertifications: ['HVAC Certification', 'F-Gas Certificate'],
  },

  solar_inverter: {
    label: 'Solar & Inverter',
    icon: '☀️',
    desc: 'Solar panels, inverters, batteries, power systems',
    tier: 3,
    observationDays: 7,
    commitmentFeePercent: 30,
    subcategories: [
      'Solar Only', 'Inverter Only', 'Hybrid System',
      'Battery Replacement', 'System Upgrade', 'Maintenance & Repair',
      'Load Assessment',
    ],
    fields: [
      { id: 'systemType',      label: 'System Type',        type: 'select',  options: ['Solar only', 'Inverter only', 'Hybrid', 'Battery replacement', 'Upgrade'], required: true },
      { id: 'capacity',        label: 'System Capacity',    type: 'text',    placeholder: 'Inverter: 5KVA. Panels: 8×400W. Batteries: 4×200Ah.', required: true },
      { id: 'equipmentProvided', label: 'Equipment Provided?', type: 'toggle', required: true },
      { id: 'equipmentDetails', label: 'Equipment Breakdown', type: 'textarea', placeholder: 'Inverter ₦380K, Batteries ₦340K, Panels ₦560K', required: false },
      { id: 'loadAssessment',  label: 'Load Assessment',    type: 'select',  options: ['Free', '₦5,000', 'Not offered'], required: true },
      { id: 'afterSales',      label: 'After-Sales Support', type: 'toggle', required: true },
      { id: 'warranty',        label: 'Warranty',           type: 'text',    placeholder: 'Workmanship: 90 days. Equipment: Manufacturer 1-5 years.', required: true },
    ],
    pricingModes: ['per_job', 'quote'],
    requiredCertifications: ['Solar Installation Certificate', 'Electrical Certificate'],
  },

  cctv_security: {
    label: 'CCTV & Security Systems',
    icon: '📹',
    desc: 'CCTV, alarms, access control, electric fence',
    tier: 3,
    observationDays: 7,
    commitmentFeePercent: 30,
    subcategories: [
      'CCTV Installation', 'Alarm Systems', 'Access Control',
      'Electric Fence', 'Smart Locks', 'Gate Automation',
      'Remote Monitoring', 'Security Consulting',
    ],
    fields: [
      { id: 'serviceType',     label: 'Service Type',       type: 'select',  options: ['CCTV', 'Alarm', 'Access Control', 'Electric Fence', 'Smart Lock', 'Gate Automation', 'Full Security'], required: true },
      { id: 'numberOfPoints',  label: 'Number of Points',   type: 'number',  placeholder: '8', required: true },
      { id: 'equipmentProvided', label: 'Equipment Provided?', type: 'toggle', required: true },
      { id: 'equipmentBrand',  label: 'Equipment Brand',    type: 'combo',   options: ['Hikvision', 'Dahua', 'Reolink', 'Ring', 'Yale', 'Client provides'], required: false },
      { id: 'remoteAccess',    label: 'Remote Access/App',  type: 'toggle',  required: true },
      { id: 'storageType',     label: 'Storage',            type: 'select',  options: ['Local DVR/NVR', 'Cloud', 'Both', 'Client provides'], required: false },
      { id: 'warranty',        label: 'Workmanship Warranty', type: 'select', options: ['30 days', '60 days', '90 days', '1 year'], required: true },
    ],
    pricingModes: ['per_job', 'quote'],
    requiredCertifications: ['Security Systems Certificate'],
  },

  // ═══════════════════════════════════════════════
  // TIER 4 — Custom / Project-based (Milestone + 14-day retention)
  // ═══════════════════════════════════════════════

  construction: {
    label: 'Construction & Fabrication',
    icon: '🏗️',
    desc: 'Building, renovation, borehole, roofing, gate fabrication',
    tier: 4,
    observationDays: 14,
    commitmentFeePercent: 30,
    subcategories: [
      'Wall / Fence', 'Renovation', 'Borehole',
      'Roofing', 'Gate Fabrication', 'Full Building',
      'Structural Repairs', 'Waterproofing',
    ],
    fields: [
      { id: 'projectType',     label: 'Project Type',       type: 'select',  options: ['Wall/Fence', 'Renovation', 'Borehole', 'Roof', 'Gate', 'Full Build', 'Remodel'], required: true },
      { id: 'detailedScope',   label: 'Detailed Scope',     type: 'textarea', placeholder: 'Build 60m perimeter wall, plastered/painted. Motorized gate.', required: true },
      { id: 'billOfQuantities', label: 'Bill of Quantities', type: 'textarea', placeholder: 'Blocks: 3500. Cement: 180 bags. Sand: 12 trips. Rods: 120.', required: true },
      { id: 'materialVsLabor', label: 'Material vs Labor Split', type: 'text', placeholder: 'Materials: ₦2.8M. Labor: ₦1.4M.', required: true },
      { id: 'teamSize',        label: 'Team Size',          type: 'text',    placeholder: 'Foreman + 4 masons + 2 laborers', required: true },
      { id: 'estimatedDuration', label: 'Estimated Duration', type: 'select', options: ['1-2 weeks', '2-4 weeks', '1-2 months', '2-3 months', '3-6 months', '6+ months'], required: true },
      { id: 'dailyUpdates',    label: 'Daily Photo Updates', type: 'toggle', required: true },
    ],
    pricingModes: ['quote'],
    requiredCertifications: ['CAC Registration', 'COREN/ARCON (if applicable)'],
    milestoneSchedule: [
      { phase: 1, label: 'Mobilization',  percent: 30, trigger: 'OTP check-in + materials-on-site photo' },
      { phase: 2, label: 'Structure',      percent: 40, trigger: 'Major visible milestone + user approves' },
      { phase: 3, label: 'Finishing',      percent: 20, trigger: 'Project functionally complete + user walkthrough' },
      { phase: 4, label: 'Retention',      percent: 10, trigger: '14 days pass with no disputes (auto-release)' },
    ],
  },
};


// ── Helpers ─────────────────────────────────────────────────

/** List of all Pro service categories as array */
export const PRO_SERVICE_CATEGORY_LIST = Object.entries(PRO_SERVICE_CATEGORY_MAP).map(
  ([key, val]) => ({ id: key, ...val })
);

/** Get tier number for a category */
export function getProCategoryTier(category) {
  return PRO_SERVICE_CATEGORY_MAP[category]?.tier ?? 1;
}

/** Get observation window in days for a category */
export function getObservationWindow(category) {
  return PRO_SERVICE_CATEGORY_MAP[category]?.observationDays ?? 3;
}

/** Get commitment fee percentage for a category */
export function getCommitmentFeePercent(category) {
  return PRO_SERVICE_CATEGORY_MAP[category]?.commitmentFeePercent ?? 20;
}

/** Get milestone schedule (Tier 4 only) — returns null for other tiers */
export function getMilestoneSchedule(category) {
  return PRO_SERVICE_CATEGORY_MAP[category]?.milestoneSchedule ?? null;
}

/** Get category field definitions */
export function getProCategoryFields(category) {
  return PRO_SERVICE_CATEGORY_MAP[category]?.fields ?? [];
}

/** Get categories grouped by tier */
export function getCategoriesByTier() {
  const grouped = { 1: [], 2: [], 3: [], 4: [] };
  for (const [key, val] of Object.entries(PRO_SERVICE_CATEGORY_MAP)) {
    grouped[val.tier].push({ id: key, ...val });
  }
  return grouped;
}
