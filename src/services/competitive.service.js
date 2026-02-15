import api from './api.js';

/**
 * Competitive Intelligence Service
 * Live internet presence, search intelligence, traffic sources,
 * social media metrics, competitor comparison, and global rankings.
 *
 * All methods try the API first and fall back to mock data.
 * Returns { success: true, ...data } shape.
 */

// ── Mock: Web Presence ──────────────────────────────────────

const MOCK_WEB_PRESENCE = {
  websiteVisitsToday: 12847,
  websiteVisitsYesterday: 11293,
  visitsTrend: '+13.8%',
  activeSessions: 342,
  appInstallsToday: { ios: 89, android: 214, total: 303 },
  appInstallsYesterday: { ios: 72, android: 195, total: 267 },
  socialMentionsToday: 47,
  socialMentionsYesterday: 38,
  googleSearchVolumeToday: 1840,
  googleSearchVolumeYesterday: 1620,
  uptimePercent: 99.97,
  uptimeLast30Days: 99.94,
  pageSpeedScore: { mobile: 72, desktop: 91 },
  avgLoadTime: '2.1s',
  sslCertExpiry: '2026-08-14',
  lastCrawled: '2026-02-15T08:30:00Z',
  indexedPages: 14280,
  lastUpdated: new Date().toISOString(),
};

// ── Mock: Search Intelligence ────────────────────────────────

const MOCK_SEARCH_INTELLIGENCE = {
  googleSearchVolume: {
    monthly: [
      { month: 'Sep 2025', volume: 8200 },
      { month: 'Oct 2025', volume: 9100 },
      { month: 'Nov 2025', volume: 10400 },
      { month: 'Dec 2025', volume: 11800 },
      { month: 'Jan 2026', volume: 13200 },
      { month: 'Feb 2026', volume: 14500 },
    ],
    trend: '+76.8%',
    trendUp: true,
  },
  keywordRankings: [
    { keyword: 'aurban', position: 1, change: 0, volume: 14500, url: 'aurban.com' },
    { keyword: 'nigeria real estate', position: 8, change: +2, volume: 22000, url: 'aurban.com/properties' },
    { keyword: 'lagos property for rent', position: 5, change: +3, volume: 18500, url: 'aurban.com/properties?city=lagos' },
    { keyword: 'shortlet lagos', position: 4, change: -1, volume: 12000, url: 'aurban.com/shortlets' },
    { keyword: 'buy property nigeria', position: 12, change: +5, volume: 9800, url: 'aurban.com/properties?type=sale' },
    { keyword: 'abuja houses for rent', position: 7, change: +1, volume: 8400, url: 'aurban.com/properties?city=abuja' },
    { keyword: 'nigerian artisan services', position: 2, change: +4, volume: 3200, url: 'aurban.com/pro' },
    { keyword: 'building materials nigeria', position: 6, change: 0, volume: 5100, url: 'aurban.com/marketplace' },
  ],
  seoMetrics: {
    domainAuthority: 34,
    domainAuthorityChange: +3,
    backlinks: 12480,
    backlinksChange: +840,
    referringDomains: 342,
    referringDomainsChange: +28,
    organicKeywords: 2890,
    organicTraffic: 48200,
  },
  competitorSearchComparison: [
    { name: 'Aurban', volume: 14500, domainAuthority: 34, organicTraffic: 48200, color: '#d4a843' },
    { name: 'PropertyPro.ng', volume: 22000, domainAuthority: 52, organicTraffic: 185000, color: '#3B82F6' },
    { name: 'Jiji (Real Estate)', volume: 110000, domainAuthority: 68, organicTraffic: 520000, color: '#EF4444' },
    { name: 'Nigeria Property Centre', volume: 18000, domainAuthority: 48, organicTraffic: 142000, color: '#8B5CF6' },
  ],
  lastUpdated: new Date().toISOString(),
};

// ── Mock: Traffic Sources ────────────────────────────────────

