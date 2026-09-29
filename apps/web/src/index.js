import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import "@/index.css";
import App from "@/App";
import ErrorBoundary from "@/components/site/ErrorBoundary";
import { initPerformanceMonitoring } from "@/services/vitalsService";
import { captureServiceWorkerEvent } from "@/services/analyticsService";
import { initAccessibilityAudits } from "@/services/a11yService";

// Initialize Core Web Vitals monitoring, PostHog Analytics, & WCAG Accessibility Audit
initPerformanceMonitoring();
initAccessibilityAudits();

// Detect non-secure HTTP connection in production and enforce HTTPS
if (
  typeof window !== "undefined" &&
  window.location.protocol === "http:" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1"
) {
  window.location.href = window.location.href.replace("http:", "https:");
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

// Register service worker (PWA) with automatic versioning update detector & PostHog telemetry
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        captureServiceWorkerEvent("registration_success", { scope: registration.scope });

        // Detect SW updates
        registration.addEventListener("updatefound", () => {
          captureServiceWorkerEvent("update_detected", { scope: registration.scope });
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                console.log("[PWA] New version installed. Activating skipWaiting...");
                captureServiceWorkerEvent("update_installed", { scope: registration.scope });
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn("SW registration failed:", err);
        captureServiceWorkerEvent("registration_failure", { error: err });
      });

    // Listen for version update broadcast from ServiceWorker
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "SW_VERSION_UPDATED") {
        console.log(`[PWA] App updated to version ${event.data.version}. Refreshing UI cache...`);
        captureServiceWorkerEvent("version_updated", { version: event.data.version });
      }
    });
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
