import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Aurban';
const SITE_URL  = 'https://aurban.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const TWITTER_HANDLE = '@aurban';

/**
 * PageSEO — Per-page head tag injection via react-helmet-async.
 *
 * Usage:
 *   <PageSEO
 *     title="3-Bed Apartment in Lekki — Aurban"
 *     description="Spacious 3-bedroom apartment in Lekki Phase 1 from ₦500,000/month."
 *     image="https://cdn.example.com/property/abc.jpg"
 *     url="/property/abc"
 *     type="article"           // default: "website"
 *     noIndex                  // pass to block indexing (dashboard, provider pages)
 *   />
 */
export default function PageSEO({
  title,
  description,
  image,
  url,
  type = 'website',
  noIndex = false,
  structuredData,
}) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Africa's Real Estate Ecosystem`;
  const pageDesc  = description || `Africa's complete real estate ecosystem. Rent, buy, sell, hire services and shop real estate materials across Nigeria.`;
  const pageImage = image || DEFAULT_IMAGE;
  const pageUrl   = url ? `${SITE_URL}${url}` : SITE_URL;

  return (
    <Helmet>
      {/* Core */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDesc} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={pageUrl} />

      {/* Open Graph */}
      <meta property="og:title"       content={pageTitle} />
      <meta property="og:description" content={pageDesc} />
      <meta property="og:image"       content={pageImage} />
      <meta property="og:url"         content={pageUrl} />
      <meta property="og:type"        content={type} />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:locale"      content="en_NG" />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:site"        content={TWITTER_HANDLE} />
      <meta name="twitter:title"       content={pageTitle} />
      <meta name="twitter:description" content={pageDesc} />
      <meta name="twitter:image"       content={pageImage} />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}