const MOCK_TRAFFIC_SOURCES = {
  summary: { totalVisitors: 142000, period: 'Last 30 days' },
  sources: [
    { source: 'Organic Search', visitors: 48200, pct: 33.9, conversionRate: 4.2 },
    { source: 'Direct', visitors: 35500, pct: 25.0, conversionRate: 5.8 },
    { source: 'Social Media', visitors: 28400, pct: 20.0, conversionRate: 2.9 },
    { source: 'Referral', visitors: 14200, pct: 10.0, conversionRate: 3.5 },
    { source: 'App (Mobile)', visitors: 11360, pct: 8.0, conversionRate: 7.1 },
    { source: 'Email Campaigns', visitors: 4340, pct: 3.1, conversionRate: 6.4 },
  ],
  socialBreakdown: [
    { platform: 'Instagram', visitors: 9940, pct: 35.0, conversionRate: 3.2, followers: 28400, color: '#E1306C' },
    { platform: 'X (Twitter)', visitors: 7100, pct: 25.0, conversionRate: 2.1, followers: 15200, color: '#1DA1F2' },
    { platform: 'Facebook', visitors: 5680, pct: 20.0, conversionRate: 3.8, followers: 42100, color: '#1877F2' },
    { platform: 'TikTok', visitors: 3408, pct: 12.0, conversionRate: 1.8, followers: 8900, color: '#FF004F' },
    { platform: 'LinkedIn', visitors: 1420, pct: 5.0, conversionRate: 4.5, followers: 5600, color: '#0A66C2' },
    { platform: 'YouTube', visitors: 852, pct: 3.0, conversionRate: 2.4, subscribers: 3200, color: '#FF0000' },
  ],
  referralSites: [
    { site: 'nairaland.com', visitors: 4260, pct: 30.0 },
    { site: 'lagosrealestate.blog', visitors: 2840, pct: 20.0 },
    { site: 'techcabal.com', visitors: 1988, pct: 14.0 },
    { site: 'businessday.ng', visitors: 1562, pct: 11.0 },
    { site: 'guardian.ng', visitors: 1136, pct: 8.0 },
    { site: 'Others', visitors: 2414, pct: 17.0 },
  ],
  appTraffic: {
    ios: { visitors: 3976, pct: 35, avgSession: '6m 12s' },
    android: { visitors: 7384, pct: 65, avgSession: '5m 48s' },
  },
  emailCampaigns: [
    { campaign: 'Weekly Listings Digest', sent: 18400, opened: 4232, clicked: 1472, conversions: 94 },
    { campaign: 'New Shortlet Arrivals', sent: 12800, opened: 3456, clicked: 1024, conversions: 67 },
    { campaign: 'Provider Onboarding', sent: 890, opened: 534, clicked: 267, conversions: 42 },
  ],
  lastUpdated: new Date().toISOString(),
};

// ── Mock: Social Media Metrics ───────────────────────────────

const MOCK_SOCIAL_METRICS = {
  platforms: [
    {
      platform: 'Instagram', handle: '@aurban.ng', followers: 28400, followersGrowth: '+12.3%',
      engagementRate: '4.8%', postsThisMonth: 24, avgReach: 8500, avgLikes: 342,
      topPost: { type: 'Reel', reach: 45000, engagement: '8.2%', topic: 'Lagos apartment tour' },
      color: '#E1306C',
    },
    {
      platform: 'X (Twitter)', handle: '@aurban_ng', followers: 15200, followersGrowth: '+8.1%',
      engagementRate: '2.3%', postsThisMonth: 45, avgReach: 4200, avgLikes: 89,
      topPost: { type: 'Thread', reach: 28000, engagement: '5.1%', topic: 'How Aurban protects your rent' },
      color: '#1DA1F2',
    },
    {
      platform: 'Facebook', handle: 'AurbanNG', followers: 42100, followersGrowth: '+5.4%',
      engagementRate: '1.9%', postsThisMonth: 18, avgReach: 6800, avgLikes: 156,
      topPost: { type: 'Video', reach: 32000, engagement: '4.3%', topic: '3-bed Lekki walkthrough' },
      color: '#1877F2',
    },
    {
      platform: 'TikTok', handle: '@aurban.ng', followers: 8900, followersGrowth: '+28.5%',
      engagementRate: '7.2%', postsThisMonth: 12, avgReach: 15000, avgLikes: 820,
      topPost: { type: 'Video', reach: 120000, engagement: '12.4%', topic: 'Lekki apartment only 2.5M/yr' },
      color: '#FF004F',
    },
    {
      platform: 'LinkedIn', handle: 'Aurban', followers: 5600, followersGrowth: '+15.2%',
      engagementRate: '3.1%', postsThisMonth: 8, avgReach: 2400, avgLikes: 67,
      topPost: { type: 'Article', reach: 8500, engagement: '5.8%', topic: 'Building Africa\'s trust layer' },
      color: '#0A66C2',
    },
    {
      platform: 'YouTube', handle: 'Aurban Nigeria', followers: 3200, followersGrowth: '+22.1%',
      engagementRate: '5.4%', postsThisMonth: 4, avgReach: 2800, avgLikes: 145,
      topPost: { type: 'Video', reach: 18000, engagement: '7.1%', topic: 'Property buying guide 2026' },
      color: '#FF0000',
    },
  ],
  appStore: {
    ios: { rating: 4.6, reviews: 342, downloads: 28400, downloadsThisMonth: 2140, topReview: 'Best property app in Nigeria. Escrow feature is a game changer.', version: '2.4.1' },
    android: { rating: 4.4, reviews: 1247, downloads: 89200, downloadsThisMonth: 6480, topReview: 'Very reliable. Found my apartment in 2 days. Provider was verified.', version: '2.4.0' },
  },
  brandMentions: {
    total: 284, positive: 218, neutral: 48, negative: 18,
    sentimentScore: 82,
    recentMentions: [
      { source: 'Twitter', text: 'Just used @aurban_ng to find a shortlet in VI. Smooth process!', sentiment: 'positive', date: '2026-02-15' },
      { source: 'Nairaland', text: 'Aurban Pro helped me find a verified plumber. No more scam artisans.', sentiment: 'positive', date: '2026-02-14' },
      { source: 'Instagram', text: 'The app could load faster on my phone though', sentiment: 'negative', date: '2026-02-14' },
      { source: 'TechCabal', text: 'Aurban is one of the most promising proptech startups in Nigeria right now.', sentiment: 'positive', date: '2026-02-13' },
    ],
  },
  lastUpdated: new Date().toISOString(),
};

