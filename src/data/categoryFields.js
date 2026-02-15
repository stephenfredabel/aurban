// ─────────────────────────────────────────────────────────────
// Aurban Marketplace — Product Category Definitions
// 10 categories with subcategories, listing fields, and refund policies
// ─────────────────────────────────────────────────────────────

export const PRODUCT_CATEGORY_MAP = {
  building_materials: {
    label: 'Building Materials & Hardware',
    emoji: '🧱',
    desc: 'Cement, blocks, steel, roofing, timber',
    subcategories: [
      'Cement & Concrete', 'Roofing Materials', 'Iron & Steel (Rods, Sheets)',
      'Blocks & Bricks', 'Tiles & Flooring', 'Paint & Finishes',
      'Plumbing Materials', 'Electrical Materials', 'Doors & Windows',
      'Wood & Timber', 'Sand, Gravel & Granite', 'POP & Ceiling Materials',
      'Glass & Mirrors', 'Nails, Screws & Fasteners', 'Waterproofing & Sealants',
    ],
    fields: [
      { id: 'brand',            label: 'Brand',                    type: 'combo',   options: ['Dangote', 'BUA', 'Lafarge', 'Unicem'], required: true },
      { id: 'materialCategory', label: 'Material Category',        type: 'select',  options: ['Cement', 'Roofing', 'Iron Rods', 'Blocks', 'Tiles', 'Paint', 'Plumbing', 'Electrical', 'Doors', 'Timber', 'Aggregates', 'POP', 'Glass', 'Fasteners', 'Sealants'], required: true },
      { id: 'unitOfSale',       label: 'Unit of Sale',             type: 'select',  options: ['Per bag', 'Per bundle', 'Per ton', 'Per sqm', 'Per piece', 'Per trip', 'Per roll'], required: true },
      { id: 'minOrder',         label: 'Minimum Order Quantity',   type: 'number',  placeholder: '10', required: true },
      { id: 'maxOrder',         label: 'Maximum Order Quantity',   type: 'number',  placeholder: '1000', required: false },
      { id: 'bulkDiscount',     label: 'Bulk Discount',            type: 'text',    placeholder: '50+ bags: 3% off, 200+: 7% off', required: false },
      { id: 'grade',            label: 'Grade / Specification',    type: 'text',    placeholder: '42.5N, 32.5R, etc.', required: false },
      { id: 'weight',           label: 'Weight per Unit',          type: 'text',    placeholder: '50kg per bag', required: true },
      { id: 'dimensions',       label: 'Dimensions (if applicable)', type: 'text',  placeholder: 'L × W × H', required: false },
      { id: 'color',            label: 'Color / Finish',           type: 'text',    placeholder: 'Grey, Burgundy, etc.', required: false },
      { id: 'certification',    label: 'Certification',            type: 'select',  options: ['SON Certified', 'NIS Certified', 'ISO Certified', 'None'], required: false },
      { id: 'countryOfOrigin',  label: 'Country of Origin',        type: 'select',  options: ['Nigeria', 'China', 'India', 'Turkey', 'Italy', 'Other'], required: false },
      { id: 'warranty',         label: 'Warranty / Guarantee',     type: 'text',    placeholder: 'Manufacturer warranty: 15 years', required: false },
    ],
    refundPolicy: {
      type: 'non_refundable',
      window: 0,
      label: 'Non-Refundable',
      conditions: 'Non-refundable once delivered and confirmed. Disputes only for wrong product, wrong quantity, or damaged goods.',
    },
  },

  furniture_fittings: {
    label: 'Furniture & Fittings',
    emoji: '🪑',
    desc: 'Living room, bedroom, office furniture',
    subcategories: [
      'Living Room Furniture', 'Bedroom Furniture', 'Kitchen Cabinets & Fittings',
      'Bathroom Fittings', 'Office Furniture', 'Outdoor Furniture',
      'Wardrobes & Storage', 'Curtains & Blinds', 'Light Fixtures & Chandeliers',
    ],
    fields: [
      { id: 'brand',               label: 'Brand',                type: 'combo',    options: ['Mouka', 'Vitafoam', 'IKEA', 'Custom Made'], required: false },
      { id: 'material',            label: 'Material',             type: 'multi',    options: ['Fabric', 'Leather', 'Wood', 'Metal', 'Glass', 'Plastic', 'Rattan'], required: true },
      { id: 'dimensions',          label: 'Dimensions (L × W × H)', type: 'text',  placeholder: '250cm × 180cm × 85cm', required: true },
      { id: 'colorOptions',        label: 'Color Options',        type: 'text',     placeholder: 'Grey, Brown, Cream, Black', required: true },
      { id: 'customizable',        label: 'Customization Available?', type: 'toggle', required: true },
      { id: 'customLeadTime',      label: 'Custom Order Lead Time', type: 'select', options: ['1-2 weeks', '2-4 weeks', '4-6 weeks', '6-8 weeks'], required: false },
      { id: 'assemblyRequired',    label: 'Assembly Required?',   type: 'toggle',   required: true },
      { id: 'assemblyIncluded',    label: 'Free Assembly Included?', type: 'toggle', required: false },
      { id: 'weight',              label: 'Weight (kg)',           type: 'number',   placeholder: '85', required: true },
      { id: 'warranty',            label: 'Warranty',              type: 'text',     placeholder: '1 year frame warranty', required: false },
      { id: 'returnCondition',     label: 'Return Condition',      type: 'text',     placeholder: 'Unused, original packaging, within 48hrs', required: false },
    ],
    refundPolicy: {
      type: 'conditional',
      window: 48,
      label: '48hr Return Window',
      conditions: 'Stock items: 48hr return if unused and in original packaging. Custom/made-to-order items: non-refundable.',
    },
  },

  home_appliances: {
    label: 'Home Appliances & Electronics',
    emoji: '📺',
    desc: 'Kitchen appliances, generators, ACs, TVs',
    subcategories: [
      'Kitchen Appliances', 'Generators & Inverters', 'Air Conditioners & Fans',
      'TVs & Sound Systems', 'Refrigerators & Freezers', 'Washing Machines & Dryers',
      'Water Heaters', 'Solar Panels & Batteries', 'Smart Home Devices',
      'Security Cameras & Systems',
    ],
    fields: [
      { id: 'brand',          label: 'Brand',                type: 'combo',   options: ['LG', 'Samsung', 'Hisense', 'Thermocool', 'Scanfrost', 'Haier', 'Panasonic', 'Sony'], required: true },
      { id: 'modelNumber',    label: 'Model Number',         type: 'text',    placeholder: 'LG-SPL1.5HP-INV', required: true },
      { id: 'condition',      label: 'Condition',            type: 'select',  options: ['Brand New', 'Refurbished (Grade A)', 'Refurbished (Grade B)', 'Nigerian Used (Tokunbo)'], required: true },
      { id: 'powerRating',    label: 'Power Rating',         type: 'text',    placeholder: '1,200 watts / 1.5HP', required: true },
      { id: 'voltage',        label: 'Voltage',              type: 'select',  options: ['220V (Standard)', '110V (Adapter Required)', 'Dual Voltage'], required: true },
      { id: 'energyRating',   label: 'Energy Rating',        type: 'select',  options: ['A+++', 'A++', 'A+', 'A', 'B', 'C', 'Not Rated'], required: false },
      { id: 'keySpecs',       label: 'Key Specifications',   type: 'textarea', placeholder: 'Screen size, resolution, BTU, fuel type, etc.', required: true },
      { id: 'installIncluded',label: 'Installation Included?', type: 'select', options: ['Yes (Free)', 'Yes (Extra Cost)', 'No'], required: true },
      { id: 'installCost',    label: 'Installation Cost (₦)', type: 'number', placeholder: '15000', required: false },
      { id: 'warranty',       label: 'Warranty',              type: 'text',   placeholder: '2 years manufacturer, parts + labor', required: true },
      { id: 'weight',         label: 'Weight (kg)',            type: 'number', placeholder: '45', required: false },
    ],
    refundPolicy: {
      type: 'conditional',
      window: 168,
      label: '7-Day Return',
      conditions: 'Brand New: 7-day return. Refurbished: 3-day return. Used/Tokunbo: non-refundable. Dead on Arrival: always refundable within 24hrs with video evidence.',
    },
  },

  interior_decor: {
    label: 'Interior Décor & Finishing',
    emoji: '🎨',
    desc: 'Wallpaper, rugs, curtains, art, decor',
    subcategories: [
      'Wallpaper & Wall Art', 'Rugs & Carpets', 'Curtain Materials & Accessories',
      'Decorative Items', 'Indoor Plants & Planters', 'Mirrors & Frames',
      'Bedding & Linens', 'Kitchen & Dining Accessories',
    ],
    fields: [
      { id: 'material',          label: 'Material',            type: 'text',    placeholder: 'Silk, Cotton, PVC, Wool', required: true },
      { id: 'dimensions',        label: 'Dimensions / Size',   type: 'text',    placeholder: '5×7ft, per roll (5.3 sqm), 60×90cm', required: true },
      { id: 'colorPattern',      label: 'Color / Pattern',     type: 'text',    placeholder: 'Gold Geometric, Floral Blue', required: true },
      { id: 'installService',    label: 'Installation Service?', type: 'select', options: ['Not Available', 'Yes (Free)', 'Yes (Extra Cost)'], required: false },
      { id: 'installCost',       label: 'Installation Cost (₦)', type: 'number', placeholder: '3000', required: false },
      { id: 'careInstructions',  label: 'Care Instructions',    type: 'text',   placeholder: 'Dry clean only, wipe with damp cloth', required: false },
    ],
    refundPolicy: {
      type: 'conditional',
      window: 48,
      label: '48hr Return Window',
      conditions: 'Unused and sealed items: 48-hour return. Custom-cut wallpaper, tailored curtains, or personalized items: non-refundable.',
    },
  },

  plumbing_sanitary: {
    label: 'Plumbing & Sanitary Ware',
    emoji: '🚿',
    desc: 'Toilets, bathtubs, pipes, taps, tanks',
    subcategories: [
      'Toilets & WCs', 'Bathtubs & Shower Systems', 'Wash Basins & Sinks',
      'Pipes & Fittings (PVC, PPR, Metal)', 'Water Tanks & Pumps',
      'Taps & Mixers', 'Water Treatment Systems', 'Septic & Drainage Systems',
    ],
    fields: [
      { id: 'brand',           label: 'Brand',              type: 'combo',    options: ['TWYFORD', 'Ideal Standard', 'Cera', 'Grohe', 'Generic'], required: true },
      { id: 'typeModel',       label: 'Type / Model',       type: 'text',     placeholder: 'Close-coupled / Wall-hung / Squat', required: true },
      { id: 'material',        label: 'Material',           type: 'select',   options: ['Ceramic', 'Stainless Steel', 'PVC', 'Brass', 'Chrome', 'Copper'], required: true },
      { id: 'color',           label: 'Color',              type: 'text',     placeholder: 'White, Ivory, Grey', required: true },
      { id: 'whatsIncluded',   label: "What's Included",    type: 'textarea', placeholder: 'Bowl, cistern, seat cover, flush mechanism, bolts', required: true },
      { id: 'installRequired', label: 'Installation Required?', type: 'select', options: ['Yes (Included)', 'Yes (Extra Cost)', 'No (DIY-friendly)'], required: true },
      { id: 'installCost',     label: 'Installation Cost (₦)', type: 'number', placeholder: '10000', required: false },
      { id: 'specifications',  label: 'Specifications',      type: 'text',    placeholder: 'Capacity, diameter, pressure rating', required: true },
      { id: 'warranty',        label: 'Warranty',             type: 'text',    placeholder: '5-year ceramic warranty', required: false },
    ],
    refundPolicy: {
      type: 'non_refundable',
      window: 0,
      label: 'Non-Refundable',
      conditions: 'Non-refundable for sanitary ware (hygiene). Pipes/fittings: returnable if unused within 48hrs. Wrong product/size: exchange or refund via dispute.',
    },
  },

  electrical_lighting: {
    label: 'Electrical & Lighting',
    emoji: '💡',
    desc: 'Wires, switches, LED lights, solar kits',
    subcategories: [
      'Wires & Cables', 'Switches & Sockets', 'Distribution Boards & Breakers',
      'LED Lights & Bulbs', 'Chandeliers & Decorative Lighting',
      'Outdoor Lighting', 'Generators & Inverter Systems', 'Solar Kits',
      'Surge Protectors & Stabilizers',
    ],
    fields: [
      { id: 'brand',          label: 'Brand',                type: 'combo',   options: ['Schneider', 'ABB', 'Legrand', 'Philips', 'Generic'], required: true },
      { id: 'specifications', label: 'Specifications',       type: 'textarea', placeholder: 'Gauge, core count, amperage, wattage, lumens', required: true },
      { id: 'certification',  label: 'Certification',        type: 'multi',   options: ['SON Certified', 'NEMSA Compliant', 'CE Marked', 'None'], required: true },
      { id: 'unitOfSale',     label: 'Unit of Sale',         type: 'select',  options: ['Per piece', 'Per roll (100m)', 'Per set', 'Per kit'], required: true },
      { id: 'minOrder',       label: 'Minimum Order',        type: 'number',  placeholder: '5', required: false },
    ],
    refundPolicy: {
      type: 'conditional',
      window: 48,
      label: '48hr Return',
      conditions: 'Non-refundable for cut wires/cables. Sealed, packaged items: 48-hour return. Defective items: replaceable with evidence.',
    },
  },

  garden_outdoor: {
    label: 'Garden & Outdoor',
    emoji: '🌿',
    desc: 'Pavers, fencing, artificial grass, pool equipment',
    subcategories: [
      'Landscaping Materials', 'Outdoor Furniture', 'Fencing & Gates',
      'Outdoor Lighting', 'Interlocking Stones & Pavers',
      'Artificial Grass', 'Garden Tools & Equipment', 'Swimming Pool Equipment',
    ],
    fields: [
      { id: 'material',        label: 'Material',              type: 'text',    placeholder: 'Concrete, Steel, Synthetic, Wood', required: true },
      { id: 'dimensions',      label: 'Dimensions / Coverage', type: 'text',    placeholder: 'Per sqm, per roll (2×25m), per panel', required: true },
      { id: 'colorFinish',     label: 'Color / Finish',        type: 'text',    placeholder: 'Red, Grey, Natural Green', required: true },
      { id: 'installService',  label: 'Installation Service?', type: 'select',  options: ['Not Available', 'Yes (Free)', 'Yes (Extra Cost)'], required: false },
      { id: 'installCost',     label: 'Installation Cost (₦)', type: 'number',  placeholder: '1500', required: false },
      { id: 'weatherResistant',label: 'Weather Resistant?',     type: 'toggle',  required: false },
    ],
    refundPolicy: {
      type: 'conditional',
      window: 48,
      label: '48hr Return',
      conditions: 'Unused, uninstalled materials: 48-hour return. Installed items or custom orders: non-refundable.',
    },
  },

  security_safety: {
    label: 'Security & Safety',
    emoji: '🔐',
    desc: 'CCTV, alarms, access control, fire safety',
    subcategories: [
      'CCTV Systems', 'Access Control (Biometric, Card, Keypad)',
      'Alarm Systems', 'Fire Safety (Extinguishers, Detectors)',
      'Safes & Vaults', 'Security Doors & Locks',
      'Intercom Systems', 'Electric Fencing',
    ],
    fields: [
      { id: 'brand',          label: 'Brand',                    type: 'combo',    options: ['Hikvision', 'Dahua', 'CP Plus', 'Yale', 'Samsung'], required: true },
      { id: 'kitContents',    label: "What's in the Kit/Package", type: 'textarea', placeholder: '4 cameras, 1 DVR, cables, HDD, power supply', required: true },
      { id: 'specifications', label: 'Specifications',            type: 'textarea', placeholder: 'Resolution, night vision, storage, app compatibility', required: true },
      { id: 'installIncluded',label: 'Installation Included?',    type: 'select',  options: ['Yes (Free)', 'Yes (Extra Cost)', 'No'], required: true },
      { id: 'installCost',    label: 'Installation Cost (₦)',     type: 'number',  placeholder: '30000', required: false },
      { id: 'warranty',       label: 'Warranty',                  type: 'text',    placeholder: '1 year full, 2 year parts only', required: true },
    ],
    refundPolicy: {
      type: 'conditional',
      window: 168,
      label: '7-Day Return',
      conditions: 'Sealed, uninstalled kits: 7-day return. Installed systems: non-refundable. Defective: warranty replacement.',
    },
  },

  cleaning_maintenance: {
    label: 'Cleaning & Maintenance Supplies',
    emoji: '🧹',
    desc: 'Cleaning chemicals, equipment, pest control',
    subcategories: [
      'Cleaning Chemicals & Detergents', 'Cleaning Equipment',
      'Waste Management (Bins, Compactors)', 'Pest Control Products',
      'Facility Maintenance Tools',
    ],
    fields: [
      { id: 'brand',         label: 'Brand',               type: 'combo',   options: ['Hypo', 'Morning Fresh', 'JIK', 'Harpic'], required: false },
      { id: 'sizeVolume',    label: 'Size / Volume',        type: 'text',    placeholder: '5 liters / Pack of 50 / 1 unit', required: true },
      { id: 'bulkPricing',   label: 'Bulk Pricing',         type: 'text',    placeholder: '10+ units: 5% off', required: false },
      { id: 'safetyData',    label: 'Safety Classification', type: 'select', options: ['Hazardous', 'Non-Hazardous', 'Eco-Friendly'], required: true },
      { id: 'activeIngredient', label: 'Active Ingredient',  type: 'text',   placeholder: 'Sodium hypochlorite, etc.', required: false },
    ],
    refundPolicy: {
      type: 'non_refundable',
      window: 0,
      label: 'Non-Refundable',
      conditions: 'Non-refundable (consumable goods). Wrong product: exchange via dispute. Damaged in transit: full refund with photo evidence.',
    },
  },

  professional_services: {
    label: 'Professional Services',
    emoji: '👷',
    desc: 'Installation, plumbing, electrical, cleaning',
    subcategories: [
      'Plumbing Services', 'Electrical Installation', 'Painting & Finishing',
      'Tiling & Flooring Installation', 'AC Installation & Maintenance',
      'Fumigation & Pest Control', 'Cleaning Services (Deep, Post-Construction)',
      'Interior Design Consultation', 'Landscaping Services', 'General Handyman',
    ],
    fields: [
      { id: 'serviceDescription', label: 'Service Description',  type: 'textarea', placeholder: 'Detailed scope of what is included', required: true },
      { id: 'pricingModel',       label: 'Pricing Model',        type: 'select',   options: ['Fixed Price', 'Per Hour', 'Per sqm', 'Per Unit', 'Custom Quote'], required: true },
      { id: 'serviceArea',        label: 'Service Area',         type: 'text',     placeholder: 'Lagos Island, Mainland, Lekki, Ikoyi', required: true },
      { id: 'availability',       label: 'Availability',         type: 'text',     placeholder: 'Mon-Sat: 8AM-5PM', required: true },
      { id: 'estimatedDuration',  label: 'Estimated Duration',   type: 'select',   options: ['2-4 hours', 'Full day', '2-3 days', '1 week+'], required: true },
      { id: 'certifications',     label: 'Certifications',       type: 'text',     placeholder: 'Electrical license, safety certs', required: false },
      { id: 'workWarranty',       label: 'Warranty on Work',     type: 'text',     placeholder: '30-day workmanship guarantee', required: true },
    ],
    refundPolicy: {
      type: 'conditional',
      window: 0,
      label: 'Service-Based',
      conditions: 'Before service date: full refund (minus 10% booking fee if <24hrs). After completion: non-refundable, disputes only for unsatisfactory work. Escrow released 48hrs after completion if no dispute.',
    },
  },
};

