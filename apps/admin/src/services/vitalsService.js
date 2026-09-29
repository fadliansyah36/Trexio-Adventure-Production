import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import { captureWebVitalMetric, initPostHog } from "./analyticsService";

/**
 * Performance Monitoring Utility for Trexio Marketplace
 * Listens to browser performance entries (CLS, FCP, INP, LCP, TTFB)
 * and streams metrics directly to PostHog Analytics.
 */

let isMonitoringActive = false;

/**
 * Initializes Core Web Vitals monitoring listener
 */
export function initPerformanceMonitoring(customHandler = captureWebVitalMetric) {
  if (isMonitoringActive || typeof window === "undefined") {
    return;
  }

  // Ensure PostHog is initialized
  initPostHog();

  try {
    // 1. Largest Contentful Paint (LCP) - Main loading performance
    onLCP((metric) => customHandler(metric));

    // 2. Cumulative Layout Shift (CLS) - Visual stability
    onCLS((metric) => customHandler(metric));

    // 3. Interaction to Next Paint (INP) - Responsiveness
    onINP((metric) => customHandler(metric));

    // 4. First Contentful Paint (FCP) - Initial render speed
    onFCP((metric) => customHandler(metric));

    // 5. Time to First Byte (TTFB) - Server response time
    onTTFB((metric) => customHandler(metric));

    isMonitoringActive = true;

    if (process.env.NODE_ENV !== "production") {
      console.log("[Performance Monitoring] Core Web Vitals listeners active.");
    }
  } catch (err) {
    console.warn("[Performance Monitoring] Web Vitals initialization error:", err?.message || err);
  }
}

/**
 * Helper component or hook to track performance in React components
 */
export function usePerformanceTracker() {
  return {
    init: initPerformanceMonitoring,
    logCustomMetric: (name, value) => {
      captureWebVitalMetric({
        name,
        value,
        id: `custom_${Date.now()}`,
        delta: value,
        navigationType: "custom",
      });
    },
  };
}