// ── Mock: Competitor Comparison ──────────────────────────────

const MOCK_COMPETITOR_COMPARISON = {
  competitors: [
    {
      name: 'Aurban', isUs: true,
      estMonthlyVisits: '142K', similarwebRank: '18,450 (NG)',
      socialFollowers: { instagram: 28400, twitter: 15200, facebook: 42100, tiktok: 8900, linkedin: 5600 },
      appRating: { ios: 4.6, android: 4.4 },
      totalListings: 12890, googleSearchVolume: 14500,
      features: { escrow: true, verifiedProviders: true, proServices: true, marketplace: true, mortgage: false, virtualTours: false, aiValuation: false, sharedLiving: true },
    },
    {
      name: 'PropertyPro.ng', isUs: false,
      estMonthlyVisits: '480K', similarwebRank: '4,120 (NG)',
      socialFollowers: { instagram: 12800, twitter: 8900, facebook: 35200, tiktok: 2100, linkedin: 4200 },
      appRating: { ios: 3.9, android: 3.7 },
      totalListings: 45000, googleSearchVolume: 22000,
      features: { escrow: false, verifiedProviders: false, proServices: false, marketplace: false, mortgage: true, virtualTours: true, aiValuation: false, sharedLiving: false },
    },
    {
      name: 'Nigeria Property Centre', isUs: false,
      estMonthlyVisits: '380K', similarwebRank: '5,840 (NG)',
      socialFollowers: { instagram: 5400, twitter: 3200, facebook: 18900, tiktok: 800, linkedin: 2800 },
      appRating: { ios: 3.5, android: 3.3 },
      totalListings: 38000, googleSearchVolume: 18000,
      features: { escrow: false, verifiedProviders: false, proServices: false, marketplace: false, mortgage: false, virtualTours: false, aiValuation: false, sharedLiving: false },
    },
    {
      name: 'Jiji Nigeria', isUs: false,
      estMonthlyVisits: '2.1M', similarwebRank: '245 (NG)',
      socialFollowers: { instagram: 45200, twitter: 22800, facebook: 189000, tiktok: 34000, linkedin: 8400 },
      appRating: { ios: 4.2, android: 4.1 },
      totalListings: 120000, googleSearchVolume: 110000,
      features: { escrow: false, verifiedProviders: false, proServices: false, marketplace: true, mortgage: false, virtualTours: false, aiValuation: false, sharedLiving: false },
    },
    {
      name: 'BuyLetLive', isUs: false,
      estMonthlyVisits: '45K', similarwebRank: '42,800 (NG)',
      socialFollowers: { instagram: 6200, twitter: 2800, facebook: 8400, tiktok: 1200, linkedin: 1800 },
      appRating: { ios: 4.3, android: 4.1 },
      totalListings: 4200, googleSearchVolume: 3800,
      features: { escrow: true, verifiedProviders: true, proServices: false, marketplace: false, mortgage: false, virtualTours: true, aiValuation: false, sharedLiving: false },
    },
  ],
  featureMatrix: [
    { feature: 'Escrow Payment', key: 'escrow' },
    { feature: 'Verified Providers', key: 'verifiedProviders' },
    { feature: 'Professional Services (Pro)', key: 'proServices' },
    { feature: 'Building Materials Marketplace', key: 'marketplace' },
    { feature: 'Mortgage Integration', key: 'mortgage' },
    { feature: 'Virtual Tours / 360', key: 'virtualTours' },
    { feature: 'AI Property Valuation', key: 'aiValuation' },
    { feature: 'Shared Living / Coliving', key: 'sharedLiving' },
  ],
  lastUpdated: new Date().toISOString(),
};

