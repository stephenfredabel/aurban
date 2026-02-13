// ─────────────────────────────────────────────────────────────
// Aurban — Marketplace listing options
// Real estate products ONLY — no general consumer goods
// ─────────────────────────────────────────────────────────────

export const MARKETPLACE_CATEGORIES = [
  {
    value: 'building_materials',
    label: 'Building Materials',
    icon: '🧱',
    desc: 'Cement, blocks, steel, roofing',
    subcategories: [
      'Cement','Concrete Blocks','Laterite / Sand','Roofing Sheets',
      'Steel Rods (Iron Rods)','Roofing Nails & Screws','Waterproof Membrane',
      'Gravel & Granite','Lumber & Timber','Fascia & Soffit Boards',
    ],
  },
  {
    value: 'finishing',
    label: 'Finishing Materials',
    icon: '🎨',
    desc: 'Tiles, paints, flooring, wallpaper',
    subcategories: [
      'Floor Tiles','Wall Tiles','Paints & Primers','Wallpaper',
      'Vinyl Flooring','Laminate Flooring','Marble & Granite Slabs',
      'Skirting Boards','Cornices & Mouldings','Grout & Adhesives',
    ],
  },
  {
    value: 'plumbing_fittings',
    label: 'Plumbing & Fittings',
    icon: '🚰',
    desc: 'Pipes, valves, bathroom fittings',
    subcategories: [
      'PVC Pipes & Fittings','PPR Pipes','Water Tanks & Reservoirs',
      'Water Pumps','Bathroom Suites','Toilets & WC','Sinks & Wash Basins',
      'Bathtubs & Shower Trays','Taps & Mixers','Water Heaters',
    ],
  },
  {
    value: 'electrical_fittings',
    label: 'Electrical Fittings',
    icon: '💡',
    desc: 'Cables, switches, lighting',
    subcategories: [
      'Electrical Cables & Wires','Circuit Breakers & MCBs','Sockets & Switches',
      'Distribution Boards (DBs)','LED Bulbs & Tubes','Chandeliers & Pendant Lights',
      'Outdoor & Security Lights','Solar Lights','Conduit Pipes & Fittings',
    ],
  },
  {
    value: 'doors_windows',
    label: 'Doors & Windows',
    icon: '🚪',
    desc: 'Interior & exterior doors, window frames',
    subcategories: [
      'Wooden Doors','Steel Security Doors','Aluminium Doors & Frames',
      'UPVC Doors','Interior Doors','Wooden Windows','Aluminium Windows',
      'UPVC Windows','Sliding Doors','Burglar Proof Bars',
    ],
  },
  {
    value: 'furniture',
    label: 'Furniture',
    icon: '🛋️',
    desc: 'Home and office furniture',
    subcategories: [
      'Living Room Sets','Bedroom Sets','Dining Sets','Office Desks & Chairs',
      'Kitchen Cabinets & Wardrobes','TV Stands & Shelving','Outdoor Furniture',
      'Mattresses','Curtain Rails & Rods','Storage & Shelving Units',
    ],
  },
  {
    value: 'kitchen_bathroom',
    label: 'Kitchen & Bathroom',
    icon: '🍳',
    desc: 'Built-in appliances, fittings',
    subcategories: [
      'Built-in Ovens & Hobs','Kitchen Hoods & Extractors','Refrigerators (Built-in)',
      'Dishwashers','Kitchen Sinks','Bathroom Mirrors & Cabinets',
      'Towel Rails & Accessories','Shower Enclosures','Steam & Sauna Cabins',
    ],
  },
  {
    value: 'solar_power',
    label: 'Solar & Power',
    icon: '☀️',
    desc: 'Solar panels, inverters, batteries',
    subcategories: [
      'Solar Panels','Inverters','Deep Cycle Batteries','Charge Controllers',
      'Solar Water Heaters','Solar Street Lights','Generators',
      'Automatic Transfer Switches (ATS)','UPS Systems',
    ],
  },
  {
    value: 'security_systems',
    label: 'Security Systems',
    icon: '📹',
    desc: 'CCTV cameras, alarms, gates',
    subcategories: [
      'CCTV Camera Systems','Alarm Systems','Smart Locks','Electric Fences',
      'Gate Automation','Access Control Systems','Video Doorbells',
      'Fire Alarm Systems','Panic Buttons',
    ],
  },
  {
    value: 'construction_tools',
    label: 'Construction Tools',
    icon: '⚒️',
    desc: 'Power tools, hand tools, equipment',
    subcategories: [
      'Power Drills & Impact Drivers','Angle Grinders','Concrete Mixers',
      'Scaffolding','Ladders','Hand Tools (Hammers, Spanners)','Welding Equipment',
      'Levels & Measuring Tools','Safety PPE','Compressors',
    ],
  },
  {
    value: 'landscaping_outdoor',
    label: 'Landscaping & Outdoor',
    icon: '🌱',
    desc: 'Paving, fencing, garden materials',
    subcategories: [
      'Interlocking Paving Stones','Decking Boards','Fencing Materials',
      'Garden Soil & Mulch','Artificial Grass','Irrigation Pipes & Fittings',
      'Outdoor Pots & Planters','Garden Lights','Swimming Pool Equipment',
    ],
  },
];

// Condition options
export const ITEM_CONDITIONS = [
  { value: 'new',          label: 'Brand New'           },
  { value: 'fairly_used',  label: 'Fairly Used / Refurbished' },
  { value: 'open_box',     label: 'Open Box (Never Used)' },
];

// Pricing units
export const PRICING_UNITS = [
  { value: 'per_unit',   label: 'Per Unit / Piece'  },
  { value: 'per_bag',    label: 'Per Bag / Pack'     },
  { value: 'per_carton', label: 'Per Carton / Box'   },
  { value: 'per_sqm',    label: 'Per sqm'            },
  { value: 'per_roll',   label: 'Per Roll'           },
  { value: 'per_set',    label: 'Per Set'            },
  { value: 'per_metre',  label: 'Per Metre'          },
  { value: 'per_tonne',  label: 'Per Tonne'          },
  { value: 'bulk_price', label: 'Bulk / LOT Price'   },
];

// Delivery options
export const DELIVERY_OPTIONS = [
  { value: 'pickup',    label: 'Pickup Only (Buyer Collects)'     },
  { value: 'delivery',  label: 'Delivery Available'               },
  { value: 'both',      label: 'Pickup or Delivery (Your Choice)' },
];