import posthog from "posthog-js";

/**
 * PostHog Analytics Service for Trexio Marketplace
 * Handles analytics initialization, pageview tracking, and Core Web Vitals metric logging.
 */

let isPostHogInitialized = false;

export const POSTHOG_CONFIG = {
  apiKey: process.env.REACT_APP_POSTHOG_KEY || "",
  apiHost: process.env.REACT_APP_POSTHOG_HOST || "https://us.i.posthog.com",
};

/**
 * Initializes PostHog client with safety checks
 */
export function initPostHog() {
  if (isPostHogInitialized || typeof window === "undefined") {
    return posthog;
  }

  // [SECURITY] No hardcoded fallback key. Skip init when key is not provided via env.
  if (!POSTHOG_CONFIG.apiKey) {
    return posthog;
  }

  try {
    posthog.init(POSTHOG_CONFIG.apiKey, {
      api_host: POSTHOG_CONFIG.apiHost,
      loaded: (ph) => {
        if (process.env.NODE_ENV !== "production") {
          console.log("[Analytics] PostHog initialized successfully for marketplace monitoring.");
        }
      },
      autocapture: true,
      capture_pageview: false, // We handle pageviews manually or via router
      capture_pageleave: true,
      disable_session_recording: false,
      persistence: "localStorage",
    });

    isPostHogInitialized = true;
  } catch (err) {
    console.warn("[Analytics] PostHog initialization warning:", err?.message || err);
  }

  return posthog;
}

/**
 * Captures custom event in PostHog
 */
export function captureEvent(eventName, properties = {}) {
  try {
    if (!isPostHogInitialized) {
      initPostHog();
    }
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      pathname: window.location.pathname,
    });
  } catch (err) {
    console.warn(`[Analytics] Failed to capture event "${eventName}":`, err?.message || err);
  }
}

/**
 * Captures pageview event
 */
export function capturePageView(pathName) {
  captureEvent("$pageview", {
    $current_url: window.location.href,
    path: pathName || window.location.pathname,
  });
}

/**
 * Logs Service Worker lifecycle events (registration success, failure, updates) to PostHog
 */
export function captureServiceWorkerEvent(eventType, details = {}) {
  const payload = {
    sw_event: eventType, // 'registration_success', 'registration_failure', 'update_detected', 'update_installed', 'version_updated'
    scope: details.scope || "/",
    version: details.version || null,
    error_message: details.error ? (details.error?.message || String(details.error)) : null,
    ...details,
  };

  captureEvent("service_worker_lifecycle", payload);

  if (process.env.NODE_ENV !== "production") {
    console.info(`[ServiceWorker Analytics] ${eventType}:`, payload);
  }
}

/**
 * Evaluates Core Web Vital rating based on Google thresholds
 */
export function getVitalRating(name, value) {
  switch (name) {
    case "LCP":
      return value <= 2500 ? "good" : value <= 4000 ? "needs-improvement" : "poor";
    case "FID":
      return value <= 100 ? "good" : value <= 300 ? "needs-improvement" : "poor";
    case "INP":
      return value <= 200 ? "good" : value <= 500 ? "needs-improvement" : "poor";
    case "CLS":
      return value <= 0.1 ? "good" : value <= 0.25 ? "needs-improvement" : "poor";
    case "FCP":
      return value <= 1800 ? "good" : value <= 3000 ? "needs-improvement" : "poor";
    case "TTFB":
      return value <= 800 ? "good" : value <= 1800 ? "needs-improvement" : "poor";
    default:
      return "unknown";
  }
}

/**
 * Logs Core Web Vitals metric to PostHog Analytics
 */
export function captureWebVitalMetric(metric) {
  const { name, value, id, delta, navigationType } = metric;
  const rating = getVitalRating(name, value);

  // Format value for readability
  const formattedValue = name === "CLS" ? Math.round(value * 1000) / 1000 : Math.round(value);

  const payload = {
    metric_name: name,
    metric_value: formattedValue,
    metric_rating: rating,
    metric_id: id,
    metric_delta: delta,
    navigation_type: navigationType || "navigate",
    page_url: window.location.href,
    pathname: window.location.pathname,
  };

  // Capture to PostHog under '$web_vitals' and 'core_web_vital'
  captureEvent("core_web_vital", payload);

  if (process.env.NODE_ENV !== "production") {
    console.info(`[Core Web Vital] ${name}: ${formattedValue}${name === "CLS" ? "" : "ms"} (${rating})`, payload);
  }
}
