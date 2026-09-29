/**
 * Centralized SEO Service for Trexio Marketplace
 * Manages SEO defaults, dynamic metadata construction, Open Graph & Twitter data formatting,
 * and JSON-LD Structured Data generation for search engines.
 */

export const DEFAULT_SEO_CONFIG = {
  siteName: "TREXIO",
  defaultTitle: "TREXIO — Marketplace Open Trip & Outdoor Gear Indonesia",
  titleTemplate: "%s | TREXIO Outdoor Marketplace",
  defaultDescription:
    "TREXIO adalah platform marketplace open trip, sewa alat outdoor, dan komunitas petualang alam terbuka di Indonesia. Rencanakan dan temukan perjalanan impian Anda!",
  defaultKeywords:
    "open trip, pendakian gunung, sewa alat outdoor, perlengkapan camping, trip murah, outdoor indonesia, trexio, hiking indonesia, basecamp",
  defaultImage: "/icon-512.png",
  twitterHandle: "@trexio_id",
  locale: "id_ID",
  author: "TREXIO Outdoor Indonesia",
};

/**
 * Builds full canonical URL
 */
export function getCanonicalUrl(path = "") {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${cleanPath}`;
}

/**
 * Generates JSON-LD Schema for Organization
 */
export function generateOrganizationSchema() {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://trexio.id";
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: DEFAULT_SEO_CONFIG.siteName,
    url: baseUrl,
    logo: `${baseUrl}/icon-512.png`,
    description: DEFAULT_SEO_CONFIG.defaultDescription,
    sameAs: [
      "https://instagram.com/trexio.id",
      "https://facebook.com/trexio.id",
    ],
  };
}

/**
 * Generates JSON-LD Schema for Open Trip / Event Product
 */
export function generateProductTripSchema(trip) {
  if (!trip) return null;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://trexio.id";
  const url = `${baseUrl}/trip/${trip.id}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: trip.title,
    image: trip.cover_image || trip.gallery?.[0] || `${baseUrl}/icon-512.png`,
    description: trip.description || `Paket Open Trip ${trip.title} di ${trip.destination || "Indonesia"}.`,
    brand: {
      "@type": "Brand",
      name: trip.organizer_name || "TREXIO Partner",
    },
    offers: {
      "@type": "Offer",
      url: url,
      priceCurrency: "IDR",
      price: trip.price || 0,
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability: trip.quota && trip.booked_count && trip.booked_count >= trip.quota 
        ? "https://schema.org/OutOfStock" 
        : "https://schema.org/InStock",
    },
  };
}

/**
 * Generates JSON-LD Schema for Rental Outdoor Gear
 */
export function generateRentalGearSchema(rental) {
  if (!rental) return null;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://trexio.id";
  const url = `${baseUrl}/rental/${rental.id}`;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `Sewa ${rental.title}`,
    image: rental.image || rental.cover_image || `${baseUrl}/icon-512.png`,
    description: rental.description || `Sewa peralatan camping ${rental.title} berkualita di Trexio.`,
    category: rental.category || "Outdoor Gear Rental",
    offers: {
      "@type": "Offer",
      url: url,
      priceCurrency: "IDR",
      price: rental.price_per_day || rental.price || 0,
      unitText: "DAY",
      availability: "https://schema.org/InStock",
    },
  };
}

/**
 * Generates JSON-LD Schema for Blog / Article
 */
export function generateArticleSchema(article) {
  if (!article) return null;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://trexio.id";

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    image: article.cover_image || `${baseUrl}/icon-512.png`,
    author: {
      "@type": "Person",
      name: article.author || "Tim Trexio",
    },
    publisher: {
      "@type": "Organization",
      name: DEFAULT_SEO_CONFIG.siteName,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/icon-512.png`,
      },
    },
    description: article.excerpt || article.summary || "",
  };
}
