const PRODUCT_TITLES = [
  'Dangote Cement 42.5R','Modular Kitchen Cabinet Set','100W Solar Panel System',
  'CCTV 8-Camera Kit','Porcelain Floor Tiles 60x60cm','PVC Pipes & Fittings Bundle',
  'Solid Security Door','LED Lighting Kit','Automatic Gate Motor',
  'Water Storage Tank 2000L','Inverter & Battery Package','Steel Rod (16mm)',
  'Paint & Primer Bundle','Roofing Sheet Bundle','Scaffolding Set',
];

const CATEGORIES = [
  'building_materials','finishing','plumbing_fittings','electrical_fittings',
  'doors_windows','furniture','solar_power','security_systems',
  'kitchen_bathroom','construction_tools','landscaping_outdoor',
];

export const products = Array.from({ length: 20 }, (_, i) => ({
  id:           `mkt_${i + 1}`,
  title:        PRODUCT_TITLES[i % PRODUCT_TITLES.length],
  category:     CATEGORIES[i % CATEGORIES.length],
  subcategory:  'General',
  seller: {
    id:       `seller_${i + 1}`,
    name:     ['BuildRight Supplies','Lagos Hardware','SolarNG','SecurePlus','TileWorld'][i % 5],
    verified: i % 3 !== 0,
  },
  price:        [5000,15000,85000,120000,8000,4500,65000,12000,95000,18000][i % 10],
  pricingUnit:  ['per_bag','per_set','per_unit','per_carton','per_sqm'][i % 5],
  condition:    ['new','new','fairly_used','open_box'][i % 4],
  deliveryOption: ['both','delivery','pickup','both'][i % 4],
  state:        ['Lagos','Lagos','Abuja','Rivers','Ogun'][i % 5],
  stockQty:     10 + i * 5,
  views:        20 + i * 7,
  negotiable:   i % 5 === 0,
  createdAt:    Date.now() - i * 86400_000,
  brand:        ['Dangote','Generic','Ronseal','Samsung','Local'][i % 5],
}));
