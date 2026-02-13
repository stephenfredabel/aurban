// ─────────────────────────────────────────────────────────────
// Aurban — Listing options, amenities, rules and config data
// ─────────────────────────────────────────────────────────────

// ── Property listing categories ───────────────────────────────
export const LISTING_CATEGORIES = [
  { value: 'rental',    label: 'For Rent',    icon: '🔑', desc: 'Monthly or yearly tenancy'        },
  { value: 'shortlet',  label: 'Shortlet',    icon: '🌙', desc: 'Daily or weekly stays'            },
  { value: 'lease',     label: 'Lease',       icon: '📋', desc: 'Long-term lease agreements'       },
  { value: 'sale',      label: 'For Sale',    icon: '🏷️', desc: 'Outright purchase'               },
  { value: 'land',      label: 'Land',        icon: '🌍', desc: 'Land plots and lots'              },
  { value: 'shared',    label: 'Shared Space',icon: '🤝', desc: 'Co-living or office co-working'  },
];

// ── Property types per category ───────────────────────────────
export const PROPERTY_TYPES = {
  rental: [
    'Apartment / Flat', 'Studio', 'Mini Flat', 'Room Self-Con',
    'Duplex', 'Bungalow', 'Terrace House', 'Semi-Detached',
    'Detached House', 'Mansion', 'Penthouse', 'Office Space',
    'Shop', 'Warehouse', 'Event Center',
  ],
  shortlet: [
    'Apartment / Flat', 'Studio', 'Mini Flat', 'Duplex',
    'Penthouse', 'Mansion', 'Guesthouse', 'Villa',
    'Serviced Apartment', 'Townhouse',
  ],
  lease: [
    'Apartment / Flat', 'Duplex', 'Terrace House', 'Semi-Detached',
    'Detached House', 'Office Space', 'Commercial Building',
    'Warehouse', 'Factory', 'Shop', 'Event Center',
  ],
  sale: [
    'Apartment / Flat', 'Studio', 'Mini Flat', 'Duplex',
    'Bungalow', 'Terrace House', 'Semi-Detached', 'Detached House',
    'Mansion', 'Penthouse', 'Commercial Building', 'Office Complex',
    'Warehouse', 'Hotel', 'Guest House',
  ],
  land: [
    'Residential Plot', 'Commercial Plot', 'Industrial Plot',
    'Agricultural Land', 'Waterfront Land', 'Corner Piece',
    'Estate Land', 'Dry Land', 'Reclaimed Land',
  ],
  shared: [
    'Shared Apartment', 'Co-Living Space', 'Shared Office',
    'Co-Working Space', 'Room in a House', 'Hostel Room',
    'Shared Studio',
  ],
};

// ── Pricing periods ──────────────────────────────────────────
// Config: which periods are available per category
export const PRICING_PERIODS = {
  rental: [
    { value: 'monthly', label: 'Per Month' },
    { value: 'yearly',  label: 'Per Year'  },
  ],
  shortlet: [
    { value: 'daily',   label: 'Per Night' },
    { value: 'weekly',  label: 'Per Week'  },
  ],
  lease: [
    { value: 'monthly', label: 'Per Month' },
    { value: 'yearly',  label: 'Per Year'  },
  ],
  sale: [
    { value: 'total', label: 'Total Price' },
  ],
  land: [
    { value: 'total', label: 'Total Price' },
    { value: 'per_sqm', label: 'Per sqm'  },
    { value: 'per_plot', label: 'Per Plot' },
  ],
  shared: [
    { value: 'monthly', label: 'Per Month' },
    { value: 'weekly',  label: 'Per Week'  },
  ],
};

// Default period per category
export const DEFAULT_PERIOD = {
  rental: 'yearly',   // Nigeria charges yearly by default
  shortlet: 'daily',
  lease: 'yearly',
  sale: 'total',
  land: 'total',
  shared: 'monthly',
};

