import { createContext, useContext, useState, useMemo, useCallback } from 'react';

/* ════════════════════════════════════════════════════════════
   PROPERTY CONTEXT — Central data store for all marketplace items
   
   In production: replace MOCK_* with API fetch calls.
   This context bridges provider listings → public pages.
════════════════════════════════════════════════════════════ */

const PropertyContext = createContext(null);

/* ── MOCK PROPERTIES ──────────────────────────────────────── */
const MOCK_PROPERTIES = [
  { id:'p1',type:'property',category:'rental',title:'3 Bedroom Flat in Lekki Phase 1',description:'Spacious 3-bedroom flat with modern finishes, fitted kitchen, 24/7 power, and secure parking. Located in a serene estate.',price:2500000,pricePeriod:'/yr',location:'Lekki Phase 1, Lagos',state:'Lagos',area:'Lekki',address:'15B Admiralty Way, Lekki Phase 1',lat:6.4474,lng:3.4740,bedrooms:3,bathrooms:2,sqm:120,parking:2,amenities:['24/7 Power','Water Supply','Security','Gym','Pool','CCTV'],images:[],providerId:'prov1',providerName:'Tunde Properties',providerRole:'agent',providerAvatar:null,providerPhone:'+234 801 234 5678',providerRating:4.8,providerReviews:47,providerVerified:true,providerTier:2,verified:true,featured:true,views:1240,inquiries:47,saves:89,postedAt:'2026-01-15T10:00:00Z',status:'active' },
  { id:'p2',type:'property',category:'buy',title:'Luxury 4 Bed Duplex — Banana Island',description:'Exquisite 4-bedroom fully detached duplex. Smart home features, private cinema, rooftop terrace, staff quarters, and waterfront views.',price:420000000,pricePeriod:'',location:'Banana Island, Lagos',state:'Lagos',area:'Ikoyi',address:'Plot 42, Banana Island Road',lat:6.4561,lng:3.4258,bedrooms:4,bathrooms:5,sqm:450,parking:4,amenities:['Smart Home','Cinema','Rooftop','Staff Quarters','CCTV','Elevator','Pool','Generator'],images:[],providerId:'prov2',providerName:'Elite Realtors',providerRole:'agent',providerAvatar:null,providerPhone:'+234 802 345 6789',providerRating:4.9,providerReviews:112,providerVerified:true,providerTier:3,verified:true,featured:true,views:3420,inquiries:89,saves:245,postedAt:'2026-01-20T12:00:00Z',status:'active' },
  { id:'p3',type:'property',category:'land',title:'Land for Sale — 500sqm Ibeju-Lekki',description:'Dry and well-positioned 500sqm land in the fast-developing Ibeju-Lekki corridor. Close to Dangote Refinery and new airport.',price:15000000,pricePeriod:'',location:'Ibeju-Lekki, Lagos',state:'Lagos',area:'Ibeju-Lekki',address:'Plot 42, Lacampaigne Tropicana Road',lat:6.4315,lng:3.7421,bedrooms:null,bathrooms:null,sqm:500,parking:null,amenities:['Dry Land','Fenced','Gated Estate','Road Access','C of O'],images:[],providerId:'prov3',providerName:'Lagos Land Hub',providerRole:'seller',providerAvatar:null,providerPhone:'+234 803 456 7890',providerRating:4.5,providerReviews:34,providerVerified:true,providerTier:2,verified:true,featured:false,views:890,inquiries:23,saves:67,postedAt:'2026-01-25T09:00:00Z',status:'active' },
  { id:'p4',type:'property',category:'rental',title:'Studio Apartment — Yaba',description:'Compact studio ideal for students and young professionals. Fully furnished with AC, stable power, and fast internet.',price:650000,pricePeriod:'/yr',location:'Yaba, Lagos',state:'Lagos',area:'Yaba',address:'8 Herbert Macaulay Way, Yaba',lat:6.5094,lng:3.3755,bedrooms:1,bathrooms:1,sqm:35,parking:0,amenities:['Furnished','AC','WiFi','Power','Water Supply'],images:[],providerId:'prov4',providerName:'Yaba Hostels',providerRole:'host',providerAvatar:null,providerPhone:'+234 804 567 8901',providerRating:4.2,providerReviews:18,providerVerified:true,providerTier:1,verified:true,featured:false,views:445,inquiries:15,saves:32,postedAt:'2026-02-01T08:00:00Z',status:'active' },
  { id:'p5',type:'property',category:'shortlet',title:'Luxury 2 Bed Shortlet — Victoria Island',description:'Beautifully furnished 2-bedroom shortlet. Perfect for business travelers. Netflix, high-speed WiFi, fully equipped kitchen.',price:85000,pricePeriod:'/night',location:'Victoria Island, Lagos',state:'Lagos',area:'Victoria Island',address:'22 Adeola Odeku, VI',lat:6.4281,lng:3.4219,bedrooms:2,bathrooms:2,sqm:90,parking:1,amenities:['Furnished','AC','WiFi','Netflix','Kitchen','Security','Pool','Gym'],images:[],providerId:'prov5',providerName:'VI Shortlets',providerRole:'host',providerAvatar:null,providerPhone:'+234 805 678 9012',providerRating:4.7,providerReviews:63,providerVerified:true,providerTier:2,verified:true,featured:true,views:2100,inquiries:156,saves:178,postedAt:'2026-01-10T15:00:00Z',status:'active' },
  { id:'p6',type:'property',category:'buy',title:'5 Bed Mansion — Asokoro, Abuja',description:'Presidential-style 5-bedroom mansion in Asokoro. Sprawling compound, BQ, tennis court, and manicured gardens.',price:850000000,pricePeriod:'',location:'Asokoro, Abuja',state:'FCT-Abuja',area:'Asokoro',address:'Plot 15, Asokoro Extension',lat:9.0402,lng:7.5250,bedrooms:5,bathrooms:6,sqm:800,parking:6,amenities:['BQ','Tennis Court','Garden','Generator','Borehole','CCTV','Smart Home'],images:[],providerId:'prov6',providerName:'Abuja Luxury Homes',providerRole:'agent',providerAvatar:null,providerPhone:'+234 806 789 0123',providerRating:4.9,providerReviews:28,providerVerified:true,providerTier:3,verified:true,featured:true,views:1650,inquiries:12,saves:98,postedAt:'2026-02-05T11:00:00Z',status:'active' },
  { id:'p7',type:'property',category:'rental',title:'2 Bed Apartment — GRA, Port Harcourt',description:'Modern 2-bedroom apartment in GRA Phase 2. Quiet neighborhood, 24/7 security, ample parking.',price:1800000,pricePeriod:'/yr',location:'GRA, Port Harcourt',state:'Rivers',area:'GRA',address:'45 Ada George Road, GRA Phase 2',lat:4.8156,lng:7.0498,bedrooms:2,bathrooms:2,sqm:85,parking:2,amenities:['24/7 Power','Water','Security','Parking','Balcony'],images:[],providerId:'prov7',providerName:'PH Homes',providerRole:'agent',providerAvatar:null,providerPhone:'+234 807 890 1234',providerRating:4.4,providerReviews:21,providerVerified:true,providerTier:1,verified:true,featured:false,views:320,inquiries:9,saves:24,postedAt:'2026-02-08T13:00:00Z',status:'active' },
  { id:'p8',type:'property',category:'lease',title:'Office Space — 200sqm Victoria Island',description:'Premium open-plan office on Adeola Odeku. Grade A building with elevator, reception, and 24/7 power.',price:8500000,pricePeriod:'/yr',location:'Victoria Island, Lagos',state:'Lagos',area:'Victoria Island',address:'10 Adeola Odeku Street, VI',lat:6.4295,lng:3.4210,bedrooms:null,bathrooms:2,sqm:200,parking:4,amenities:['Elevator','Reception','24/7 Power','AC','Fiber Internet','Conference Room'],images:[],providerId:'prov8',providerName:'VI Commercial',providerRole:'agent',providerAvatar:null,providerPhone:'+234 808 901 2345',providerRating:4.6,providerReviews:15,providerVerified:true,providerTier:2,verified:true,featured:false,views:560,inquiries:18,saves:41,postedAt:'2026-01-28T10:00:00Z',status:'active' },
];

