import React from "react";
import ReactDOM from "react-dom";

/**
 * Automated Accessibility (WCAG 2.1 AA) Audit Service for Trexio Marketplace
 * Evaluates DOM structure during development and logs actionable accessibility
 * violations (contrast, ARIA roles, label association, keyboard navigation)
 * directly to the developer console.
 */

let isA11yAuditInitialized = false;

export function initAccessibilityAudits() {
  if (isA11yAuditInitialized || typeof window === "undefined") {
    return;
  }

  // Only activate automated axe-core audits in non-production environments
  if (process.env.NODE_ENV !== "production") {
    import("@axe-core/react")
      .then((axe) => {
        axe.default(React, ReactDOM, 1000);
        isA11yAuditInitialized = true;
        console.log("[A11y Audit] @axe-core/react automated WCAG accessibility auditor active.");
      })
      .catch((err) => {
        console.warn("[A11y Audit] Failed to load @axe-core/react:", err?.message || err);
      });
  }
}