// ── Photo requirements per category ──────────────────────────
export const PHOTO_REQUIREMENTS = {
  rental:   { min: 8,  max: 20, required: ['Living Room', 'Kitchen', 'Bedroom(s)', 'Bathroom(s)', 'Exterior Front'] },
  shortlet: { min: 10, max: 20, required: ['Living Room', 'Kitchen', 'All Bedrooms', 'Bathrooms', 'Exterior Front', 'Amenities'] },
  lease:    { min: 8,  max: 20, required: ['Main Area', 'Entrance', 'Toilets', 'Exterior'] },
  sale:     { min: 8,  max: 20, required: ['Living Room', 'Kitchen', 'Bedroom(s)', 'Bathroom(s)', 'Exterior Front', 'Compound'] },
  land:     { min: 4,  max: 15, required: ['Plot (4 corners)', 'Street Frontage', 'Neighbourhood', 'Survey Document'] },
  shared:   { min: 5,  max: 15, required: ['Room/Space', 'Bathroom', 'Kitchen/Common Area', 'Exterior'] },
};

// ── Nigerian states ──────────────────────────────────────────
export const NIGERIA_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue',
  'Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu',
  'Federal Capital Territory','Gombe','Imo','Jigawa','Kaduna','Kano',
  'Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger',
  'Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
];

// ── Lagos LGAs (most active market) ──────────────────────────
export const LAGOS_LGAS = [
  'Agege','Ajeromi-Ifelodun','Alimosho','Amuwo-Odofin','Apapa',
  'Badagry','Epe','Eti-Osa','Ibeju-Lekki','Ifako-Ijaiye',
  'Ikeja','Ikorodu','Kosofe','Lagos Island','Lagos Mainland',
  'Mushin','Ojo','Oshodi-Isolo','Shomolu','Surulere',
];

// ── Furnishing options ───────────────────────────────────────
export const FURNISHING_OPTIONS = [
  { value: 'unfurnished',       label: 'Unfurnished'        },
  { value: 'semi_furnished',    label: 'Semi-Furnished'     },
  { value: 'furnished',         label: 'Fully Furnished'    },
  { value: 'serviced',          label: 'Serviced'           },
];

// ── Amenities list ───────────────────────────────────────────
export const AMENITIES = [
  // Power & utilities
  { id: 'gen_set',     label: 'Generator / Backup Power', group: 'Power & Utilities' },
  { id: 'solar',       label: 'Solar Power',               group: 'Power & Utilities' },
  { id: 'inverter',    label: 'Inverter',                  group: 'Power & Utilities' },
  { id: 'borehole',    label: 'Borehole / Water Supply',   group: 'Power & Utilities' },
  { id: 'prepaid',     label: 'Prepaid Meter',             group: 'Power & Utilities' },
  // Security
  { id: 'security',    label: '24/7 Security',             group: 'Security' },
  { id: 'cctv',        label: 'CCTV',                      group: 'Security' },
  { id: 'gatehouse',   label: 'Gatehouse',                 group: 'Security' },
  { id: 'intercom',    label: 'Intercom',                  group: 'Security' },
  { id: 'fence',       label: 'Perimeter Fence',           group: 'Security' },
  { id: 'alarm',       label: 'Alarm System',              group: 'Security' },
  // Outdoor
  { id: 'parking',     label: 'Parking Space',             group: 'Outdoor' },
  { id: 'garden',      label: 'Garden / Landscaping',      group: 'Outdoor' },
  { id: 'pool',        label: 'Swimming Pool',             group: 'Outdoor' },
  { id: 'playground',  label: "Children's Playground",     group: 'Outdoor' },
  { id: 'outdoor_gym', label: 'Outdoor Gym',               group: 'Outdoor' },
  { id: 'bbq',         label: 'BBQ Area',                  group: 'Outdoor' },
  // Indoor
  { id: 'gym',         label: 'Gym / Fitness Room',        group: 'Indoor' },
  { id: 'elevator',    label: 'Elevator / Lift',           group: 'Indoor' },
  { id: 'ac',          label: 'Air Conditioning',          group: 'Indoor' },
  { id: 'pop_ceiling', label: 'POP Ceiling',               group: 'Indoor' },
  { id: 'wardrobe',    label: 'Built-in Wardrobes',        group: 'Indoor' },
  { id: 'balcony',     label: 'Balcony',                   group: 'Indoor' },
  { id: 'laundry',     label: 'Laundry Room',              group: 'Indoor' },
  { id: 'dsq',         label: "Boys' Quarters (BQ)",       group: 'Indoor' },
  // Estate / Location
  { id: 'estate',      label: 'Estate / Gated Community',  group: 'Estate' },
  { id: 'tarred_road', label: 'Tarred Road',               group: 'Estate' },
  { id: 'drainage',    label: 'Drainage System',           group: 'Estate' },
  { id: 'wifi',        label: 'Fibre / Fast Internet',     group: 'Estate' },
];