// ── Flat list for dropdowns / category chips ────────────────
export const PRODUCT_CATEGORY_LIST = Object.entries(PRODUCT_CATEGORY_MAP).map(
  ([value, cat]) => ({ value, label: cat.label, emoji: cat.emoji, desc: cat.desc }),
);

// ── Refund window lookup by category ────────────────────────
export const REFUND_WINDOWS = Object.fromEntries(
  Object.entries(PRODUCT_CATEGORY_MAP).map(([key, cat]) => [key, cat.refundPolicy]),
);

// ── Refund badge color helpers ──────────────────────────────
export const REFUND_BADGE_STYLES = {
  non_refundable: { label: 'Non-Refundable', bg: 'bg-red-50 dark:bg-red-500/10', text: 'text-red-600 dark:text-red-400' },
  conditional:    { label: 'Conditional Return', bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
};

// ── Get refund badge props for a product ────────────────────
export function getRefundBadge(category) {
  const policy = PRODUCT_CATEGORY_MAP[category]?.refundPolicy;
  if (!policy) return REFUND_BADGE_STYLES.non_refundable;
  const style = REFUND_BADGE_STYLES[policy.type] || REFUND_BADGE_STYLES.non_refundable;
  return { ...style, label: policy.label, window: policy.window, conditions: policy.conditions };
}
