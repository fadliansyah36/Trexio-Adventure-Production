import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { DEFAULT_SEO_CONFIG, getCanonicalUrl } from "@/services/seoService";

/**
 * Centralized SEO component leveraging react-helmet-async
 * Dynamically updates document head metadata, Open Graph attributes, Twitter Card data,
 * canonical links, and optional JSON-LD structured data script.
 */
export default function SEO({
  title,
  description,
  keywords,
  image,
  type = "website",
  author = DEFAULT_SEO_CONFIG.author,
  noindex = false,
  jsonLd = null,
}) {
  const location = useLocation();

  const formattedTitle = title
    ? `${title} | ${DEFAULT_SEO_CONFIG.siteName}`
    : DEFAULT_SEO_CONFIG.defaultTitle;

  const metaDescription = description || DEFAULT_SEO_CONFIG.defaultDescription;
  const metaKeywords = keywords || DEFAULT_SEO_CONFIG.defaultKeywords;
  
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const canonicalUrl = getCanonicalUrl(location.pathname);
  
  const metaImage = image
    ? (image.startsWith("http") ? image : `${origin}${image}`)
    : `${origin}${DEFAULT_SEO_CONFIG.defaultImage}`;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{formattedTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"} />

      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook / WhatsApp */}
      <meta property="og:site_name" content={DEFAULT_SEO_CONFIG.siteName} />
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image" content={metaImage} />
      <meta property="og:locale" content={DEFAULT_SEO_CONFIG.locale} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={DEFAULT_SEO_CONFIG.twitterHandle} />
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={metaImage} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