// ── Mock: Global Ranking ─────────────────────────────────────

const MOCK_GLOBAL_RANKING = {
  rankings: {
    globalProptech: { rank: 142, total: 1850, percentile: 'Top 8%', change: +18 },
    africanProptech: { rank: 5, total: 180, percentile: 'Top 3%', change: +2 },
    nigerianProptech: { rank: 3, total: 45, percentile: 'Top 7%', change: 0 },
    westAfricanProptech: { rank: 1, total: 28, percentile: 'Top 4%', change: 0 },
  },
  trustScore: {
    overall: 87,
    breakdown: {
      verificationRate: 92,
      escrowAdoption: 88,
      disputeResolution: 85,
      userSatisfaction: 84,
      dataProtection: 90,
    },
  },
  awards: [
    { title: 'Best Proptech Startup West Africa', org: 'Proptech Africa Awards', year: 2025 },
    { title: 'Most Innovative Real Estate Platform', org: 'TechCabal Future Awards', year: 2025 },
    { title: 'Top 50 African Startups to Watch', org: 'Disrupt Africa', year: 2026 },
  ],
  industryBenchmarks: [
    { metric: 'User Growth Rate', aurban: '+35%', industryAvg: '+12%', status: 'above' },
    { metric: 'Provider Verification Rate', aurban: '76%', industryAvg: '18%', status: 'above' },
    { metric: 'Booking Conversion Rate', aurban: '3.2%', industryAvg: '2.8%', status: 'above' },
    { metric: 'Avg Session Duration', aurban: '5m 12s', industryAvg: '3m 45s', status: 'above' },
    { metric: 'Mobile Traffic Share', aurban: '54%', industryAvg: '68%', status: 'below' },
    { metric: 'Domain Authority', aurban: '34', industryAvg: '45', status: 'below' },
    { metric: 'App Store Rating (Avg)', aurban: '4.5', industryAvg: '4.0', status: 'above' },
    { metric: 'Bounce Rate', aurban: '32%', industryAvg: '38%', status: 'above' },
  ],
  lastUpdated: new Date().toISOString(),
};

// ── Service functions ────────────────────────────────────────

export async function getAurbanWebPresence() {
  try {
    const data = await api.get('/admin/competitive/web-presence');
    return { success: true, ...data };
  } catch {
    return { success: true, ...MOCK_WEB_PRESENCE };
  }
}

export async function getSearchIntelligence() {
  try {
    const data = await api.get('/admin/competitive/search');
    return { success: true, ...data };
  } catch {
    return { success: true, ...MOCK_SEARCH_INTELLIGENCE };
  }
}

export async function getTrafficSources() {
  try {
    const data = await api.get('/admin/competitive/traffic');
    return { success: true, ...data };
  } catch {
    return { success: true, ...MOCK_TRAFFIC_SOURCES };
  }
}

export async function getSocialMediaMetrics() {
  try {
    const data = await api.get('/admin/competitive/social');
    return { success: true, ...data };
  } catch {
    return { success: true, ...MOCK_SOCIAL_METRICS };
  }
}

export async function getCompetitorComparison() {
  try {
    const data = await api.get('/admin/competitive/competitors');
    return { success: true, ...data };
  } catch {
    return { success: true, ...MOCK_COMPETITOR_COMPARISON };
  }
}

export async function getGlobalRanking() {
  try {
    const data = await api.get('/admin/competitive/ranking');
    return { success: true, ...data };
  } catch {
    return { success: true, ...MOCK_GLOBAL_RANKING };
  }
}
