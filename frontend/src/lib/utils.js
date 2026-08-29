import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Validates and sanitizes internal navigation paths to prevent arbitrary external redirects.
 */
export function sanitizeInternalUrl(path) {
  if (!path || typeof path !== "string") return "/explore";
  const trimmed = path.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("//") || trimmed.startsWith("javascript:")) {
    return "/explore";
  }
  // Auto-fix legacy plural routes from older backend APIs
  if (trimmed.startsWith("/trips/")) return trimmed.replace("/trips/", "/trip/");
  if (trimmed.startsWith("/rentals/")) return trimmed.replace("/rentals/", "/rental/");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/**
 * Builds the canonical Trexio product URL for trips, rentals, vendors, or destinations.
 */
export function buildProductUrl(product) {
  if (!product) return "/explore";

  const rawPath = product.detailPath || product.action_url || product.detail_url;
  if (rawPath && typeof rawPath === "string" && !rawPath.includes("cat_")) {
    const sanitized = sanitizeInternalUrl(rawPath);
    if (sanitized.startsWith("/trip/") || sanitized.startsWith("/rental/") || sanitized.startsWith("/vendor/") || sanitized.startsWith("/destination/") || sanitized.startsWith("/backpacker")) {
      return sanitized;
    }
  }

  const idOrSlug = product.slug || product.id || product.trip_id;
  const type = (product.type || "").toLowerCase();
  const cat = (product.category || "").toLowerCase();

  const isVendor = type === "vendor" || product.vendor_slug;
  if (isVendor && product.vendor_slug) {
    return `/vendor/${product.vendor_slug}`;
  }

  const isRental =
    type === "rental" ||
    cat.includes("rental") ||
    cat.includes("sewa") ||
    cat.includes("gear") ||
    Boolean(product.price_per_day);

  if (isRental) {
    return idOrSlug ? `/rental/${idOrSlug}` : "/rental";
  }

  if (idOrSlug && !String(idOrSlug).startsWith("cat_")) {
    return `/trip/${idOrSlug}`;
  }

  return "/explore";
}

