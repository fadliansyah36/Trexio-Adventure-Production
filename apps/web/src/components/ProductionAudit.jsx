import React, { useEffect } from 'react';
import { runProductionAudit } from '@/utils/productionAudit';

/**
 * Common dummy / test identifiers to scan for in local storage and session storage
 */
const DUMMY_IDENTIFIERS = [
  'test_user',
  'mock_id',
  'test_token',
  'mock_user',
  'test_account',
  'dummy',
  'mock_data',
  'demo_user',
  'sample_id',
  'test_id',
  'mock_session'
];

/**
 * Helper to determine if the app is running in production mode
 */
export function isProductionMode() {
  if (typeof window === 'undefined') return false;

  const isNodeEnvProd = process.env.NODE_ENV === 'production';
  const isReactEnvProd = process.env.REACT_APP_ENV === 'production';
  
  const hostname = window.location.hostname || '';
  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]' ||
    hostname.endsWith('.local');

  return isNodeEnvProd || isReactEnvProd || (!isLocalhost && !hostname.includes('ais-dev-'));
}

/**
 * Audit function to scan and clean storage for dummy identifiers
 */
export function scanAndCleanStorage() {
  const clearedItems = [];
  let totalScanned = 0;

  if (typeof window === 'undefined') {
    return { clearedItems, totalScanned, isProd: false };
  }

  const isProd = isProductionMode();

  const auditStorage = (storage, storageType) => {
    try {
      const keysToRemove = [];
      const keyCount = storage.length;
      totalScanned += keyCount;

      for (let i = 0; i < keyCount; i++) {
        const key = storage.key(i);
        if (!key) continue;

        const rawValue = storage.getItem(key) || '';
        const lowerKey = key.toLowerCase();
        const lowerValue = rawValue.toLowerCase();

        const matchesDummyKey = DUMMY_IDENTIFIERS.some((identifier) => lowerKey.includes(identifier));
        const matchesDummyValue = DUMMY_IDENTIFIERS.some((identifier) => lowerValue.includes(identifier));

        if (matchesDummyKey || matchesDummyValue) {
          keysToRemove.push(key);
        }
      }

      if (isProd) {
        keysToRemove.forEach((key) => {
          storage.removeItem(key);
          clearedItems.push(`${storageType}:${key}`);
        });
      }
    } catch (err) {
      console.warn(`[ProductionAudit] Could not scan ${storageType}:`, err);
    }
  };

  if (window.localStorage) {
    auditStorage(window.localStorage, 'localStorage');
  }

  if (window.sessionStorage) {
    auditStorage(window.sessionStorage, 'sessionStorage');
  }

  return { clearedItems, totalScanned, isProd };
}

/**
 * ProductionAudit Component
 * Runs on application initialization to scan local storage and state for
 * common dummy identifiers (e.g., 'test_user', 'mock_id') and clears them
 * if production mode is detected.
 */
export const ProductionAudit = () => {
  useEffect(() => {
    const { clearedItems, totalScanned, isProd } = scanAndCleanStorage();

    if (isProd) {
      if (clearedItems.length > 0) {
        console.warn(
          `[ProductionAudit] Production mode detected. Cleared ${clearedItems.length} dummy item(s) from storage:`,
          clearedItems
        );
      } else {
        console.info(
          `[ProductionAudit] Production storage audit clean (${totalScanned} storage keys inspected, 0 dummy items found).`
        );
      }
    } else {
      console.info(
        `[ProductionAudit] Development mode active. Storage scan completed (${totalScanned} storage keys inspected).`
      );
    }

    // Also trigger backend user audit helper if available
    if (typeof runProductionAudit === 'function') {
      runProductionAudit().catch((err) => {
        console.warn('[ProductionAudit] Backend production audit check:', err);
      });
    }
  }, []);

  return null;
};

export default ProductionAudit;
