import { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import * as propertyService from '../services/property.service.js';
import * as relocationService from '../services/relocation.service.js';

/* ════════════════════════════════════════════════════════════
   PROPERTY CONTEXT — Central data store for all marketplace items

   API-first with mock fallback:
   1. On mount → fetch from API via property.service.js
   2. On success → use API data
   3. On error → fall back to MOCK_* constants for dev
════════════════════════════════════════════════════════════ */

const PropertyContext = createContext(null);

/* ── MOCK PROPERTIES (dev fallback) ─────────────────────── */
const MOCK_PROPERTIES = [
  { id:'p1',type:'property',category:'rental',title:'3 Bedroom Flat in Lekki Phase 1',description:'Spacious 3-bedroom flat with modern finishes, fitted kitchen, 24/7 power, and secure parking. Located in a serene estate.',price:2500000,pricePeriod:'/yr',location:'Lekki Phase 1, Lagos',state:'Lagos',area:'Lekki',address:'15B Admiralty Way, Lekki Phase 1',lat:6.4474,lng:3.4740,bedrooms:3,bathrooms:2,sqm:120,parking:2,amenities:['24/7 Power','Water Supply','Security','Gym','Pool','CCTV'],images:[],providerId:'prov1',providerName:'Tunde Properties',providerRole:'agent',providerAvatar:null,providerPhone:'+234 801 234 5678',providerRating:4.8,providerReviews:47,providerVerified:true,providerTier:2,verified:true,featured:true,views:1240,inquiries:47,saves:89,postedAt:'2026-01-15T10:00:00Z',status:'active' },
  { id:'p2',type:'property',category:'buy',title:'Luxury 4 Bed Duplex — Banana Island',description:'Exquisite 4-bedroom fully detached duplex. Smart home features, private cinema, rooftop terrace, staff quarters, and waterfront views.',price:420000000,pricePeriod:'',location:'Banana Island, Lagos',state:'Lagos',area:'Ikoyi',address:'Plot 42, Banana Island Road',lat:6.4561,lng:3.4258,bedrooms:4,bathrooms:5,sqm:450,parking:4,amenities:['Smart Home','Cinema','Rooftop','Staff Quarters','CCTV','Elevator','Pool','Generator'],images:[],providerId:'prov2',providerName:'Elite Realtors',providerRole:'agent',providerAvatar:null,providerPhone:'+234 802 345 6789',providerRating:4.9,providerReviews:112,providerVerified:true,providerTier:3,verified:true,featured:true,views:3420,inquiries:89,saves:245,postedAt:'2026-01-20T12:00:00Z',status:'active' },
  { id:'p3',type:'property',category:'land',title:'Land for Sale — 500sqm Ibeju-Lekki',description:'Dry and well-positioned 500sqm land in the fast-developing Ibeju-Lekki corridor. Close to Dangote Refinery and new airport.',price:15000000,pricePeriod:'',location:'Ibeju-Lekki, Lagos',state:'Lagos',area:'Ibeju-Lekki',address:'Plot 42, Lacampaigne Tropicana Road',lat:6.4315,lng:3.7421,bedrooms:null,bathrooms:null,sqm:500,parking:null,amenities:['Dry Land','Fenced','Gated Estate','Road Access','C of O'],images:[],providerId:'prov3',providerName:'Lagos Land Hub',providerRole:'seller',providerAvatar:null,providerPhone:'+234 803 456 7890',providerRating:4.5,providerReviews:34,providerVerified:true,providerTier:2,verified:true,featured:false,views:890,inquiries:23,saves:67,postedAt:'2026-01-25T09:00:00Z',status:'active' },
  { id:'p4',type:'property',category:'rental',title:'Studio Apartment — Yaba',description:'Compact studio ideal for students and young professionals. Fully furnished with AC, stable power, and fast internet.',price:650000,pricePeriod:'/yr',location:'Yaba, Lagos',state:'Lagos',area:'Yaba',address:'8 Herbert Macaulay Way, Yaba',lat:6.5094,lng:3.3755,bedrooms:1,bathrooms:1,sqm:35,parking:0,amenities:['Furnished','AC','WiFi','Power','Water Supply'],images:[],providerId:'prov4',providerName:'Yaba Hostels',providerRole:'host',providerAvatar:null,providerPhone:'+234 804 567 8901',providerRating:4.2,providerReviews:18,providerVerified:true,providerTier:1,verified:true,featured:false,views:445,inquiries:15,saves:32,postedAt:'2026-02-01T08:00:00Z',status:'active' },
  { id:'p5',type:'property',category:'shortlet',title:'Luxury 2 Bed Shortlet — Victoria Island',description:'Beautifully furnished 2-bedroom shortlet. Perfect for business travelers. Netflix, high-speed WiFi, fully equipped kitchen. Located in a secure high-rise with ocean views.',price:85000,pricePeriod:'/night',location:'Victoria Island, Lagos',state:'Lagos',area:'Victoria Island',address:'22 Adeola Odeku, VI',lat:6.4281,lng:3.4219,bedrooms:2,bathrooms:2,sqm:90,parking:1,amenities:['Furnished','AC','WiFi','Netflix','Kitchen','Security','Pool','Gym','Washing Machine','Iron','Workspace','Smart TV','Balcony','Ocean View'],images:[],providerId:'prov5',providerName:'VI Shortlets',providerRole:'host',providerAvatar:null,providerPhone:'+234 805 678 9012',providerRating:4.7,providerReviews:63,providerVerified:true,providerTier:2,verified:true,featured:true,views:2100,inquiries:156,saves:178,postedAt:'2026-01-10T15:00:00Z',status:'active',
    accommodationType:'shortlet',pricePerNight:85000,pricePerWeek:510000,cleaningFee:15000,cautionFee:50000,serviceFee:12750,
    availability:{checkIn:'14:00',checkOut:'11:00',minStay:1,maxStay:30,instantBooking:true},
    houseRules:{smoking:false,pets:false,parties:false,quietHours:'22:00 – 07:00',maxGuests:4,children:true,custom:['No shoes indoors','Remove shoes at entrance','Gate closes by 11pm','No cooking of strong-smelling food without ventilation']},
    declarations:{waterSource:'Borehole + overhead tank (24/7)',powerSource:'Prepaid meter + inverter backup (12hr)',security:'Gated estate with 24/7 armed security & CCTV',roadAccess:'Tarred road, accessible year-round',wasteDisposal:'LAWMA-registered, daily pickup'},
    reviews:[
      {id:'rev1',userName:'Chidi A.',userAvatar:null,rating:5,date:'2026-01-15',comment:'Amazing apartment. Very clean, well-furnished, and the host was incredibly responsive. AC worked perfectly. Would definitely stay again.',stayType:'shortlet',stayDuration:'3 nights'},
      {id:'rev2',userName:'Aisha M.',userAvatar:null,rating:4,date:'2025-12-28',comment:'Great location in VI, walking distance to restaurants. Minor issue with hot water on day 2, but host fixed it within hours.',stayType:'shortlet',stayDuration:'5 nights'},
      {id:'rev3',userName:'Emeka O.',userAvatar:null,rating:5,date:'2025-12-10',comment:'Perfect for my business trip. Fast WiFi, quiet neighborhood, clean sheets. The workspace area was a nice touch.',stayType:'shortlet',stayDuration:'7 nights'},
    ],
  },
  { id:'p6',type:'property',category:'buy',title:'5 Bed Mansion — Asokoro, Abuja',description:'Presidential-style 5-bedroom mansion in Asokoro. Sprawling compound, BQ, tennis court, and manicured gardens.',price:850000000,pricePeriod:'',location:'Asokoro, Abuja',state:'FCT-Abuja',area:'Asokoro',address:'Plot 15, Asokoro Extension',lat:9.0402,lng:7.5250,bedrooms:5,bathrooms:6,sqm:800,parking:6,amenities:['BQ','Tennis Court','Garden','Generator','Borehole','CCTV','Smart Home'],images:[],providerId:'prov6',providerName:'Abuja Luxury Homes',providerRole:'agent',providerAvatar:null,providerPhone:'+234 806 789 0123',providerRating:4.9,providerReviews:28,providerVerified:true,providerTier:3,verified:true,featured:true,views:1650,inquiries:12,saves:98,postedAt:'2026-02-05T11:00:00Z',status:'active' },
  { id:'p7',type:'property',category:'rental',title:'2 Bed Apartment — GRA, Port Harcourt',description:'Modern 2-bedroom apartment in GRA Phase 2. Quiet neighborhood, 24/7 security, ample parking.',price:1800000,pricePeriod:'/yr',location:'GRA, Port Harcourt',state:'Rivers',area:'GRA',address:'45 Ada George Road, GRA Phase 2',lat:4.8156,lng:7.0498,bedrooms:2,bathrooms:2,sqm:85,parking:2,amenities:['24/7 Power','Water','Security','Parking','Balcony'],images:[],providerId:'prov7',providerName:'PH Homes',providerRole:'agent',providerAvatar:null,providerPhone:'+234 807 890 1234',providerRating:4.4,providerReviews:21,providerVerified:true,providerTier:1,verified:true,featured:false,views:320,inquiries:9,saves:24,postedAt:'2026-02-08T13:00:00Z',status:'active' },
  { id:'p8',type:'property',category:'lease',title:'Office Space — 200sqm Victoria Island',description:'Premium open-plan office on Adeola Odeku. Grade A building with elevator, reception, and 24/7 power.',price:8500000,pricePeriod:'/yr',location:'Victoria Island, Lagos',state:'Lagos',area:'Victoria Island',address:'10 Adeola Odeku Street, VI',lat:6.4295,lng:3.4210,bedrooms:null,bathrooms:2,sqm:200,parking:4,amenities:['Elevator','Reception','24/7 Power','AC','Fiber Internet','Conference Room'],images:[],providerId:'prov8',providerName:'VI Commercial',providerRole:'agent',providerAvatar:null,providerPhone:'+234 808 901 2345',providerRating:4.6,providerReviews:15,providerVerified:true,providerTier:2,verified:true,featured:false,views:560,inquiries:18,saves:41,postedAt:'2026-01-28T10:00:00Z',status:'active' },

  /* ── Shortlet Properties ─────────────────────────────────── */
  { id:'p9',type:'property',category:'shortlet',title:'Cozy Studio Shortlet — Lekki Phase 1',description:'Modern studio apartment in the heart of Lekki. Fully furnished with smart TV, fast WiFi, and a fully equipped kitchen. Perfect for solo travelers or couples seeking comfort.',price:45000,pricePeriod:'/night',location:'Lekki Phase 1, Lagos',state:'Lagos',area:'Lekki',address:'12A Admiralty Road, Lekki Phase 1',lat:6.4512,lng:3.4758,bedrooms:1,bathrooms:1,sqm:40,parking:1,amenities:['Furnished','AC','WiFi','Smart TV','Kitchen','Security','CCTV','Workspace','Iron','Washing Machine'],images:[],providerId:'prov9',providerName:'LekStay Homes',providerRole:'host',providerAvatar:null,providerPhone:'+234 809 123 4567',providerRating:4.5,providerReviews:42,providerVerified:true,providerTier:1,verified:true,featured:false,views:980,inquiries:78,saves:112,postedAt:'2026-01-22T09:00:00Z',status:'active',
    accommodationType:'shortlet',pricePerNight:45000,pricePerWeek:270000,cleaningFee:10000,cautionFee:30000,serviceFee:6750,
    availability:{checkIn:'15:00',checkOut:'12:00',minStay:1,maxStay:14,instantBooking:true},
    houseRules:{smoking:false,pets:false,parties:false,quietHours:'22:00 – 07:00',maxGuests:2,children:true,custom:['No smoking on premises','Keep common areas clean']},
    declarations:{waterSource:'Estate borehole (24/7)',powerSource:'Prepaid meter + inverter (8hr backup)',security:'Gated estate, security checkpoint',roadAccess:'Paved interlocking road',wasteDisposal:'LAWMA collection twice weekly'},
    reviews:[
      {id:'rev4',userName:'Blessing I.',userAvatar:null,rating:5,date:'2026-01-10',comment:'Loved the place! Super clean and the host was very welcoming. WiFi was fast enough for my remote work.',stayType:'shortlet',stayDuration:'4 nights'},
      {id:'rev5',userName:'Yusuf K.',userAvatar:null,rating:4,date:'2025-12-20',comment:'Good location, clean apartment. The kitchen was well-stocked. Only downside was some noise from the nearby road.',stayType:'shortlet',stayDuration:'2 nights'},
    ],
  },
  { id:'p10',type:'property',category:'shortlet',title:'3 Bed Penthouse Shortlet — Ikoyi',description:'Stunning 3-bedroom penthouse with panoramic views of Lagos Lagoon. Rooftop terrace, private elevator access, designer interiors, and 24/7 concierge service.',price:250000,pricePeriod:'/night',location:'Ikoyi, Lagos',state:'Lagos',area:'Ikoyi',address:'5 Bourdillon Road, Ikoyi',lat:6.4525,lng:3.4302,bedrooms:3,bathrooms:3,sqm:180,parking:2,amenities:['Furnished','AC','WiFi','Netflix','Kitchen','Pool','Gym','Elevator','Rooftop Terrace','Concierge','Smart Home','Wine Cellar','Jacuzzi','Ocean View'],images:[],providerId:'prov10',providerName:'Lagos Luxury Stays',providerRole:'host',providerAvatar:null,providerPhone:'+234 810 234 5678',providerRating:4.9,providerReviews:31,providerVerified:true,providerTier:3,verified:true,featured:true,views:4200,inquiries:89,saves:320,postedAt:'2025-12-15T10:00:00Z',status:'active',
    accommodationType:'shortlet',pricePerNight:250000,pricePerWeek:1500000,cleaningFee:25000,cautionFee:150000,serviceFee:37500,
    availability:{checkIn:'14:00',checkOut:'11:00',minStay:2,maxStay:30,instantBooking:false},
    houseRules:{smoking:false,pets:false,parties:false,quietHours:'23:00 – 08:00',maxGuests:6,children:true,custom:['No outdoor shoes inside','Rooftop access until 10pm only','No events without prior approval']},
    declarations:{waterSource:'Central borehole + treatment plant (24/7)',powerSource:'Estate power plant + dedicated 40KVA generator',security:'Armed security, biometric access, CCTV surveillance',roadAccess:'Premium paved road with street lighting',wasteDisposal:'Private waste management service, daily'},
    reviews:[
      {id:'rev6',userName:'Dr. Ngozi E.',userAvatar:null,rating:5,date:'2026-01-05',comment:'Absolutely breathtaking views! The apartment is even more stunning in person. The concierge went above and beyond.',stayType:'shortlet',stayDuration:'5 nights'},
      {id:'rev7',userName:'James O.',userAvatar:null,rating:5,date:'2025-11-20',comment:'World-class accommodation. Had international guests and they were blown away. Worth every naira.',stayType:'shortlet',stayDuration:'3 nights'},
    ],
  },

  /* ── Shared Accommodation ────────────────────────────────── */
  { id:'p11',type:'property',category:'shared',title:'Shared 3-Bed Flat — Room Available in Yaba',description:'Cozy room available in a shared 3-bedroom flat in Yaba. Ideal for young professionals and tech workers. Common areas include a modern kitchen, living room with Netflix, and a balcony. Join a vibrant community of like-minded flatmates.',price:120000,pricePeriod:'/mo',location:'Yaba, Lagos',state:'Lagos',area:'Yaba',address:'24 Queens Street, Yaba',lat:6.5124,lng:3.3789,bedrooms:3,bathrooms:2,sqm:100,parking:0,amenities:['WiFi','AC','Kitchen','Netflix','Washing Machine','Water Supply','Security','Balcony'],images:[],providerId:'prov11',providerName:'YabaHub Co-Living',providerRole:'host',providerAvatar:null,providerPhone:'+234 811 345 6789',providerRating:4.4,providerReviews:28,providerVerified:true,providerTier:1,verified:true,featured:true,views:1560,inquiries:67,saves:145,postedAt:'2026-01-18T11:00:00Z',status:'active',
    accommodationType:'shared',pricePerMonth:120000,securityDeposit:120000,serviceCharge:15000,
    availability:{minStay:3,moveInDate:'2026-03-01',instantBooking:false},
    rooms:[
      {id:'r1',name:'Room A — Master Ensuite',price:180000,pricePeriod:'/mo',available:false,occupant:'Tunde',features:['En-suite Bathroom','AC','Built-in Wardrobe','Workspace Desk'],sqm:18},
      {id:'r2',name:'Room B — Standard',price:120000,pricePeriod:'/mo',available:true,occupant:null,features:['AC','Wardrobe','Window View'],sqm:14},
      {id:'r3',name:'Room C — Cozy Single',price:95000,pricePeriod:'/mo',available:true,occupant:null,features:['AC','Wardrobe','Street View'],sqm:12},
    ],
    housemates:[
      {name:'Tunde O.',age:28,gender:'Male',occupation:'Software Engineer',moveInDate:'2025-06-01',bio:'Quiet, works from home, enjoys cooking. Tech bro by day, chef by night.'},
    ],
    communityGuidelines:['Shared cleaning rota (weekly)','Quiet hours 10pm–7am on weekdays','Guests must leave by 11pm unless arranged','No smoking inside the apartment','Shared Netflix account — no password changes'],
    utilityInfo:{included:['Water','Security','Waste Disposal'],split:['Electricity (prepaid meter)','Internet (₦5,000/person)'],splitMethod:'Equal split among all tenants'},
    houseRules:{smoking:false,pets:false,parties:false,quietHours:'22:00 – 07:00',maxGuests:2,children:false,custom:['No overnight guests without notice','Clean up after yourself in kitchen','Respect others\' food in the fridge']},
    declarations:{waterSource:'Estate borehole (24/7)',powerSource:'Prepaid meter + small generator backup',security:'Gated compound with security guard',roadAccess:'Paved road',wasteDisposal:'LAWMA twice weekly'},
    reviews:[
      {id:'rev8',userName:'Funke A.',userAvatar:null,rating:5,date:'2025-12-01',comment:'Great co-living space! Tunde is an awesome flatmate and the location is perfect for Yaba tech workers.',stayType:'shared',stayDuration:'6 months'},
      {id:'rev9',userName:'Samuel E.',userAvatar:null,rating:4,date:'2025-09-15',comment:'Clean, well-managed, and the host responds quickly. Only wish the generator was bigger for longer outages.',stayType:'shared',stayDuration:'4 months'},
    ],
  },
  { id:'p12',type:'property',category:'shared',title:'Female-Only Co-Living — Lekki Phase 1',description:'Safe, premium co-living space exclusively for young professional women. Private rooms in a beautifully furnished 4-bedroom apartment with 24/7 security, pool access, and a supportive community of ambitious women.',price:180000,pricePeriod:'/mo',location:'Lekki Phase 1, Lagos',state:'Lagos',area:'Lekki',address:'Block 5, Flat 3, Freedom Way, Lekki',lat:6.4468,lng:3.4752,bedrooms:4,bathrooms:3,sqm:140,parking:1,amenities:['WiFi','AC','Kitchen','Pool','Gym','CCTV','Washing Machine','Dryer','Water Supply','24/7 Power'],images:[],providerId:'prov12',providerName:'SheSpace Lagos',providerRole:'host',providerAvatar:null,providerPhone:'+234 812 456 7890',providerRating:4.8,providerReviews:45,providerVerified:true,providerTier:2,verified:true,featured:true,views:2340,inquiries:89,saves:210,postedAt:'2026-01-05T10:00:00Z',status:'active',
    accommodationType:'shared',pricePerMonth:180000,securityDeposit:180000,serviceCharge:25000,
    availability:{minStay:6,moveInDate:'2026-04-01',instantBooking:false},
    rooms:[
      {id:'r4',name:'Room 1 — Master Suite',price:250000,pricePeriod:'/mo',available:false,occupant:'Amaka',features:['En-suite','AC','Walk-in Closet','Vanity Area','Balcony Access'],sqm:22},
      {id:'r5',name:'Room 2 — Premium',price:200000,pricePeriod:'/mo',available:false,occupant:'Fatima',features:['En-suite','AC','Built-in Wardrobe','Workspace'],sqm:18},
      {id:'r6',name:'Room 3 — Standard',price:180000,pricePeriod:'/mo',available:true,occupant:null,features:['Shared Bathroom','AC','Wardrobe','Good Lighting'],sqm:15},
      {id:'r7',name:'Room 4 — Cozy',price:150000,pricePeriod:'/mo',available:true,occupant:null,features:['Shared Bathroom','AC','Wardrobe'],sqm:13},
    ],
    housemates:[
      {name:'Amaka N.',age:26,gender:'Female',occupation:'Product Designer',moveInDate:'2025-03-01',bio:'Creative professional, loves yoga and cooking. Early riser and very tidy.'},
      {name:'Fatima B.',age:29,gender:'Female',occupation:'Investment Banker',moveInDate:'2025-05-01',bio:'Busy professional, mostly out during weekdays. Loves movies on weekends.'},
    ],
    communityGuidelines:['Female residents only — no male overnight guests','Professional cleaning every Saturday','Shared groceries pool (optional)','Monthly house meeting','Support each other\'s growth and privacy'],
    utilityInfo:{included:['Water','Power (24/7)','Security','Cleaning Service','Pool & Gym'],split:['Internet (₦7,500/person)'],splitMethod:'Internet split equally; all other utilities included'},
    houseRules:{smoking:false,pets:false,parties:false,quietHours:'22:00 – 07:00',maxGuests:1,children:false,custom:['Female-only household','No male overnight guests','Respect shared spaces','Report maintenance issues within 24hrs']},
    declarations:{waterSource:'Borehole + overhead tank (24/7)',powerSource:'Estate power (24/7) + 60KVA generator backup',security:'Gated estate, CCTV, female security detail at night',roadAccess:'Interlocking road, well-lit',wasteDisposal:'LAWMA daily pickup'},
    reviews:[
      {id:'rev10',userName:'Chidinma K.',userAvatar:null,rating:5,date:'2026-01-08',comment:'Best decision I made this year. The community is incredible and I feel completely safe. The host is very attentive.',stayType:'shared',stayDuration:'8 months'},
      {id:'rev11',userName:'Grace O.',userAvatar:null,rating:5,date:'2025-10-22',comment:'Premium co-living at its finest. Pool, gym, 24/7 power — it\'s like living in a hotel. And the girls are amazing!',stayType:'shared',stayDuration:'5 months'},
    ],
  },

  /* ── Stay (Long-term Furnished) ──────────────────────────── */
  { id:'p13',type:'property',category:'stay',title:'Furnished 2 Bed Stay — Oniru, VI Extension',description:'Fully furnished 2-bedroom apartment for medium-to-long-term stays. Move-in ready with everything you need: furniture, appliances, kitchenware, linens. Ideal for expatriates, remote workers, and relocating professionals. Minimum 3-month stay.',price:450000,pricePeriod:'/mo',location:'Oniru, Lagos',state:'Lagos',area:'Victoria Island',address:'8 Palace Road, Oniru Estate',lat:6.4322,lng:3.4345,bedrooms:2,bathrooms:2,sqm:95,parking:1,amenities:['Fully Furnished','AC','WiFi','Smart TV','Kitchen','Washing Machine','Dryer','Microwave','Workspace','Security','CCTV','Pool','Gym','Balcony','Backup Power'],images:[],providerId:'prov13',providerName:'StayLagos',providerRole:'host',providerAvatar:null,providerPhone:'+234 813 567 8901',providerRating:4.6,providerReviews:37,providerVerified:true,providerTier:2,verified:true,featured:true,views:1890,inquiries:56,saves:167,postedAt:'2026-01-12T10:00:00Z',status:'active',
    accommodationType:'stay',pricePerMonth:450000,securityDeposit:450000,cautionFee:200000,serviceCharge:35000,legalFee:0,
    availability:{minStay:3,maxStay:24,moveInDate:'2026-03-01',instantBooking:false,inspectionRequired:true},
    houseRules:{smoking:false,pets:true,parties:false,quietHours:'22:00 – 07:00',maxGuests:4,children:true,custom:['Small pets allowed with refundable pet deposit','No structural modifications','Report all maintenance issues promptly']},
    declarations:{waterSource:'Borehole + 2x overhead tanks (24/7)',powerSource:'Prepaid meter + 20KVA generator (auto-changeover)',security:'Gated estate, 24/7 security, CCTV',roadAccess:'Interlocking paved road, flood-free',wasteDisposal:'LAWMA daily collection'},
    leaseTerms:{minMonths:3,maxMonths:24,renewalNotice:'60 days before expiry',rentIncrease:'Subject to 10% annual review',breakClause:'2 months notice after initial 3 months'},
    reviews:[
      {id:'rev12',userName:'David W.',userAvatar:null,rating:5,date:'2025-11-30',comment:'Relocated from London for work and this was perfect. Move-in ready, everything works. The host handles maintenance quickly.',stayType:'stay',stayDuration:'6 months'},
      {id:'rev13',userName:'Amara C.',userAvatar:null,rating:4,date:'2025-08-15',comment:'Great apartment for long-term. Well-furnished and the location is ideal. Wish the gym was a bit bigger.',stayType:'stay',stayDuration:'4 months'},
    ],
    inspectionFee:0,inspectionAvailable:true,
  },
  { id:'p14',type:'property',category:'stay',title:'Executive 3 Bed Stay — Maitama, Abuja',description:'Premium executive apartment in Maitama. Fully furnished with imported fittings, Italian marble floors, and a dedicated study. Serviced with daily cleaning and 24/7 power. Perfect for diplomats and senior executives on medium-term postings.',price:1200000,pricePeriod:'/mo',location:'Maitama, Abuja',state:'FCT-Abuja',area:'Maitama',address:'Plot 22, Aguiyi Ironsi Street, Maitama',lat:9.0826,lng:7.4924,bedrooms:3,bathrooms:3,sqm:200,parking:2,amenities:['Fully Furnished','AC','WiFi','Smart Home','Kitchen','Washing Machine','Dryer','Dishwasher','Study','BQ','Generator','CCTV','Pool','Tennis Court','Concierge','Daily Cleaning'],images:[],providerId:'prov14',providerName:'Abuja Executive Stays',providerRole:'host',providerAvatar:null,providerPhone:'+234 814 678 9012',providerRating:4.9,providerReviews:19,providerVerified:true,providerTier:3,verified:true,featured:true,views:1450,inquiries:23,saves:89,postedAt:'2025-12-20T09:00:00Z',status:'active',
    accommodationType:'stay',pricePerMonth:1200000,securityDeposit:1200000,cautionFee:500000,serviceCharge:100000,legalFee:50000,
    availability:{minStay:6,maxStay:36,moveInDate:'2026-04-01',instantBooking:false,inspectionRequired:true},
    houseRules:{smoking:false,pets:false,parties:false,quietHours:'22:00 – 07:00',maxGuests:6,children:true,custom:['Diplomatic community — maintain decorum','BQ is for staff only','Pool hours 7am–9pm']},
    declarations:{waterSource:'Estate central water + borehole backup',powerSource:'Estate power grid + 100KVA generator (24/7)',security:'Armed security, boom gate, visitor screening, CCTV',roadAccess:'Premium tarmac road, street-lit',wasteDisposal:'Private estate collection daily'},
    leaseTerms:{minMonths:6,maxMonths:36,renewalNotice:'90 days before expiry',rentIncrease:'Subject to annual review, capped at 15%',breakClause:'3 months notice after initial 6 months'},
    reviews:[
      {id:'rev14',userName:'Ambassador K.',userAvatar:null,rating:5,date:'2025-12-10',comment:'Outstanding property. The daily cleaning and concierge service make it feel like a 5-star hotel. Highly recommended for diplomatic postings.',stayType:'stay',stayDuration:'12 months'},
    ],
    inspectionFee:5000,inspectionAvailable:true,
  },

  /* ── Additional Shortlet ─────────────────────────────────── */
  { id:'p15',type:'property',category:'shortlet',title:'Beachfront 1 Bed — Oniru Private Beach',description:'Wake up to the sound of waves in this stunning beachfront apartment. Direct beach access, sunset views from your private balcony, and walking distance to Lagos nightlife.',price:120000,pricePeriod:'/night',location:'Oniru, Lagos',state:'Lagos',area:'Victoria Island',address:'1 Beach Road, Oniru',lat:6.4255,lng:3.4420,bedrooms:1,bathrooms:1,sqm:55,parking:1,amenities:['Furnished','AC','WiFi','Netflix','Kitchen','Beach Access','Balcony','Sunset View','Pool','Security','BBQ Area'],images:[],providerId:'prov15',providerName:'Beach Stays Lagos',providerRole:'host',providerAvatar:null,providerPhone:'+234 815 789 0123',providerRating:4.8,providerReviews:56,providerVerified:true,providerTier:2,verified:true,featured:true,views:3100,inquiries:134,saves:278,postedAt:'2026-01-20T12:00:00Z',status:'active',
    accommodationType:'shortlet',pricePerNight:120000,pricePerWeek:720000,cleaningFee:15000,cautionFee:80000,serviceFee:18000,
    availability:{checkIn:'15:00',checkOut:'11:00',minStay:2,maxStay:14,instantBooking:true},
    houseRules:{smoking:false,pets:false,parties:false,quietHours:'23:00 – 08:00',maxGuests:3,children:true,custom:['No sand inside the apartment','Rinse off at outdoor shower before entering','Beach chairs must be returned by sunset']},
    declarations:{waterSource:'Borehole (24/7)',powerSource:'Prepaid meter + inverter (10hr backup)',security:'Beach estate security, CCTV',roadAccess:'Paved estate road',wasteDisposal:'Private collection daily'},
    reviews:[
      {id:'rev15',userName:'Kemi F.',userAvatar:null,rating:5,date:'2026-01-12',comment:'Paradise in Lagos! Fell asleep to the sound of waves. The sunset from the balcony was magical. Already booked my next stay.',stayType:'shortlet',stayDuration:'3 nights'},
      {id:'rev16',userName:'Ahmed B.',userAvatar:null,rating:4,date:'2025-12-31',comment:'Great New Year getaway. Beautiful property, amazing beach access. WiFi could be stronger but everything else was perfect.',stayType:'shortlet',stayDuration:'4 nights'},
    ],
  },
];

/* ── MOCK SERVICES (dev fallback) ───────────────────────── */
const MOCK_SERVICES = [
  { id:'s1',type:'service',category:'Interior Design',title:'Premium Interior Design',description:'Award-winning interior design from concept to completion. Modern interiors tailored to your lifestyle.',price:150000,pricePeriod:' starting',location:'Lagos',state:'Lagos',area:'Lekki',providerId:'sprov1',providerName:'Décor Masters NG',providerRole:'service',providerAvatar:null,providerPhone:'+234 810 111 2222',providerRating:4.9,providerReviews:86,providerVerified:true,providerTier:3,verified:true,featured:true,responseTime:'< 2 hours',completedJobs:124,views:2340,inquiries:178,saves:210,postedAt:'2025-11-01T10:00:00Z',status:'active' },
  { id:'s2',type:'service',category:'Plumbing',title:'Expert Plumbing Services',description:'Professional plumbing installation, repairs, and maintenance. 1-year warranty on all work.',price:15000,pricePeriod:' starting',location:'Lagos Mainland',state:'Lagos',area:'Surulere',providerId:'sprov2',providerName:'AquaFix Plumbing',providerRole:'service',providerAvatar:null,providerPhone:'+234 810 222 3333',providerRating:4.6,providerReviews:53,providerVerified:true,providerTier:1,verified:true,featured:false,responseTime:'< 1 hour',completedJobs:312,views:890,inquiries:67,saves:45,postedAt:'2025-12-15T08:00:00Z',status:'active' },
  { id:'s3',type:'service',category:'Electrical',title:'Licensed Electrical Contractor',description:'Full electrical services — wiring, solar, generator maintenance, smart home setup. NEMSA certified.',price:20000,pricePeriod:' starting',location:'Abuja',state:'FCT-Abuja',area:'Wuse',providerId:'sprov3',providerName:'PowerFix Abuja',providerRole:'service',providerAvatar:null,providerPhone:'+234 810 333 4444',providerRating:4.8,providerReviews:41,providerVerified:true,providerTier:2,verified:true,featured:false,responseTime:'Same day',completedJobs:256,views:670,inquiries:45,saves:38,postedAt:'2025-12-20T09:00:00Z',status:'active' },
  { id:'s4',type:'service',category:'Cleaning',title:'Deep Cleaning & Fumigation',description:'Professional deep cleaning, post-construction cleanup, and fumigation. Eco-friendly products.',price:25000,pricePeriod:' per session',location:'Lagos & Ogun',state:'Lagos',area:'Ikeja',providerId:'sprov4',providerName:'SparkleClean NG',providerRole:'service',providerAvatar:null,providerPhone:'+234 810 444 5555',providerRating:4.7,providerReviews:92,providerVerified:true,providerTier:2,verified:true,featured:true,responseTime:'< 3 hours',completedJobs:540,views:1560,inquiries:234,saves:156,postedAt:'2025-10-05T11:00:00Z',status:'active' },
  { id:'s5',type:'service',category:'Legal',title:'Real Estate Legal Services',description:'Property law specialists — title verification, contract drafting, C of O, Governor Consent, conveyancing.',price:50000,pricePeriod:' consultation',location:'Lagos',state:'Lagos',area:'Victoria Island',providerId:'sprov5',providerName:'Chambers & Co Legal',providerRole:'service',providerAvatar:null,providerPhone:'+234 810 555 6666',providerRating:4.9,providerReviews:67,providerVerified:true,providerTier:3,verified:true,featured:true,responseTime:'Within 24 hours',completedJobs:189,views:1890,inquiries:156,saves:198,postedAt:'2025-09-20T10:00:00Z',status:'active' },
  { id:'s6',type:'service',category:'Moving',title:'Professional Moving & Relocation',description:'Stress-free moving with insured transport, professional packers. Local and interstate across Nigeria.',price:35000,pricePeriod:' starting',location:'Nationwide',state:'Lagos',area:'Ikeja',providerId:'sprov6',providerName:'QuickMove Nigeria',providerRole:'service',providerAvatar:null,providerPhone:'+234 810 666 7777',providerRating:4.5,providerReviews:38,providerVerified:true,providerTier:1,verified:true,featured:false,responseTime:'< 2 hours',completedJobs:432,views:1120,inquiries:89,saves:67,postedAt:'2025-11-10T14:00:00Z',status:'active' },
];

/* ── MOCK PRODUCTS (dev fallback) ───────────────────────── */
const MOCK_PRODUCTS = [
  /* Building Materials */
  { id:'pr1',type:'product',category:'building_materials',subcategory:'Cement & Concrete',title:'Dangote 42.5N Cement — 50kg',description:'High-quality Portland cement for all construction projects. Suitable for general construction, plastering, and block laying. Bulk discounts available for large orders.',price:5800,pricingUnit:'per_bag',pricePeriod:' /bag',condition:'new',location:'Nationwide Delivery',state:'Lagos',area:'Lagos',address:'12 Alaba International Market',deliveryOption:'both',deliveryFee:5000,deliveryTime:'2-3 days',deliveryAreas:['Lagos','Ogun','Oyo','FCT-Abuja'],stockQuantity:500,minOrder:10,maxOrder:1000,bulkPricing:[{minQty:50,discount:3},{minQty:200,discount:7}],negotiable:true,warranty:'',refundPolicy:'non_refundable',refundWindow:0,categoryFields:{brand:'Dangote',materialCategory:'Cement',unitOfSale:'Per bag',grade:'42.5N',weight:'50kg',certification:'SON Certified',countryOfOrigin:'Nigeria'},images:[],providerId:'pprov1',providerName:'BuildMart Nigeria',providerRole:'seller',providerAvatar:null,providerPhone:'+234 820 111 2222',providerRating:4.6,providerReviews:145,providerVerified:true,providerTier:2,verified:true,featured:true,inStock:true,orderCount:312,views:4500,inquiries:890,saves:320,postedAt:'2025-08-01T10:00:00Z',status:'active',
    seller:{name:'BuildMart Nigeria',verified:true},reviews:[{id:'rp1',userName:'Engr. Okon M.',rating:5,date:'2026-01-15',comment:'Consistent quality. Delivered 200 bags on time for my project. Will order again.'},{id:'rp2',userName:'Adamu K.',rating:4,date:'2025-12-20',comment:'Good cement, fair price. Delivery took an extra day though.'}] },
  { id:'pr2',type:'product',category:'building_materials',subcategory:'Roofing Materials',title:'Aluminum Roofing Sheets — 0.55mm Long Span',description:'Premium long-span aluminum roofing sheets. Rust-resistant, lightweight, and durable. Available in various colors including Burgundy, Blue, Green, and Silver.',price:3200,pricingUnit:'per_metre',pricePeriod:' /m',condition:'new',location:'Lagos & Ogun',state:'Lagos',area:'Alaba',address:'Block B, Alaba International',deliveryOption:'both',deliveryFee:8000,deliveryTime:'1-2 days',deliveryAreas:['Lagos','Ogun'],stockQuantity:2000,minOrder:20,maxOrder:null,bulkPricing:[{minQty:100,discount:5}],negotiable:true,warranty:'15 years manufacturer',refundPolicy:'non_refundable',refundWindow:0,categoryFields:{brand:'Other',materialCategory:'Roofing',unitOfSale:'Per piece',weight:'4kg per sheet',color:'Burgundy, Blue, Green, Silver',certification:'SON Certified',countryOfOrigin:'Nigeria'},images:[],providerId:'pprov2',providerName:'RoofKing Nigeria',providerRole:'seller',providerAvatar:null,providerPhone:'+234 820 222 3333',providerRating:4.4,providerReviews:78,providerVerified:true,providerTier:1,verified:true,featured:false,inStock:true,orderCount:156,views:1890,inquiries:234,saves:89,postedAt:'2025-09-15T09:00:00Z',status:'active',
    seller:{name:'RoofKing Nigeria',verified:true},reviews:[{id:'rp3',userName:'Chief Eze',rating:4,date:'2025-11-10',comment:'Good quality sheets. Used for my 5-bedroom duplex project.'}] },
  /* Furniture */
  { id:'pr3',type:'product',category:'furniture_fittings',subcategory:'Office Furniture',title:'Executive Office Desk — Mahogany',description:'Solid mahogany executive desk with integrated drawers, cable management system, and leather inlay top. Free assembly included within Lagos.',price:280000,pricingUnit:'per_unit',pricePeriod:'',condition:'new',location:'Lagos',state:'Lagos',area:'Lekki',address:'45 Admiralty Way, Lekki',deliveryOption:'delivery',deliveryFee:10000,deliveryTime:'5-7 days',deliveryAreas:['Lagos','Ogun','Oyo'],stockQuantity:8,minOrder:1,maxOrder:null,bulkPricing:[],negotiable:true,warranty:'1 year frame warranty',refundPolicy:'conditional',refundWindow:48,categoryFields:{material:['Wood'],dimensions:'180cm × 90cm × 75cm',colorOptions:'Mahogany, Walnut, Oak',customizable:true,customLeadTime:'2-4 weeks',assemblyRequired:true,assemblyIncluded:true,weight:85},images:[],providerId:'pprov3',providerName:'WoodCraft Furniture',providerRole:'seller',providerAvatar:null,providerPhone:'+234 820 333 4444',providerRating:4.8,providerReviews:52,providerVerified:true,providerTier:2,verified:true,featured:true,inStock:true,orderCount:45,views:980,inquiries:45,saves:112,postedAt:'2025-10-20T12:00:00Z',status:'active',
    seller:{name:'WoodCraft Furniture',verified:true},reviews:[{id:'rp4',userName:'Barr. Amaka O.',rating:5,date:'2025-12-05',comment:'Stunning desk. Arrived well-packaged and assembled perfectly. Worth every naira.'}] },
  { id:'pr7',type:'product',category:'furniture_fittings',subcategory:'Living Room Furniture',title:'7-Seater L-Shaped Sofa — Premium Fabric',description:'Modern L-shaped sectional sofa with high-density foam, sturdy hardwood frame, and premium fabric upholstery. Available in multiple colors.',price:450000,pricingUnit:'per_set',pricePeriod:'',condition:'new',location:'Lagos',state:'Lagos',area:'Lekki',address:'45 Admiralty Way, Lekki',deliveryOption:'delivery',deliveryFee:15000,deliveryTime:'1-2 weeks',deliveryAreas:['Lagos','Ogun','Oyo','FCT-Abuja'],stockQuantity:5,minOrder:1,maxOrder:null,bulkPricing:[],negotiable:true,warranty:'2 year frame, 1 year fabric',refundPolicy:'conditional',refundWindow:48,categoryFields:{material:['Fabric','Wood'],dimensions:'320cm × 200cm × 85cm',colorOptions:'Grey, Brown, Cream, Navy Blue',customizable:true,customLeadTime:'2-4 weeks',assemblyRequired:false,assemblyIncluded:false,weight:120},images:[],providerId:'pprov3',providerName:'WoodCraft Furniture',providerRole:'seller',providerAvatar:null,providerPhone:'+234 820 333 4444',providerRating:4.8,providerReviews:52,providerVerified:true,providerTier:2,verified:true,featured:true,inStock:true,orderCount:28,views:2340,inquiries:156,saves:210,postedAt:'2026-01-05T12:00:00Z',status:'active',
    seller:{name:'WoodCraft Furniture',verified:true},reviews:[{id:'rp5',userName:'Mrs. Folake D.',rating:5,date:'2026-01-20',comment:'Absolutely beautiful! Fits perfectly in our living room. Delivery was smooth.'}] },
  /* Plumbing */
  { id:'pr4',type:'product',category:'plumbing_sanitary',subcategory:'Water Tanks & Pumps',title:'Polytank Water Tank — 2000 Litres',description:'Durable 2000-litre overhead water tank. UV-resistant, food-grade polyethylene, BPA-free. Includes fittings and 5-year warranty.',price:85000,pricingUnit:'per_unit',pricePeriod:'',condition:'new',location:'Nationwide',state:'Lagos',area:'Lagos',address:'12 Alaba International Market',deliveryOption:'both',deliveryFee:3000,deliveryTime:'3-5 days',deliveryAreas:['Lagos','Ogun','Oyo','FCT-Abuja','Rivers','Kaduna'],stockQuantity:25,minOrder:1,maxOrder:20,bulkPricing:[{minQty:5,discount:3}],negotiable:false,warranty:'5-year manufacturer warranty',refundPolicy:'non_refundable',refundWindow:0,categoryFields:{brand:'Generic',typeModel:'Overhead / Dome Top',material:'PVC',color:'Black, Green',whatsIncluded:'Tank, lid, inlet/outlet fittings, overflow pipe',installRequired:'No (DIY-friendly)',specifications:'2000L capacity, UV-resistant'},images:[],providerId:'pprov1',providerName:'BuildMart Nigeria',providerRole:'seller',providerAvatar:null,providerPhone:'+234 820 111 2222',providerRating:4.6,providerReviews:145,providerVerified:true,providerTier:2,verified:true,featured:false,inStock:true,orderCount:67,views:670,inquiries:34,saves:56,postedAt:'2025-11-05T10:00:00Z',status:'active',
    seller:{name:'BuildMart Nigeria',verified:true},reviews:[{id:'rp6',userName:'Alhaji Ibrahim',rating:4,date:'2025-12-15',comment:'Good tank, sturdy. Fittings are decent quality.'}] },
  /* Interior Décor */
  { id:'pr5',type:'product',category:'interior_decor',subcategory:'Wallpaper & Wall Art',title:'Dulux Weathershield Premium Paint — 20L',description:'Premium exterior emulsion paint with 10-year weather protection formula. Self-priming, anti-mold, and washable. Over 50 colors available.',price:32000,pricingUnit:'per_unit',pricePeriod:' /bucket',condition:'new',location:'Lagos',state:'Lagos',area:'Ikeja',address:'22 Allen Avenue, Ikeja',deliveryOption:'delivery',deliveryFee:2000,deliveryTime:'1-2 days',deliveryAreas:['Lagos','Ogun'],stockQuantity:100,minOrder:1,maxOrder:null,bulkPricing:[{minQty:10,discount:5}],negotiable:false,warranty:'10 year weather protection',refundPolicy:'conditional',refundWindow:48,categoryFields:{material:'Emulsion (water-based)',dimensions:'20 litres per bucket',colorPattern:'50+ colors — Brilliant White, Magnolia, Custom tinting available',careInstructions:'Apply with roller or brush. 2 coats recommended. Dries in 4 hours.'},images:[],providerId:'pprov4',providerName:'ColorHouse Paints',providerRole:'seller',providerAvatar:null,providerPhone:'+234 820 444 5555',providerRating:4.7,providerReviews:63,providerVerified:true,providerTier:1,verified:true,featured:false,inStock:true,orderCount:234,views:1230,inquiries:178,saves:89,postedAt:'2025-12-01T09:00:00Z',status:'active',
    seller:{name:'ColorHouse Paints',verified:true},reviews:[{id:'rp7',userName:'Tunde A.',rating:5,date:'2026-01-08',comment:'Best paint I have used. Coverage is excellent, one coat was almost enough.'}] },
  { id:'pr6',type:'product',category:'building_materials',subcategory:'Tiles & Flooring',title:'Italian Porcelain Floor Tiles — 60×60cm',description:'High-grade imported porcelain tiles. Scratch-resistant with marble, granite, and wood finish options. Suitable for living rooms, offices, and commercial spaces.',price:12500,pricingUnit:'per_carton',pricePeriod:' /carton',condition:'new',location:'Lagos & Abuja',state:'Lagos',area:'Lekki',address:'Plot 5, Chevron Drive, Lekki',deliveryOption:'both',deliveryFee:5000,deliveryTime:'2-4 days',deliveryAreas:['Lagos','FCT-Abuja','Ogun'],stockQuantity:200,minOrder:5,maxOrder:null,bulkPricing:[{minQty:50,discount:5},{minQty:100,discount:8}],negotiable:true,warranty:'',refundPolicy:'conditional',refundWindow:48,categoryFields:{brand:'Other',materialCategory:'Tiles',unitOfSale:'Per carton',weight:'25kg per carton (4 pcs)',dimensions:'60cm × 60cm × 10mm',color:'Marble White, Grey Granite, Oak Wood',certification:'ISO Certified',countryOfOrigin:'Italy'},images:[],providerId:'pprov5',providerName:'TileWorld NG',providerRole:'seller',providerAvatar:null,providerPhone:'+234 820 555 6666',providerRating:4.5,providerReviews:41,providerVerified:true,providerTier:2,verified:true,featured:true,inStock:true,orderCount:89,views:1560,inquiries:123,saves:145,postedAt:'2025-11-20T11:00:00Z',status:'active',
    seller:{name:'TileWorld NG',verified:true},reviews:[{id:'rp8',userName:'Arc. Chinedu E.',rating:5,date:'2025-12-12',comment:'Premium quality tiles. Used for a 4-bed duplex and the finish is stunning.'}] },
  /* Home Appliances */
  { id:'pr8',type:'product',category:'home_appliances',subcategory:'Air Conditioners & Fans',title:'LG 1.5HP Split Unit AC — Inverter',description:'Energy-efficient 1.5HP inverter split unit air conditioner. Low noise operation, fast cooling, auto-restart, and R410A eco-friendly refrigerant.',price:285000,pricingUnit:'per_unit',pricePeriod:'',condition:'new',location:'Lagos & Abuja',state:'Lagos',area:'Ikeja',address:'15 Computer Village, Ikeja',deliveryOption:'delivery',deliveryFee:5000,deliveryTime:'1-3 days',deliveryAreas:['Lagos','FCT-Abuja','Ogun','Oyo','Rivers'],stockQuantity:12,minOrder:1,maxOrder:null,bulkPricing:[],negotiable:false,warranty:'2 years manufacturer, parts + labor',refundPolicy:'conditional',refundWindow:168,categoryFields:{brand:'LG',modelNumber:'LG-SPL1.5HP-INV',condition:'Brand New',powerRating:'1,200 watts / 1.5HP',voltage:'220V (Standard)',energyRating:'A++',keySpecs:'12,000 BTU, Inverter technology, R410A gas, 4-way swing, Smart diagnosis, Dual protection filter',installIncluded:'Yes (Extra Cost)',installCost:15000,warranty:'2 years full'},images:[],providerId:'pprov6',providerName:'CoolTech Appliances',providerRole:'seller',providerAvatar:null,providerPhone:'+234 821 111 2222',providerRating:4.7,providerReviews:89,providerVerified:true,providerTier:2,verified:true,featured:true,inStock:true,orderCount:156,views:3200,inquiries:267,saves:189,postedAt:'2026-01-10T10:00:00Z',status:'active',
    seller:{name:'CoolTech Appliances',verified:true},reviews:[{id:'rp9',userName:'Dr. Ngozi A.',rating:5,date:'2026-01-25',comment:'Excellent AC. Super quiet and cools the room in minutes. Installation team was professional.'},{id:'rp10',userName:'Yusuf B.',rating:4,date:'2026-01-18',comment:'Good product, energy efficient. Delivery was on time.'}] },
  /* Electrical & Lighting */
  { id:'pr9',type:'product',category:'electrical_lighting',subcategory:'Switches & Sockets',title:'Schneider 16A Double Socket — Asfora Series',description:'Premium double socket with child safety shutters. Clean white design, easy installation. SON and NEMSA certified.',price:2500,pricingUnit:'per_unit',pricePeriod:'',condition:'new',location:'Lagos',state:'Lagos',area:'Ikeja',address:'22 Allen Avenue, Ikeja',deliveryOption:'both',deliveryFee:1500,deliveryTime:'Same day',deliveryAreas:['Lagos','Ogun'],stockQuantity:500,minOrder:5,maxOrder:null,bulkPricing:[{minQty:50,discount:5},{minQty:200,discount:10}],negotiable:false,warranty:'3 years',refundPolicy:'conditional',refundWindow:48,categoryFields:{brand:'Schneider',specifications:'16A, 250V, double gang, surface mount, child safety shutters',certification:['SON Certified','NEMSA Compliant'],unitOfSale:'Per piece',minOrder:5},images:[],providerId:'pprov7',providerName:'ElectroPro Lagos',providerRole:'seller',providerAvatar:null,providerPhone:'+234 822 111 2222',providerRating:4.5,providerReviews:67,providerVerified:true,providerTier:1,verified:true,featured:false,inStock:true,orderCount:890,views:1890,inquiries:145,saves:67,postedAt:'2025-10-15T09:00:00Z',status:'active',
    seller:{name:'ElectroPro Lagos',verified:true},reviews:[{id:'rp11',userName:'Engr. Peter O.',rating:5,date:'2025-12-01',comment:'Genuine Schneider products. Using for all my projects now.'}] },
  /* Security */
  { id:'pr10',type:'product',category:'security_safety',subcategory:'CCTV Systems',title:'Hikvision 4-Channel CCTV Kit — 2MP',description:'Complete 4-channel surveillance kit with 4 bullet cameras (2MP), 4-channel DVR, 1TB HDD, 4 BNC cables (20m each), and power supply. Free installation within Lagos.',price:185000,pricingUnit:'per_set',pricePeriod:'',condition:'new',location:'Lagos & Abuja',state:'Lagos',area:'Lekki',address:'15 Admiralty Way, Lekki',deliveryOption:'delivery',deliveryFee:3000,deliveryTime:'1-3 days',deliveryAreas:['Lagos','FCT-Abuja','Ogun','Rivers'],stockQuantity:15,minOrder:1,maxOrder:null,bulkPricing:[],negotiable:true,warranty:'1 year full, 2 year parts',refundPolicy:'conditional',refundWindow:168,categoryFields:{brand:'Hikvision',kitContents:'4× 2MP bullet cameras, 1× 4CH DVR, 1× 1TB HDD, 4× 20m BNC cables, 1× 4-port power supply, connectors & mounting hardware',specifications:'2MP (1080p), 30m IR night vision, IP66 weatherproof, H.265+ compression, remote viewing via Hik-Connect app',installIncluded:'Yes (Free)',installCost:0,warranty:'1 year full warranty, 2 year parts'},images:[],providerId:'pprov8',providerName:'SecureTech NG',providerRole:'seller',providerAvatar:null,providerPhone:'+234 823 111 2222',providerRating:4.8,providerReviews:45,providerVerified:true,providerTier:2,verified:true,featured:true,inStock:true,orderCount:78,views:2890,inquiries:189,saves:210,postedAt:'2025-12-10T11:00:00Z',status:'active',
    seller:{name:'SecureTech NG',verified:true},reviews:[{id:'rp12',userName:'Chief Adebayo',rating:5,date:'2026-01-20',comment:'Professional installation, crystal clear images. Night vision works perfectly.'},{id:'rp13',userName:'Mrs. Funke A.',rating:5,date:'2026-01-05',comment:'Peace of mind! Can monitor my home from my phone anywhere.'}] },
  /* Garden & Outdoor */
  { id:'pr11',type:'product',category:'garden_outdoor',subcategory:'Interlocking Stones & Pavers',title:'Interlocking Paving Stones — S-Type',description:'Premium interlocking paving stones for driveways, walkways, and patios. Available in red, grey, and black. Highly durable and weather-resistant.',price:2500,pricingUnit:'per_sqm',pricePeriod:' /sqm',condition:'new',location:'Lagos',state:'Lagos',area:'Lagos',address:'KM 12 Lagos-Ibadan Expressway',deliveryOption:'both',deliveryFee:15000,deliveryTime:'3-5 days',deliveryAreas:['Lagos','Ogun','Oyo'],stockQuantity:5000,minOrder:10,maxOrder:null,bulkPricing:[{minQty:100,discount:5},{minQty:500,discount:10}],negotiable:true,warranty:'',refundPolicy:'conditional',refundWindow:48,categoryFields:{material:'Concrete',dimensions:'Per sqm (8 pieces per sqm)',colorFinish:'Red, Grey, Black',installService:'Yes (Extra Cost)',installCost:1500,weatherResistant:true},images:[],providerId:'pprov9',providerName:'StoneWorks Nigeria',providerRole:'seller',providerAvatar:null,providerPhone:'+234 824 111 2222',providerRating:4.3,providerReviews:34,providerVerified:true,providerTier:1,verified:true,featured:false,inStock:true,orderCount:45,views:890,inquiries:67,saves:34,postedAt:'2025-11-01T10:00:00Z',status:'active',
    seller:{name:'StoneWorks Nigeria',verified:true},reviews:[{id:'rp14',userName:'Engr. Obi C.',rating:4,date:'2025-12-20',comment:'Good pavers, nice finish. Installation team did a decent job.'}] },
  /* Cleaning */
  { id:'pr12',type:'product',category:'cleaning_maintenance',subcategory:'Cleaning Chemicals & Detergents',title:'Industrial Floor Cleaner — 5L Multi-Surface',description:'Professional-grade multi-surface floor cleaner. Effective on tiles, marble, terrazzo, and concrete. Streak-free finish. Eco-friendly formula.',price:8500,pricingUnit:'per_unit',pricePeriod:'',condition:'new',location:'Lagos',state:'Lagos',area:'Ikeja',address:'10 Toyin Street, Ikeja',deliveryOption:'delivery',deliveryFee:1500,deliveryTime:'Same day',deliveryAreas:['Lagos','Ogun'],stockQuantity:200,minOrder:1,maxOrder:null,bulkPricing:[{minQty:10,discount:5}],negotiable:false,warranty:'',refundPolicy:'non_refundable',refundWindow:0,categoryFields:{brand:'Other',sizeVolume:'5 litres',safetyData:'Non-Hazardous',activeIngredient:'Surfactant blend, citrus extract'},images:[],providerId:'pprov10',providerName:'CleanPro Supplies',providerRole:'seller',providerAvatar:null,providerPhone:'+234 825 111 2222',providerRating:4.4,providerReviews:23,providerVerified:true,providerTier:1,verified:true,featured:false,inStock:true,orderCount:156,views:450,inquiries:34,saves:12,postedAt:'2026-01-20T09:00:00Z',status:'active',
    seller:{name:'CleanPro Supplies',verified:true},reviews:[] },
  /* ── Structured Preference Products (preference engine) ── */
  { id:'pr13',type:'product',category:'building_materials',subcategory:'Iron & Steel',title:'TMT Iron Rods 12mm — Fe500D Grade',description:'High-strength TMT reinforcement bars, 12mm diameter, Fe500D grade. Ideal for columns, beams, and foundations. Ribbed surface for superior concrete bonding. ISI & SON certified.',price:4200,pricingUnit:'per_piece',pricePeriod:' /piece',condition:'new',location:'Lagos & Ogun',state:'Lagos',area:'Alaba',address:'Block C, Alaba International Market',deliveryOption:'both',deliveryFee:8000,deliveryTime:'1-2 days',deliveryAreas:['Lagos','Ogun','Oyo','FCT-Abuja'],stockQuantity:5000,minOrder:50,maxOrder:null,bulkPricing:[{minQty:200,discount:3},{minQty:1000,discount:7}],negotiable:true,warranty:'',refundPolicy:'non_refundable',refundWindow:0,categoryFields:{},images:[],providerId:'pprov1',providerName:'BuildMart Nigeria',providerRole:'seller',providerAvatar:null,providerPhone:'+234 820 111 2222',providerRating:4.6,providerReviews:145,providerVerified:true,providerTier:2,verified:true,featured:true,inStock:true,orderCount:478,views:5200,inquiries:345,saves:267,postedAt:'2025-09-10T10:00:00Z',status:'active',
    preferences:{product:'tmt_iron_rods',attributes:{diameter_mm:'12',length_m:'12',grade:'Fe500D',surface:'Ribbed',unit:'Piece'}},
    seller:{name:'BuildMart Nigeria',verified:true},reviews:[{id:'rp15',userName:'Engr. Adamu B.',rating:5,date:'2026-01-22',comment:'Consistent quality rods. Used for a 3-storey building — zero bending issues.'},{id:'rp16',userName:'Contractor Emeka',rating:4,date:'2025-12-18',comment:'Good Fe500D. Delivered 2000 pieces on time.'}] },
  { id:'pr14',type:'product',category:'building_materials',subcategory:'Wood & Panels',title:'Marine Board 18mm — High Gloss White',description:'Premium marine-grade plywood board, 18mm thickness. Waterproof, termite-resistant, and suitable for kitchen cabinets, bathroom vanities, and outdoor furniture. High gloss finish.',price:18500,pricingUnit:'per_sheet',pricePeriod:' /sheet',condition:'new',location:'Lagos',state:'Lagos',area:'Mushin',address:'55 Agege Motor Road, Mushin',deliveryOption:'both',deliveryFee:5000,deliveryTime:'1-3 days',deliveryAreas:['Lagos','Ogun'],stockQuantity:300,minOrder:5,maxOrder:null,bulkPricing:[{minQty:20,discount:5},{minQty:50,discount:8}],negotiable:true,warranty:'',refundPolicy:'conditional',refundWindow:48,categoryFields:{},images:[],providerId:'pprov11',providerName:'WoodLand Panels',providerRole:'seller',providerAvatar:null,providerPhone:'+234 826 111 2222',providerRating:4.5,providerReviews:56,providerVerified:true,providerTier:1,verified:true,featured:false,inStock:true,orderCount:123,views:1890,inquiries:89,saves:67,postedAt:'2025-10-05T11:00:00Z',status:'active',
    preferences:{product:'marine_board',attributes:{size:'8ft × 4ft (2440 × 1220mm)',thickness_mm:'18',finish:'High Gloss',density:'High Density',color:'White',unit:'Sheet'}},
    seller:{name:'WoodLand Panels',verified:true},reviews:[{id:'rp17',userName:'Arc. Bola T.',rating:5,date:'2026-01-10',comment:'Excellent marine board. Used for kitchen cabinets — no warping after 6 months.'},{id:'rp18',userName:'Carpenter Idris',rating:4,date:'2025-11-28',comment:'Good quality, smooth finish. Cuts cleanly.'}] },
  { id:'pr15',type:'product',category:'building_materials',subcategory:'Cement & Concrete',title:'Dangote Cement 42.5R — 50kg Bag',description:'Dangote 42.5R rapid-setting Portland cement. High early strength, ideal for structural works, precast elements, and fast-track projects. SON certified.',price:5500,pricingUnit:'per_bag',pricePeriod:' /bag',condition:'new',location:'Nationwide Delivery',state:'Lagos',area:'Lagos',address:'12 Alaba International Market',deliveryOption:'both',deliveryFee:5000,deliveryTime:'2-3 days',deliveryAreas:['Lagos','Ogun','Oyo','FCT-Abuja','Rivers','Kaduna'],stockQuantity:1000,minOrder:10,maxOrder:2000,bulkPricing:[{minQty:100,discount:3},{minQty:500,discount:7}],negotiable:true,warranty:'',refundPolicy:'non_refundable',refundWindow:0,categoryFields:{},images:[],providerId:'pprov1',providerName:'BuildMart Nigeria',providerRole:'seller',providerAvatar:null,providerPhone:'+234 820 111 2222',providerRating:4.6,providerReviews:145,providerVerified:true,providerTier:2,verified:true,featured:true,inStock:true,orderCount:567,views:6100,inquiries:456,saves:312,postedAt:'2025-08-15T10:00:00Z',status:'active',
    preferences:{product:'portland_cement',attributes:{brand:'Dangote',grade:'42.5R',weight:'50kg',type:'OPC',unit:'Bag'}},
    seller:{name:'BuildMart Nigeria',verified:true},reviews:[{id:'rp19',userName:'Engr. Chidi O.',rating:5,date:'2026-01-25',comment:'42.5R sets fast and strong. My go-to for structural work.'},{id:'rp20',userName:'Site Manager Yinka',rating:4,date:'2025-12-30',comment:'Reliable quality. Bulk delivery was well organized.'}] },
];

/* ── MOCK RELOCATION PROVIDERS (dev fallback) ────────────── */
const MOCK_RELOCATION_PROVIDERS = [
  { id:'rp1',type:'relocation',name:'QuickMove Nigeria',avatar:null,coverImage:null,portfolioImages:[],verified:true,tier:2,rating:4.7,reviews:89,completedMoves:432,yearsActive:5,responseTime:'< 2 hours',serviceTypes:['local','interstate','packing','storage'],serviceAreas:['Lagos','Ogun','Oyo'],priceRange:{local:{min:35000,max:150000},interstate:{min:120000,max:500000}},description:'Professional moving services with insured transport, trained packers, and GPS-tracked vehicles. Serving Lagos and surrounding states since 2021.',highlights:['Insured','GPS Tracking','Professional Packers','Weekend Service'],insurance:true,gpsTracking:true,location:'Ikeja, Lagos',state:'Lagos',phone:'+234 810 666 7777',bio:'QuickMove Nigeria is a full-service relocation company specializing in residential and office moves. Our trained team handles everything from packing to setup at your new location.',featured:true,status:'active',postedAt:'2025-06-10T10:00:00Z',views:3420,inquiries:267 },
  { id:'rp2',type:'relocation',name:'SafeHaul Logistics',avatar:null,coverImage:null,portfolioImages:[],verified:true,tier:3,rating:4.9,reviews:142,completedMoves:267,yearsActive:8,responseTime:'< 1 hour',serviceTypes:['interstate','international','vehicle','storage'],serviceAreas:['FCT-Abuja','Kaduna','Kano','Nasarawa','Niger'],priceRange:{interstate:{min:180000,max:750000},international:{min:1500000,max:8000000}},description:'Premium interstate and international relocation. White-glove service with dedicated move managers and climate-controlled transport for valuables.',highlights:['White Glove','Climate Controlled','Dedicated Manager','International Network'],insurance:true,gpsTracking:true,location:'Garki, Abuja',state:'FCT-Abuja',phone:'+234 811 222 3333',bio:'SafeHaul is Nigeria\'s leading premium relocation partner, trusted by embassies, multinational corporations, and high-net-worth families for interstate and international moves.',featured:true,status:'active',postedAt:'2025-03-15T09:00:00Z',views:2890,inquiries:198 },
  { id:'rp3',type:'relocation',name:'LagosMovers Pro',avatar:null,coverImage:null,portfolioImages:[],verified:true,tier:1,rating:4.3,reviews:54,completedMoves:189,yearsActive:3,responseTime:'< 3 hours',serviceTypes:['local','packing'],serviceAreas:['Lagos'],priceRange:{local:{min:25000,max:120000}},description:'Affordable local moves within Lagos. Same-day service available. Professional handling of furniture and electronics.',highlights:['Same Day','Affordable','Furniture Assembly'],insurance:true,gpsTracking:false,location:'Surulere, Lagos',state:'Lagos',phone:'+234 812 333 4444',bio:'We make moving within Lagos simple and affordable. Our experienced crew handles your belongings with care, and we offer same-day service for urgent relocations.',featured:false,status:'active',postedAt:'2025-08-20T11:00:00Z',views:1560,inquiries:123 },
  { id:'rp4',type:'relocation',name:'NaijaRelocate',avatar:null,coverImage:null,portfolioImages:[],verified:true,tier:3,rating:4.8,reviews:203,completedMoves:512,yearsActive:10,responseTime:'< 1 hour',serviceTypes:['local','interstate','international','office','packing','storage','vehicle'],serviceAreas:['Lagos','FCT-Abuja','Rivers','Ogun','Oyo','Kano','Delta','Anambra','Edo','Enugu'],priceRange:{local:{min:40000,max:200000},interstate:{min:150000,max:600000},international:{min:2000000,max:10000000}},description:'Nigeria\'s most comprehensive relocation service. From single-room moves to full corporate relocations, we handle it all with military precision.',highlights:['Full Service','Corporate Specialist','International','24/7 Support','Pet Relocation'],insurance:true,gpsTracking:true,location:'Victoria Island, Lagos',state:'Lagos',phone:'+234 813 444 5555',bio:'NaijaRelocate has been Nigeria\'s trusted moving partner for over a decade. We\'ve completed 500+ successful relocations across 10 states and 15 countries.',featured:true,status:'active',postedAt:'2025-01-05T10:00:00Z',views:5670,inquiries:445 },
  { id:'rp5',type:'relocation',name:'EasyPack & Go',avatar:null,coverImage:null,portfolioImages:[],verified:true,tier:1,rating:4.2,reviews:31,completedMoves:98,yearsActive:2,responseTime:'< 4 hours',serviceTypes:['packing','local','storage'],serviceAreas:['Lagos','Ogun'],priceRange:{local:{min:20000,max:80000}},description:'Specialized packing services for relocations. We pack, you move — or let us handle both. Eco-friendly packing materials available.',highlights:['Eco-Friendly','Packing Specialist','Affordable'],insurance:true,gpsTracking:false,location:'Abeokuta, Ogun',state:'Ogun',phone:'+234 814 555 6666',bio:'EasyPack & Go takes the stress out of packing. Our trained team carefully wraps and boxes all your items using premium, eco-friendly materials.',featured:false,status:'active',postedAt:'2025-10-12T14:00:00Z',views:780,inquiries:56 },
  { id:'rp6',type:'relocation',name:'Royal Movers PH',avatar:null,coverImage:null,portfolioImages:[],verified:true,tier:2,rating:4.5,reviews:67,completedMoves:156,yearsActive:4,responseTime:'< 2 hours',serviceTypes:['local','interstate','packing','vehicle'],serviceAreas:['Rivers','Bayelsa','Delta','Akwa Ibom','Cross River'],priceRange:{local:{min:30000,max:130000},interstate:{min:100000,max:450000}},description:'Port Harcourt\'s premier moving company. Trusted by the oil & gas community for secure, timely relocations across the South-South region.',highlights:['Oil & Gas Experience','Secure Transport','South-South Specialist'],insurance:true,gpsTracking:true,location:'GRA, Port Harcourt',state:'Rivers',phone:'+234 815 666 7777',bio:'Royal Movers has built a strong reputation in the South-South, particularly among oil & gas professionals who need reliable, secure moving services.',featured:false,status:'active',postedAt:'2025-07-18T09:00:00Z',views:1230,inquiries:89 },
  { id:'rp7',type:'relocation',name:'SwiftMove Abuja',avatar:null,coverImage:null,portfolioImages:[],verified:true,tier:2,rating:4.6,reviews:78,completedMoves:211,yearsActive:6,responseTime:'Same day',serviceTypes:['office','local','interstate','packing'],serviceAreas:['FCT-Abuja','Nasarawa','Niger','Kaduna'],priceRange:{local:{min:45000,max:180000},interstate:{min:130000,max:550000}},description:'Office and commercial relocation specialists in Abuja. Minimal downtime guaranteed — we move your business overnight so you\'re operational by morning.',highlights:['Office Specialist','Overnight Moves','IT Equipment Handling','Minimal Downtime'],insurance:true,gpsTracking:true,location:'Wuse 2, Abuja',state:'FCT-Abuja',phone:'+234 816 777 8888',bio:'SwiftMove specializes in office and commercial relocations. We understand that downtime costs money, which is why we execute most moves overnight.',featured:true,status:'active',postedAt:'2025-05-22T08:00:00Z',views:1890,inquiries:145 },
  { id:'rp8',type:'relocation',name:'GreenVan Logistics',avatar:null,coverImage:null,portfolioImages:[],verified:true,tier:1,rating:4.4,reviews:42,completedMoves:74,yearsActive:2,responseTime:'< 3 hours',serviceTypes:['local','packing','storage'],serviceAreas:['Lagos'],priceRange:{local:{min:28000,max:100000}},description:'Eco-friendly moving service using biodiesel vehicles and recycled packing materials. Carbon-neutral relocations within Lagos.',highlights:['Eco-Friendly','Carbon Neutral','Biodiesel Fleet','Recycled Materials'],insurance:true,gpsTracking:false,location:'Lekki, Lagos',state:'Lagos',phone:'+234 817 888 9999',bio:'GreenVan is Lagos\' first carbon-neutral moving company. We use biodiesel trucks and recycled packing materials to minimize our environmental footprint.',featured:false,status:'active',postedAt:'2025-09-30T12:00:00Z',views:920,inquiries:63 },
];

/* ── Categories + helpers (unchanged exports) ────────────── */
export const PROPERTY_CATEGORIES = [
  { id:'all',label:'All',emoji:'🏘️'},{ id:'rental',label:'Rental',emoji:'🏠'},{ id:'buy',label:'Buy',emoji:'🏡'},
  { id:'lease',label:'Lease',emoji:'📋'},{ id:'land',label:'Land',emoji:'🗺️'},{ id:'shortlet',label:'Shortlet',emoji:'🏨'},{ id:'shared',label:'Shared',emoji:'👥'},{ id:'stay',label:'Stay',emoji:'🛋️'},
];
export const SERVICE_CATEGORIES = [
  { id:'all',label:'All Services'},{ id:'Interior Design',label:'Interior Design'},{ id:'Plumbing',label:'Plumbing'},
  { id:'Electrical',label:'Electrical'},{ id:'Cleaning',label:'Cleaning'},{ id:'Legal',label:'Legal'},{ id:'Moving',label:'Moving'},
];
export const PRODUCT_CATEGORIES = [
  { id:'all',label:'All Products'},
  { id:'building_materials',label:'Building Materials',emoji:'🧱'},
  { id:'furniture_fittings',label:'Furniture',emoji:'🪑'},
  { id:'home_appliances',label:'Appliances',emoji:'📺'},
  { id:'interior_decor',label:'Décor & Finishing',emoji:'🎨'},
  { id:'plumbing_sanitary',label:'Plumbing',emoji:'🚿'},
  { id:'electrical_lighting',label:'Electrical',emoji:'💡'},
  { id:'garden_outdoor',label:'Garden & Outdoor',emoji:'🌿'},
  { id:'security_safety',label:'Security',emoji:'🔐'},
  { id:'cleaning_maintenance',label:'Cleaning',emoji:'🧹'},
  { id:'professional_services',label:'Services',emoji:'👷'},
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

/* ── Reducer ─────────────────────────────────────────────── */

const initialState = {
  properties: [],
  services:   [],
  products:   [],
  relocationProviders: [],
  loading:    { properties: true, services: true, products: true, relocation: true },
  error:      { properties: null, services: null, products: null, relocation: null },
  searchQuery: '',
  wishlist:   [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_SUCCESS':
      return {
        ...state,
        [action.entity]:  action.data,
        loading: { ...state.loading, [action.entity]: false },
        error:   { ...state.error,   [action.entity]: null },
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        loading: { ...state.loading, [action.entity]: false },
        error:   { ...state.error,   [action.entity]: action.error },
      };
    case 'USE_FALLBACK':
      return {
        ...state,
        [action.entity]:  action.data,
        loading: { ...state.loading, [action.entity]: false },
      };
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.query };
    case 'SET_WISHLIST':
      return { ...state, wishlist: action.wishlist };
    case 'ADD_LISTING':
      return { ...state, properties: [action.listing, ...state.properties] };
    default:
      return state;
  }
}

/* ══ PROVIDER ════════════════════════════════════════════════ */
export function PropertyProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    wishlist: (() => {
      try { const s = sessionStorage.getItem('aurban_wishlist'); return s ? JSON.parse(s) : []; }
      catch { return []; }
    })(),
  });

  /* ── Fetch data on mount (API-first, mock fallback) ────── */
  useEffect(() => {
    let cancelled = false;

    async function fetchProperties() {
      try {
        const result = await propertyService.getProperties({ limit: 50 });
        if (cancelled) return;
        if (result.success && result.properties?.length) {
          dispatch({ type: 'FETCH_SUCCESS', entity: 'properties', data: result.properties });
        } else {
          dispatch({ type: 'USE_FALLBACK', entity: 'properties', data: MOCK_PROPERTIES });
        }
      } catch {
        if (!cancelled) dispatch({ type: 'USE_FALLBACK', entity: 'properties', data: MOCK_PROPERTIES });
      }
    }

    async function fetchServices() {
      try {
        const result = await propertyService.getProperties({ limit: 50, type: 'service' });
        if (cancelled) return;
        if (result.success && result.properties?.length) {
          dispatch({ type: 'FETCH_SUCCESS', entity: 'services', data: result.properties });
        } else {
          dispatch({ type: 'USE_FALLBACK', entity: 'services', data: MOCK_SERVICES });
        }
      } catch {
        if (!cancelled) dispatch({ type: 'USE_FALLBACK', entity: 'services', data: MOCK_SERVICES });
      }
    }

    async function fetchProducts() {
      try {
        const result = await propertyService.getProperties({ limit: 50, type: 'product' });
        if (cancelled) return;
        if (result.success && result.properties?.length) {
          dispatch({ type: 'FETCH_SUCCESS', entity: 'products', data: result.properties });
        } else {
          dispatch({ type: 'USE_FALLBACK', entity: 'products', data: MOCK_PRODUCTS });
        }
      } catch {
        if (!cancelled) dispatch({ type: 'USE_FALLBACK', entity: 'products', data: MOCK_PRODUCTS });
      }
    }

    async function fetchRelocationProviders() {
      try {
        const result = await relocationService.getProviders({ limit: 50 });
        if (cancelled) return;
        if (result.success && result.providers?.length) {
          dispatch({ type: 'FETCH_SUCCESS', entity: 'relocationProviders', data: result.providers });
        } else {
          dispatch({ type: 'USE_FALLBACK', entity: 'relocationProviders', data: MOCK_RELOCATION_PROVIDERS });
        }
      } catch {
        if (!cancelled) dispatch({ type: 'USE_FALLBACK', entity: 'relocationProviders', data: MOCK_RELOCATION_PROVIDERS });
      }
    }

    fetchProperties();
    fetchServices();
    fetchProducts();
    fetchRelocationProviders();

    return () => { cancelled = true; };
  }, []);

  /* ── Lookups ───────────────────────────────────────────── */
  const getPropertyById = useCallback((id) => state.properties.find(p => String(p.id) === String(id)), [state.properties]);
  const getServiceById  = useCallback((id) => state.services.find(s => String(s.id) === String(id)), [state.services]);
  const getProductById  = useCallback((id) => state.products.find(p => String(p.id) === String(id)), [state.products]);

  const getRelocationProviderById = useCallback((id) => state.relocationProviders.find(p => String(p.id) === String(id)), [state.relocationProviders]);

  /* ── Filters (client-side on loaded data) ──────────────── */
  const filterProperties = useCallback((f = {}) => {
    let r = [...state.properties];
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
  }, [state.properties]);

  const filterServices = useCallback((f = {}) => {
    let r = [...state.services];
    if (f.category && f.category !== 'all') r = r.filter(s => s.category === f.category);
    if (f.state && f.state !== 'All States') r = r.filter(s => s.state === f.state);
    if (f.search) { const q = f.search.toLowerCase(); r = r.filter(s => s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.providerName.toLowerCase().includes(q)); }
    if (f.sort === 'rating')    r.sort((a,b) => b.providerRating - a.providerRating);
    if (f.sort === 'popular')   r.sort((a,b) => b.views - a.views);
    if (f.sort === 'price_asc') r.sort((a,b) => a.price - b.price);
    return r;
  }, [state.services]);

  const filterProducts = useCallback((f = {}) => {
    let r = [...state.products];
    if (f.category && f.category !== 'all') r = r.filter(p => p.category === f.category);
    if (f.subcategory) r = r.filter(p => p.subcategory === f.subcategory);
    if (f.condition && f.condition !== 'Any') {
      const condMap = { 'Brand New': 'new', 'Fairly Used': 'fairly_used', 'Open Box': 'open_box' };
      r = r.filter(p => p.condition === (condMap[f.condition] || f.condition));
    }
    if (f.deliveryOption && f.deliveryOption !== 'Any') {
      const dlvMap = { 'Delivery Available': 'delivery', 'Pickup Only': 'pickup', 'Pickup or Delivery': 'both' };
      r = r.filter(p => p.deliveryOption === (dlvMap[f.deliveryOption] || f.deliveryOption));
    }
    if (f.state && f.state !== 'All States') r = r.filter(p => p.state === f.state || p.deliveryAreas?.includes(f.state));
    if (f.minPrice) r = r.filter(p => p.price >= Number(f.minPrice));
    if (f.maxPrice) r = r.filter(p => p.price <= Number(f.maxPrice));
    if (f.verified) r = r.filter(p => p.providerVerified || p.seller?.verified);
    if (f.inStock) r = r.filter(p => p.inStock !== false);
    if (f.search) { const q = f.search.toLowerCase(); r = r.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.providerName.toLowerCase().includes(q) || p.subcategory?.toLowerCase().includes(q)); }
    if (f.sort === 'price_asc')  r.sort((a,b) => a.price - b.price);
    if (f.sort === 'price_desc') r.sort((a,b) => b.price - a.price);
    if (f.sort === 'popular')    r.sort((a,b) => b.views - a.views);
    if (f.sort === 'newest')     r.sort((a,b) => new Date(b.postedAt) - new Date(a.postedAt));
    if (f.sort === 'rating')     r.sort((a,b) => (b.providerRating||0) - (a.providerRating||0));
    if (f.sort === 'best_selling') r.sort((a,b) => (b.orderCount||0) - (a.orderCount||0));
    return r;
  }, [state.products]);

  const filterRelocationProviders = useCallback((f = {}) => {
    let r = [...state.relocationProviders];
    if (f.serviceType && f.serviceType !== 'all') r = r.filter(p => p.serviceTypes?.includes(f.serviceType));
    if (f.state && f.state !== 'All States') r = r.filter(p => p.state === f.state || p.serviceAreas?.includes(f.state));
    if (f.minRating) r = r.filter(p => p.rating >= f.minRating);
    if (f.insurance) r = r.filter(p => p.insurance);
    if (f.verified) r = r.filter(p => p.verified);
    if (f.minBudget) r = r.filter(p => {
      const mins = Object.values(p.priceRange || {}).map(v => v.min);
      return mins.length && Math.min(...mins) >= f.minBudget;
    });
    if (f.maxBudget) r = r.filter(p => {
      const mins = Object.values(p.priceRange || {}).map(v => v.min);
      return mins.length && Math.min(...mins) <= f.maxBudget;
    });
    if (f.search) { const q = f.search.toLowerCase(); r = r.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.serviceAreas?.some(a => a.toLowerCase().includes(q))); }
    if (f.sort === 'rating')     r.sort((a, b) => b.rating - a.rating);
    if (f.sort === 'price_asc')  r.sort((a, b) => { const aMin = Math.min(...Object.values(a.priceRange||{}).map(v=>v.min)); const bMin = Math.min(...Object.values(b.priceRange||{}).map(v=>v.min)); return aMin - bMin; });
    if (f.sort === 'price_desc') r.sort((a, b) => { const aMin = Math.min(...Object.values(a.priceRange||{}).map(v=>v.min)); const bMin = Math.min(...Object.values(b.priceRange||{}).map(v=>v.min)); return bMin - aMin; });
    if (f.sort === 'reviews')    r.sort((a, b) => b.reviews - a.reviews);
    if (f.sort === 'moves')      r.sort((a, b) => b.completedMoves - a.completedMoves);
    if (f.sort === 'newest')     r.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
    return r;
  }, [state.relocationProviders]);

  /* ── Product helpers ──────────────────────────────────── */
  const getProductsBySeller = useCallback((sellerId) => state.products.filter(p => p.providerId === sellerId), [state.products]);
  const getFeaturedProducts = useCallback(() => state.products.filter(p => p.featured), [state.products]);
  const getTrendingProducts = useCallback(() => [...state.products].sort((a,b) => b.views - a.views).slice(0, 8), [state.products]);

  /* ── Cross-marketplace search ──────────────────────────── */
  const searchAll = useCallback((query) => {
    if (!query?.trim()) return { properties:[], services:[], products:[] };
    const q = query.toLowerCase();
    return {
      properties: state.properties.filter(p => p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)),
      services: state.services.filter(s => s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)),
      products: state.products.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)),
    };
  }, [state.properties, state.services, state.products]);

  /* ── Wishlist ──────────────────────────────────────────── */
  const toggleWishlist = useCallback((item) => {
    const exists = state.wishlist.find(w => w.id === item.id);
    const next = exists ? state.wishlist.filter(w => w.id !== item.id) : [...state.wishlist, { ...item, savedAt: new Date().toISOString() }];
    try { sessionStorage.setItem('aurban_wishlist', JSON.stringify(next)); } catch { /* ignore */ }
    // Sync to server if user is logged in (fire-and-forget)
    try {
      const session = sessionStorage.getItem('aurban_session');
      if (session) propertyService.syncWishlist(next.map(w => w.id));
    } catch { /* ignore */ }
    dispatch({ type: 'SET_WISHLIST', wishlist: next });
  }, [state.wishlist]);

  const isWishlisted = useCallback((id) => state.wishlist.some(w => w.id === id), [state.wishlist]);

  /* ── Add listing ───────────────────────────────────────── */
  const addListing = useCallback(async (listing) => {
    try {
      const result = await propertyService.createProperty(listing);
      if (result.success && result.property) {
        dispatch({ type: 'ADD_LISTING', listing: result.property });
        return result;
      }
    } catch { /* ignore */ }
    // Fallback: add locally
    dispatch({ type: 'ADD_LISTING', listing: { id: `local_${Date.now()}`, ...listing, status: 'active', postedAt: new Date().toISOString() } });
    return { success: true, local: true };
  }, []);

  /* ── Refresh helpers ───────────────────────────────────── */
  const refreshProperties = useCallback(async () => {
    try {
      const result = await propertyService.getProperties({ limit: 50 });
      if (result.success && result.properties?.length) {
        dispatch({ type: 'FETCH_SUCCESS', entity: 'properties', data: result.properties });
      }
    } catch { /* ignore */ }
  }, []);

  const refreshServices = useCallback(async () => {
    try {
      const result = await propertyService.getProperties({ limit: 50, type: 'service' });
      if (result.success && result.properties?.length) {
        dispatch({ type: 'FETCH_SUCCESS', entity: 'services', data: result.properties });
      }
    } catch { /* ignore */ }
  }, []);

  const refreshProducts = useCallback(async () => {
    try {
      const result = await propertyService.getProperties({ limit: 50, type: 'product' });
      if (result.success && result.properties?.length) {
        dispatch({ type: 'FETCH_SUCCESS', entity: 'products', data: result.properties });
      }
    } catch { /* ignore */ }
  }, []);

  const refreshRelocationProviders = useCallback(async () => {
    try {
      const result = await relocationService.getProviders({ limit: 50 });
      if (result.success && result.providers?.length) {
        dispatch({ type: 'FETCH_SUCCESS', entity: 'relocationProviders', data: result.providers });
      }
    } catch { /* ignore */ }
  }, []);

  const setSearchQuery = useCallback((query) => dispatch({ type: 'SET_SEARCH', query }), []);

  /* ── Context value ─────────────────────────────────────── */
  const value = useMemo(() => ({
    properties: state.properties, services: state.services, products: state.products,
    relocationProviders: state.relocationProviders,
    getPropertyById, getServiceById, getProductById, getRelocationProviderById,
    filterProperties, filterServices, filterProducts, filterRelocationProviders,
    getProductsBySeller, getFeaturedProducts, getTrendingProducts,
    searchAll, addListing,
    searchQuery: state.searchQuery, setSearchQuery,
    wishlist: state.wishlist, toggleWishlist, isWishlisted,
    loading: state.loading, error: state.error,
    refreshProperties, refreshServices, refreshProducts, refreshRelocationProviders,
  }), [state, getPropertyById, getServiceById, getProductById, getRelocationProviderById, filterProperties, filterServices, filterProducts, filterRelocationProviders, getProductsBySeller, getFeaturedProducts, getTrendingProducts, searchAll, addListing, setSearchQuery, toggleWishlist, isWishlisted, refreshProperties, refreshServices, refreshProducts, refreshRelocationProviders]);

  return <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>;
}

export function useProperty() {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error('useProperty must be used inside PropertyProvider');
  return ctx;
}

export default PropertyContext;
