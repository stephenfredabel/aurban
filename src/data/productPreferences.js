// ─────────────────────────────────────────────────────────────
// GLOBAL PRODUCT PREFERENCE ENGINE
//
// Platform-defined structured attributes for building material
// subcategories. Providers can ONLY select from these predefined
// values — they cannot create new attributes.
//
// Flow:  Provider selects Category → Subcategory → Product
//        System loads the preference template automatically
//        Provider selects attribute values from dropdowns
//        Provider sets price + stock per combination
// ─────────────────────────────────────────────────────────────

export const PRODUCT_PREFERENCES = {
  /* ═══════════════════════════════════════════════════════════
     1. STEEL & REINFORCEMENT
  ═══════════════════════════════════════════════════════════ */
  steel_reinforcement: {
    label: 'Steel & Reinforcement',
    emoji: '🔩',
    parentCategory: 'building_materials',
    matchSubcategories: ['Iron & Steel (Rods, Sheets)', 'Iron & Steel'],
    products: {
      tmt_iron_rods: {
        label: 'TMT Iron Rods',
        preferences: {
          diameter_mm: { label: 'Diameter (mm)',  options: [6, 8, 10, 12, 16, 20, 25, 32] },
          length_m:    { label: 'Length (m)',      options: [6, 9, 12] },
          grade:       { label: 'Grade',           options: ['Fe415', 'Fe500', 'Fe500D', 'Fe550', 'Fe600'] },
          type:        { label: 'Type',            options: ['TMT'] },
          surface:     { label: 'Surface',         options: ['Ribbed'] },
          unit:        { label: 'Unit of Sale',    options: ['Piece', 'Ton', 'Bundle'] },
        },
      },
      mild_steel_rods: {
        label: 'Mild Steel Rods',
        preferences: {
          diameter_mm: { label: 'Diameter (mm)',  options: [6, 8, 10, 12] },
          length_m:    { label: 'Length (m)',      options: [6, 12] },
          grade:       { label: 'Grade',           options: ['MS (Mild Steel)'] },
          surface:     { label: 'Surface',         options: ['Smooth', 'Galvanized'] },
          unit:        { label: 'Unit of Sale',    options: ['Piece', 'Ton', 'Bundle'] },
        },
      },
      deformed_bars: {
        label: 'Deformed Bars (Y-Bars)',
        preferences: {
          diameter_mm: { label: 'Diameter (mm)',  options: [10, 12, 16, 20, 25, 32, 40] },
          length_m:    { label: 'Length (m)',      options: [12] },
          grade:       { label: 'Grade',           options: ['Y8', 'Y10', 'Y12', 'Y16', 'Y20', 'Y25'] },
          unit:        { label: 'Unit of Sale',    options: ['Piece', 'Ton'] },
        },
      },
      binding_wire: {
        label: 'Binding Wire',
        preferences: {
          gauge:   { label: 'Gauge (BWG)',    options: [16, 18, 20, 22] },
          weight:  { label: 'Weight',          options: ['1kg', '5kg', '10kg', '25kg'] },
          coating: { label: 'Coating',         options: ['Black Annealed', 'Galvanized'] },
          unit:    { label: 'Unit of Sale',    options: ['Roll', 'Kg'] },
        },
      },
      brc_mesh: {
        label: 'BRC Mesh / Wire Mesh',
        preferences: {
          mesh_type: { label: 'Mesh Type',     options: ['A142', 'A193', 'A252', 'A393'] },
          size:      { label: 'Sheet Size',    options: ['2.4m x 1.2m', '3.6m x 2.0m', '4.8m x 2.4m'] },
          wire_dia:  { label: 'Wire Dia (mm)', options: [6, 8, 10, 12] },
          unit:      { label: 'Unit of Sale',  options: ['Sheet', 'Roll'] },
        },
      },
      steel_pipes: {
        label: 'Steel Pipes',
        preferences: {
          diameter_inch: { label: 'Diameter (inch)', options: ['1/2', '3/4', '1', '1.5', '2', '3', '4', '6'] },
          thickness_mm:  { label: 'Thickness (mm)',  options: [1.2, 1.5, 2.0, 2.5, 3.0] },
          length_m:      { label: 'Length (m)',       options: [6] },
          type:          { label: 'Type',            options: ['ERW', 'Galvanized', 'Black', 'Stainless'] },
          unit:          { label: 'Unit of Sale',    options: ['Piece', 'Bundle'] },
        },
      },
      steel_strips: {
        label: 'Flat Bars / Steel Strips',
        preferences: {
          width_mm:     { label: 'Width (mm)',     options: [20, 25, 30, 40, 50, 75, 100] },
          thickness_mm: { label: 'Thickness (mm)', options: [3, 4, 5, 6, 8, 10] },
          length_m:     { label: 'Length (m)',      options: [6, 12] },
          unit:         { label: 'Unit of Sale',   options: ['Piece', 'Ton'] },
        },
      },
    },
  },

  /* ═══════════════════════════════════════════════════════════
     2. WOOD & PANEL MATERIALS
  ═══════════════════════════════════════════════════════════ */
  wood_panel: {
    label: 'Wood & Panel Materials',
    emoji: '🪵',
    parentCategory: 'building_materials',
    matchSubcategories: ['Wood & Timber', 'POP & Ceiling Materials'],
    products: {
      marine_board: {
        label: 'Marine Board',
        preferences: {
          size:         { label: 'Size',            options: ['8x4 ft'] },
          thickness_mm: { label: 'Thickness (mm)',  options: [6, 9, 12, 15, 18, 25] },
          finish:       { label: 'Finish',          options: ['Raw', 'High Gloss', 'Laminated'] },
          density:      { label: 'Density',         options: ['Standard', 'High Density'] },
          color:        { label: 'Color',           options: ['White', 'Walnut', 'Black', 'Custom'] },
          unit:         { label: 'Unit of Sale',    options: ['Sheet'] },
        },
      },
      mdf_board: {
        label: 'MDF Board',
        preferences: {
          size:         { label: 'Size',            options: ['8x4 ft', '6x4 ft'] },
          thickness_mm: { label: 'Thickness (mm)',  options: [3, 6, 9, 12, 15, 18, 25] },
          finish:       { label: 'Finish',          options: ['Raw', 'Melamine Faced', 'Veneer'] },
          unit:         { label: 'Unit of Sale',    options: ['Sheet'] },
        },
      },
      hdf_board: {
        label: 'HDF Board',
        preferences: {
          size:         { label: 'Size',            options: ['8x4 ft'] },
          thickness_mm: { label: 'Thickness (mm)',  options: [3, 6, 8, 12] },
          finish:       { label: 'Finish',          options: ['Raw', 'High Gloss', 'Matt', 'Textured'] },
          color:        { label: 'Color',           options: ['White', 'Walnut', 'Oak', 'Black', 'Custom'] },
          unit:         { label: 'Unit of Sale',    options: ['Sheet'] },
        },
      },
      plywood: {
        label: 'Plywood',
        preferences: {
          size:         { label: 'Size',            options: ['8x4 ft'] },
          thickness_mm: { label: 'Thickness (mm)',  options: [4, 6, 9, 12, 15, 18, 25] },
          type:         { label: 'Type',            options: ['Commercial', 'Marine', 'BWP', 'Shuttering'] },
          wood:         { label: 'Wood Species',    options: ['Hardwood', 'Softwood', 'Mixed'] },
          unit:         { label: 'Unit of Sale',    options: ['Sheet'] },
        },
      },
      particle_board: {
        label: 'Particle Board',
        preferences: {
          size:         { label: 'Size',            options: ['8x4 ft'] },
          thickness_mm: { label: 'Thickness (mm)',  options: [9, 12, 16, 18, 25] },
          finish:       { label: 'Finish',          options: ['Raw', 'Laminated'] },
          unit:         { label: 'Unit of Sale',    options: ['Sheet'] },
        },
      },
      block_board: {
        label: 'Block Board',
        preferences: {
          size:         { label: 'Size',            options: ['8x4 ft'] },
          thickness_mm: { label: 'Thickness (mm)',  options: [19, 25] },
          core:         { label: 'Core',            options: ['Softwood', 'Hardwood'] },
          unit:         { label: 'Unit of Sale',    options: ['Sheet'] },
        },
      },
      fluted_panels: {
        label: 'Fluted Panels',
        preferences: {
          size:         { label: 'Size',            options: ['8x4 ft', '8x2 ft'] },
          material:     { label: 'Material',        options: ['WPC', 'PVC', 'MDF'] },
          finish:       { label: 'Finish',          options: ['Matt', 'High Gloss', 'Textured'] },
          color:        { label: 'Color',           options: ['White', 'Grey', 'Walnut', 'Oak', 'Black', 'Custom'] },
          unit:         { label: 'Unit of Sale',    options: ['Sheet', 'Pack'] },
        },
      },
      wall_panels: {
        label: 'Wall Panels',
        preferences: {
          size:         { label: 'Size',            options: ['8x4 ft', '4x2 ft', 'Per sqm'] },
          material:     { label: 'Material',        options: ['PVC', 'WPC', 'Fibre Cement', '3D Gypsum'] },
          finish:       { label: 'Finish',          options: ['Smooth', 'Textured', 'Patterned'] },
          color:        { label: 'Color',           options: ['White', 'Grey', 'Cream', 'Custom'] },
          unit:         { label: 'Unit of Sale',    options: ['Sheet', 'Per sqm', 'Pack'] },
        },
      },
      timber: {
        label: 'Timber / Lumber',
        preferences: {
          wood:         { label: 'Wood Type',       options: ['Iroko', 'Mahogany', 'Opepe', 'Obeche', 'Afara', 'Pine'] },
          dimensions:   { label: 'Dimensions',      options: ['2x2 inch', '2x3 inch', '2x4 inch', '2x6 inch', '3x3 inch', '4x4 inch'] },
          length_ft:    { label: 'Length (ft)',      options: [6, 8, 10, 12, 14] },
          treatment:    { label: 'Treatment',       options: ['Untreated', 'Treated / Preserved', 'Kiln Dried'] },
          unit:         { label: 'Unit of Sale',    options: ['Piece', 'Bundle', 'Per ft'] },
        },
      },
      construction_planks: {
        label: 'Construction Planks / Scaffolding Boards',
        preferences: {
          thickness:    { label: 'Thickness',       options: ['1 inch', '1.5 inch', '2 inch'] },
          width:        { label: 'Width',           options: ['9 inch', '12 inch'] },
          length_ft:    { label: 'Length (ft)',      options: [10, 12, 14] },
          condition:    { label: 'Condition',       options: ['New', 'Used (Grade A)', 'Used (Grade B)'] },
          unit:         { label: 'Unit of Sale',    options: ['Piece', 'Dozen'] },
        },
      },
      bamboo: {
        label: 'Bamboo',
        preferences: {
          type:         { label: 'Type',            options: ['Solid Bamboo', 'Strand Woven', 'Engineered', 'Natural Poles'] },
          diameter_mm:  { label: 'Diameter (mm)',   options: [30, 40, 50, 60, 80, 100] },
          length_m:     { label: 'Length (m)',       options: [2, 3, 4, 6] },
          treatment:    { label: 'Treatment',       options: ['Natural', 'Carbonized', 'Preserved'] },
          unit:         { label: 'Unit of Sale',    options: ['Piece', 'Bundle'] },
        },
      },
    },
  },

  /* ═══════════════════════════════════════════════════════════
     3. CEMENT & BINDING MATERIALS
  ═══════════════════════════════════════════════════════════ */
  cement_binding: {
    label: 'Cement & Binding Materials',
    emoji: '🧱',
    parentCategory: 'building_materials',
    matchSubcategories: ['Cement & Concrete'],
    products: {
      portland_cement: {
        label: 'Cement (50kg)',
        preferences: {
          brand: { label: 'Brand',          options: ['Dangote', 'BUA', 'Lafarge', 'Unicem', 'Ibeto'] },
          grade: { label: 'Grade',          options: ['32.5N', '32.5R', '42.5N', '42.5R', '52.5N'] },
          type:  { label: 'Type',           options: ['OPC (Ordinary Portland)', 'PPC (Portland Pozzolana)', 'SRC (Sulphate Resistant)'] },
          unit:  { label: 'Unit of Sale',   options: ['Bag', 'Ton', 'Pallet', 'Trailer Load'] },
        },
      },
      white_cement: {
        label: 'White Cement',
        preferences: {
          brand:  { label: 'Brand',         options: ['Birla White', 'Dangote', 'Imported'] },
          weight: { label: 'Weight',        options: ['5kg', '20kg', '40kg'] },
          unit:   { label: 'Unit of Sale',  options: ['Bag', 'Carton'] },
        },
      },
      tile_adhesive: {
        label: 'Tile Adhesive / Gum',
        preferences: {
          brand:    { label: 'Brand',       options: ['Davco', 'Sika', 'TAL', 'Dangote', 'Generic'] },
          type:     { label: 'Type',        options: ['Standard', 'Flexible', 'Rapid Set', 'Heavy Duty'] },
          weight:   { label: 'Weight',      options: ['20kg', '25kg'] },
          coverage: { label: 'Coverage',    options: ['3-5 sqm/bag', '5-7 sqm/bag', '7-10 sqm/bag'] },
          unit:     { label: 'Unit of Sale', options: ['Bag', 'Pallet'] },
        },
      },
      grout: {
        label: 'Grout / Filling',
        preferences: {
          brand: { label: 'Brand',          options: ['Davco', 'Weber', 'Sika', 'Generic'] },
          type:  { label: 'Type',           options: ['Unsanded', 'Sanded', 'Epoxy'] },
          color: { label: 'Color',          options: ['White', 'Grey', 'Black', 'Beige', 'Custom'] },
          weight: { label: 'Weight',        options: ['2kg', '5kg', '10kg'] },
          unit:  { label: 'Unit of Sale',   options: ['Bag', 'Bucket'] },
        },
      },
      ready_mix_concrete: {
        label: 'Ready-Mix Concrete',
        preferences: {
          grade:   { label: 'Grade',         options: ['C20', 'C25', 'C30', 'C35', 'C40'] },
          slump:   { label: 'Slump (mm)',    options: ['50-75', '75-100', '100-150'] },
          unit:    { label: 'Unit of Sale',  options: ['Per cubic metre', 'Per truck (5m³)', 'Per truck (8m³)'] },
        },
      },
    },
  },

  /* ═══════════════════════════════════════════════════════════
     4. CONTAINERS & STRUCTURAL UNITS
  ═══════════════════════════════════════════════════════════ */
  containers_structural: {
    label: 'Containers & Structural Steel',
    emoji: '📦',
    parentCategory: 'building_materials',
    matchSubcategories: [],
    products: {
      shipping_container: {
        label: 'Shipping Container',
        preferences: {
          size:      { label: 'Size',          options: ['20ft', '40ft', '40ft HC (High Cube)'] },
          condition: { label: 'Condition',     options: ['New', 'One-Trip', 'Used (Grade A)', 'Used (Grade B)'] },
          type:      { label: 'Type',          options: ['Dry / Standard', 'Reefer (Refrigerated)', 'Open Top', 'Flat Rack'] },
          door_type: { label: 'Door Type',     options: ['Single', 'Double'] },
          unit:      { label: 'Unit of Sale',  options: ['Unit'] },
        },
      },
      i_beam: {
        label: 'I-Beam (Universal Beam)',
        preferences: {
          size:     { label: 'Size (mm)',      options: ['152x89', '203x102', '203x133', '254x102', '254x146', '305x165', '356x171', '406x178'] },
          length_m: { label: 'Length (m)',      options: [6, 9, 12] },
          grade:    { label: 'Grade',          options: ['S275', 'S355'] },
          unit:     { label: 'Unit of Sale',   options: ['Piece', 'Ton'] },
        },
      },
      h_beam: {
        label: 'H-Beam (Universal Column)',
        preferences: {
          size:     { label: 'Size (mm)',      options: ['152x152', '203x203', '254x254', '305x305'] },
          length_m: { label: 'Length (m)',      options: [6, 9, 12] },
          grade:    { label: 'Grade',          options: ['S275', 'S355'] },
          unit:     { label: 'Unit of Sale',   options: ['Piece', 'Ton'] },
        },
      },
      angle_iron: {
        label: 'Angle Iron',
        preferences: {
          size:         { label: 'Size (mm)',      options: ['25x25', '30x30', '40x40', '50x50', '65x65', '75x75', '100x100'] },
          thickness_mm: { label: 'Thickness (mm)', options: [3, 4, 5, 6, 8] },
          length_m:     { label: 'Length (m)',      options: [6, 12] },
          unit:         { label: 'Unit of Sale',   options: ['Piece', 'Bundle', 'Ton'] },
        },
      },
      channel_iron: {
        label: 'Channel Iron (C-Channel)',
        preferences: {
          size:     { label: 'Size (mm)',      options: ['75x40', '100x50', '125x65', '150x75', '200x90'] },
          length_m: { label: 'Length (m)',      options: [6, 12] },
          grade:    { label: 'Grade',          options: ['S275', 'S355'] },
          unit:     { label: 'Unit of Sale',   options: ['Piece', 'Ton'] },
        },
      },
    },
  },
};