/* ── MOCK SERVICES ────────────────────────────────────────── */
const MOCK_SERVICES = [
  { id:'s1',type:'service',category:'Interior Design',title:'Premium Interior Design',description:'Award-winning interior design from concept to completion. Modern interiors tailored to your lifestyle.',price:150000,pricePeriod:' starting',location:'Lagos',state:'Lagos',area:'Lekki',providerId:'sprov1',providerName:'Décor Masters NG',providerRole:'service',providerAvatar:null,providerPhone:'+234 810 111 2222',providerRating:4.9,providerReviews:86,providerVerified:true,providerTier:3,verified:true,featured:true,responseTime:'< 2 hours',completedJobs:124,views:2340,inquiries:178,saves:210,postedAt:'2025-11-01T10:00:00Z',status:'active' },
  { id:'s2',type:'service',category:'Plumbing',title:'Expert Plumbing Services',description:'Professional plumbing installation, repairs, and maintenance. 1-year warranty on all work.',price:15000,pricePeriod:' starting',location:'Lagos Mainland',state:'Lagos',area:'Surulere',providerId:'sprov2',providerName:'AquaFix Plumbing',providerRole:'service',providerAvatar:null,providerPhone:'+234 810 222 3333',providerRating:4.6,providerReviews:53,providerVerified:true,providerTier:1,verified:true,featured:false,responseTime:'< 1 hour',completedJobs:312,views:890,inquiries:67,saves:45,postedAt:'2025-12-15T08:00:00Z',status:'active' },
  { id:'s3',type:'service',category:'Electrical',title:'Licensed Electrical Contractor',description:'Full electrical services — wiring, solar, generator maintenance, smart home setup. NEMSA certified.',price:20000,pricePeriod:' starting',location:'Abuja',state:'FCT-Abuja',area:'Wuse',providerId:'sprov3',providerName:'PowerFix Abuja',providerRole:'service',providerAvatar:null,providerPhone:'+234 810 333 4444',providerRating:4.8,providerReviews:41,providerVerified:true,providerTier:2,verified:true,featured:false,responseTime:'Same day',completedJobs:256,views:670,inquiries:45,saves:38,postedAt:'2025-12-20T09:00:00Z',status:'active' },
  { id:'s4',type:'service',category:'Cleaning',title:'Deep Cleaning & Fumigation',description:'Professional deep cleaning, post-construction cleanup, and fumigation. Eco-friendly products.',price:25000,pricePeriod:' per session',location:'Lagos & Ogun',state:'Lagos',area:'Ikeja',providerId:'sprov4',providerName:'SparkleClean NG',providerRole:'service',providerAvatar:null,providerPhone:'+234 810 444 5555',providerRating:4.7,providerReviews:92,providerVerified:true,providerTier:2,verified:true,featured:true,responseTime:'< 3 hours',completedJobs:540,views:1560,inquiries:234,saves:156,postedAt:'2025-10-05T11:00:00Z',status:'active' },
  { id:'s5',type:'service',category:'Legal',title:'Real Estate Legal Services',description:'Property law specialists — title verification, contract drafting, C of O, Governor Consent, conveyancing.',price:50000,pricePeriod:' consultation',location:'Lagos',state:'Lagos',area:'Victoria Island',providerId:'sprov5',providerName:'Chambers & Co Legal',providerRole:'service',providerAvatar:null,providerPhone:'+234 810 555 6666',providerRating:4.9,providerReviews:67,providerVerified:true,providerTier:3,verified:true,featured:true,responseTime:'Within 24 hours',completedJobs:189,views:1890,inquiries:156,saves:198,postedAt:'2025-09-20T10:00:00Z',status:'active' },
  { id:'s6',type:'service',category:'Moving',title:'Professional Moving & Relocation',description:'Stress-free moving with insured transport, professional packers. Local and interstate across Nigeria.',price:35000,pricePeriod:' starting',location:'Nationwide',state:'Lagos',area:'Ikeja',providerId:'sprov6',providerName:'QuickMove Nigeria',providerRole:'service',providerAvatar:null,providerPhone:'+234 810 666 7777',providerRating:4.5,providerReviews:38,providerVerified:true,providerTier:1,verified:true,featured:false,responseTime:'< 2 hours',completedJobs:432,views:1120,inquiries:89,saves:67,postedAt:'2025-11-10T14:00:00Z',status:'active' },
];