// Group amenities for display
export function groupAmenities() {
  return AMENITIES.reduce((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});
}

// ── House rules ──────────────────────────────────────────────
export const HOUSE_RULES = [
  { id: 'no_pets',       label: 'No Pets',              icon: '🐾' },
  { id: 'no_smoking',    label: 'No Smoking',           icon: '🚬' },
  { id: 'no_parties',    label: 'No Parties / Events',  icon: '🎉' },
  { id: 'no_students',   label: 'No Students',          icon: '🎓' },
  { id: 'no_bachelors',  label: 'No Bachelors',         icon: '👤' },
  { id: 'no_males',      label: 'Females Only',         icon: '♀️'  },
  { id: 'no_females',    label: 'Males Only',           icon: '♂️'  },
  { id: 'couples_only',  label: 'Couples Preferred',    icon: '💑' },
  { id: 'quiet_hours',   label: 'Quiet Hours Apply',    icon: '🔇' },
  { id: 'no_cooking',    label: 'No Cooking (shortlet)',icon: '🍳' },
];

// ── Minimum lease durations ───────────────────────────────────
export const MIN_DURATIONS = [
  { value: '1_month',   label: '1 Month'    },
  { value: '3_months',  label: '3 Months'   },
  { value: '6_months',  label: '6 Months'   },
  { value: '1_year',    label: '1 Year'     },
  { value: '2_years',   label: '2 Years'    },
  { value: 'flexible',  label: 'Flexible'   },
];

// ── Land document types ───────────────────────────────────────
export const LAND_DOCUMENTS = [
  { value: 'c_of_o',     label: 'C of O (Certificate of Occupancy)' },
  { value: 'r_of_o',     label: 'R of O (Right of Occupancy)'        },
  { value: 'deed',       label: 'Deed of Assignment'                 },
  { value: 'govt_excision', label: 'Government Excision'             },
  { value: 'gazette',    label: 'Gazette'                            },
  { value: 'survey',     label: 'Survey Plan'                        },
  { value: 'fha',        label: 'FHA / FCDA Allocation'              },
  { value: 'dpc',        label: 'DPC Approval'                       },
  { value: 'family',     label: 'Family Land / Receipt'              },
];

// ── Inspection time slots ────────────────────────────────────
export const TIME_SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00',
];

export const DAYS_OF_WEEK = [
  { key: 'monday',    short: 'Mon', label: 'Monday'    },
  { key: 'tuesday',   short: 'Tue', label: 'Tuesday'   },
  { key: 'wednesday', short: 'Wed', label: 'Wednesday' },
  { key: 'thursday',  short: 'Thu', label: 'Thursday'  },
  { key: 'friday',    short: 'Fri', label: 'Friday'    },
  { key: 'saturday',  short: 'Sat', label: 'Saturday'  },
  { key: 'sunday',    short: 'Sun', label: 'Sunday'    },
];

// ── Form steps per category ───────────────────────────────────
export const FORM_STEPS = {
  land: ['basics', 'location', 'details', 'documents', 'media', 'inspection', 'preview'],
  default: ['basics', 'location', 'details', 'amenities', 'rules', 'media', 'inspection', 'preview'],
  shortlet: ['basics', 'location', 'details', 'amenities', 'rules', 'media', 'preview'],
  sale: ['basics', 'location', 'details', 'amenities', 'media', 'preview'],
};

export function getSteps(category) {
  return FORM_STEPS[category] || FORM_STEPS.default;
}