// ═══════════════════════════════════════════════════════════
//  UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Find the preference group that matches a given subcategory string.
 * Returns { groupKey, group } or null.
 */
export function getPreferenceGroupForSubcategory(subcategory) {
  if (!subcategory) return null;
  const sub = subcategory.toLowerCase();
  for (const [groupKey, group] of Object.entries(PRODUCT_PREFERENCES)) {
    if (group.matchSubcategories.some(s => sub.includes(s.toLowerCase()) || s.toLowerCase().includes(sub))) {
      return { groupKey, group };
    }
  }
  return null;
}

/**
 * Flat list of all preference groups for filter/display UI.
 */
export function getPreferenceGroupList() {
  return Object.entries(PRODUCT_PREFERENCES).map(([key, group]) => ({
    key,
    label: group.label,
    emoji: group.emoji,
    productCount: Object.keys(group.products).length,
  }));
}

/**
 * Get all products for a given preference group key.
 */
export function getProductsForGroup(groupKey) {
  const group = PRODUCT_PREFERENCES[groupKey];
  if (!group) return [];
  return Object.entries(group.products).map(([key, product]) => ({
    key,
    label: product.label,
    preferences: product.preferences,
  }));
}

/**
 * Lookup product label from product key across all groups.
 */
export function getProductLabel(productKey) {
  for (const group of Object.values(PRODUCT_PREFERENCES)) {
    if (group.products[productKey]) return group.products[productKey].label;
  }
  return productKey;
}