/* ── MOCK PRODUCTS ────────────────────────────────────────── */
const MOCK_PRODUCTS = [
  { id:'pr1',type:'product',category:'Cement',title:'Dangote 42.5N Cement — 50kg',description:'High-quality Portland cement for all construction projects. Bulk discounts available.',price:5800,pricePeriod:' /bag',location:'Nationwide Delivery',state:'Lagos',area:'Lagos',providerId:'pprov1',providerName:'BuildMart Nigeria',providerRole:'seller',providerAvatar:null,providerPhone:'+234 820 111 2222',providerRating:4.6,providerReviews:145,providerVerified:true,providerTier:2,verified:true,featured:true,inStock:true,minOrder:10,deliveryTime:'2-3 days',views:4500,inquiries:890,saves:320,postedAt:'2025-08-01T10:00:00Z',status:'active' },
  { id:'pr2',type:'product',category:'Roofing',title:'Aluminum Roofing Sheets — 0.55mm',description:'Premium long-span aluminum roofing sheets. Rust-resistant, lightweight. Various colors.',price:3200,pricePeriod:' /m',location:'Lagos & Ogun',state:'Lagos',area:'Alaba',providerId:'pprov2',providerName:'RoofKing Nigeria',providerRole:'seller',providerAvatar:null,providerPhone:'+234 820 222 3333',providerRating:4.4,providerReviews:78,providerVerified:true,providerTier:1,verified:true,featured:false,inStock:true,minOrder:20,deliveryTime:'1-2 days',views:1890,inquiries:234,saves:89,postedAt:'2025-09-15T09:00:00Z',status:'active' },
  { id:'pr3',type:'product',category:'Furniture',title:'Executive Office Desk — Mahogany',description:'Solid mahogany executive desk with drawers, cable management, leather inlay. Assembly included.',price:280000,pricePeriod:'',location:'Lagos',state:'Lagos',area:'Lekki',providerId:'pprov3',providerName:'WoodCraft Furniture',providerRole:'seller',providerAvatar:null,providerPhone:'+234 820 333 4444',providerRating:4.8,providerReviews:52,providerVerified:true,providerTier:2,verified:true,featured:true,inStock:true,minOrder:1,deliveryTime:'5-7 days',views:980,inquiries:45,saves:112,postedAt:'2025-10-20T12:00:00Z',status:'active' },
  { id:'pr4',type:'product',category:'Plumbing',title:'Water Tank — 2000L Polytank',description:'Durable 2000-litre overhead water tank. UV-resistant, food-grade safe. 5-year warranty.',price:85000,pricePeriod:'',location:'Nationwide',state:'Lagos',area:'Lagos',providerId:'pprov1',providerName:'BuildMart Nigeria',providerRole:'seller',providerAvatar:null,providerPhone:'+234 820 111 2222',providerRating:4.6,providerReviews:145,providerVerified:true,providerTier:2,verified:true,featured:false,inStock:true,minOrder:1,deliveryTime:'3-5 days',views:670,inquiries:34,saves:56,postedAt:'2025-11-05T10:00:00Z',status:'active' },
  { id:'pr5',type:'product',category:'Paint',title:'Dulux Weathershield — 20L',description:'Premium exterior emulsion paint with 10-year weather protection. 50+ colors available.',price:32000,pricePeriod:' /bucket',location:'Lagos',state:'Lagos',area:'Ikeja',providerId:'pprov4',providerName:'ColorHouse Paints',providerRole:'seller',providerAvatar:null,providerPhone:'+234 820 444 5555',providerRating:4.7,providerReviews:63,providerVerified:true,providerTier:1,verified:true,featured:false,inStock:true,minOrder:1,deliveryTime:'1-2 days',views:1230,inquiries:178,saves:89,postedAt:'2025-12-01T09:00:00Z',status:'active' },
  { id:'pr6',type:'product',category:'Tiles',title:'Italian Porcelain Floor Tiles — 60x60cm',description:'High-grade imported porcelain tiles. Scratch-resistant, marble/granite/wood finishes.',price:12500,pricePeriod:' /carton',location:'Lagos & Abuja',state:'Lagos',area:'Lekki',providerId:'pprov5',providerName:'TileWorld NG',providerRole:'seller',providerAvatar:null,providerPhone:'+234 820 555 6666',providerRating:4.5,providerReviews:41,providerVerified:true,providerTier:2,verified:true,featured:true,inStock:true,minOrder:5,deliveryTime:'2-4 days',views:1560,inquiries:123,saves:145,postedAt:'2025-11-20T11:00:00Z',status:'active' },
];

/* ── Categories + helpers ─────────────────────────────────── */
export const PROPERTY_CATEGORIES = [
  { id:'all',label:'All',emoji:'🏘️'},{ id:'rental',label:'Rental',emoji:'🏠'},{ id:'buy',label:'Buy',emoji:'🏡'},
  { id:'lease',label:'Lease',emoji:'📋'},{ id:'land',label:'Land',emoji:'🗺️'},{ id:'shortlet',label:'Shortlet',emoji:'🏨'},{ id:'shared',label:'Shared',emoji:'👥'},
];
export const SERVICE_CATEGORIES = [
  { id:'all',label:'All Services'},{ id:'Interior Design',label:'Interior Design'},{ id:'Plumbing',label:'Plumbing'},
  { id:'Electrical',label:'Electrical'},{ id:'Cleaning',label:'Cleaning'},{ id:'Legal',label:'Legal'},{ id:'Moving',label:'Moving'},
];
export const PRODUCT_CATEGORIES = [
  { id:'all',label:'All Products'},{ id:'Cement',label:'Cement'},{ id:'Roofing',label:'Roofing'},
  { id:'Furniture',label:'Furniture'},{ id:'Plumbing',label:'Plumbing'},{ id:'Paint',label:'Paint'},{ id:'Tiles',label:'Tiles'},
];
export const NIGERIAN_STATES = [
  'All States','Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT-Abuja','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara',
];

export function formatPrice(price, period = '') {
  if (!price && price !== 0) return 'Contact for price';
  if (price === 0) return 'Free';
  const f = price >= 1e9 ? '₦'+(price/1e9).toFixed(1)+'B' : price >= 1e6 ? '₦'+(price/1e6).toFixed(1)+'M' : '₦'+price.toLocaleString();
  return f + (period || '');
}

/* ══ PROVIDER ════════════════════════════════════════════════ */
export function PropertyProvider({ children }) {
  const [properties] = useState(MOCK_PROPERTIES);
  const [services]   = useState(MOCK_SERVICES);
  const [products]   = useState(MOCK_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [wishlist, setWishlist] = useState(() => {
    try { const s = sessionStorage.getItem('aurban_wishlist'); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  const getPropertyById = useCallback((id) => properties.find(p => p.id === id), [properties]);
  const getServiceById  = useCallback((id) => services.find(s => s.id === id), [services]);
  const getProductById  = useCallback((id) => products.find(p => p.id === id), [products]);

  const filterProperties = useCallback((f = {}) => {
    let r = [...properties];
    if (f.category && f.category !== 'all') r = r.filter(p => p.category === f.category);
    if (f.state && f.state !== 'All States') r = r.filter(p => p.state === f.state);
    if (f.minPrice) r = r.filter(p => p.price >= f.minPrice);
    if (f.maxPrice) r = r.filter(p => p.price <= f.maxPrice);
    if (f.bedrooms) r = r.filter(p => p.bedrooms && p.bedrooms >= f.bedrooms);
    if (f.search) { const q = f.search.toLowerCase(); r = r.filter(p => p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)); }
    if (f.sort === 'price_asc')  r.sort((a,b) => a.price - b.price);
    if (f.sort === 'price_desc') r.sort((a,b) => b.price - a.price);
    if (f.sort === 'newest')     r.sort((a,b) => new Date(b.postedAt) - new Date(a.postedAt));
    if (f.sort === 'popular')    r.sort((a,b) => b.views - a.views);
    return r;
  }, [properties]);

  const filterServices = useCallback((f = {}) => {
    let r = [...services];
    if (f.category && f.category !== 'all') r = r.filter(s => s.category === f.category);
    if (f.state && f.state !== 'All States') r = r.filter(s => s.state === f.state);
    if (f.search) { const q = f.search.toLowerCase(); r = r.filter(s => s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.providerName.toLowerCase().includes(q)); }
    if (f.sort === 'rating')    r.sort((a,b) => b.providerRating - a.providerRating);
    if (f.sort === 'popular')   r.sort((a,b) => b.views - a.views);
    if (f.sort === 'price_asc') r.sort((a,b) => a.price - b.price);
    return r;
  }, [services]);

  const filterProducts = useCallback((f = {}) => {
    let r = [...products];
    if (f.category && f.category !== 'all') r = r.filter(p => p.category === f.category);
    if (f.search) { const q = f.search.toLowerCase(); r = r.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.providerName.toLowerCase().includes(q)); }
    if (f.sort === 'price_asc')  r.sort((a,b) => a.price - b.price);
    if (f.sort === 'price_desc') r.sort((a,b) => b.price - a.price);
    if (f.sort === 'popular')    r.sort((a,b) => b.views - a.views);
    return r;
  }, [products]);

  const searchAll = useCallback((query) => {
    if (!query?.trim()) return { properties:[], services:[], products:[] };
    const q = query.toLowerCase();
    return {
      properties: properties.filter(p => p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)),
      services: services.filter(s => s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)),
      products: products.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)),
    };
  }, [properties, services, products]);

  const toggleWishlist = useCallback((item) => {
    setWishlist(prev => {
      const exists = prev.find(w => w.id === item.id);
      const next = exists ? prev.filter(w => w.id !== item.id) : [...prev, { ...item, savedAt: new Date().toISOString() }];
      try { sessionStorage.setItem('aurban_wishlist', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const isWishlisted = useCallback((id) => wishlist.some(w => w.id === id), [wishlist]);
  const addListing = useCallback((listing) => { console.log('[PropertyContext] New listing:', listing); }, []);

  const value = useMemo(() => ({
    properties, services, products,
    getPropertyById, getServiceById, getProductById,
    filterProperties, filterServices, filterProducts,
    searchAll, addListing,
    searchQuery, setSearchQuery,
    wishlist, toggleWishlist, isWishlisted,
  }), [properties, services, products, getPropertyById, getServiceById, getProductById, filterProperties, filterServices, filterProducts, searchAll, addListing, searchQuery, wishlist, toggleWishlist, isWishlisted]);

  return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>;
}

export function useProperty() {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error('useProperty must be used inside PropertyProvider');
  return ctx;
}

export default PropertyContext;