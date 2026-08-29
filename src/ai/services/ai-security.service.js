/**
 * TREXIO AI ENGINE - SECURITY & PRIVACY SERVICE
 * Enforces input/output validation, prompt injection defenses, and strict data minimization.
 * Ensures passwords, JWT secrets, API keys, payment PINs, and card info are NEVER sent to AI providers.
 */

class AISecurityService {
  constructor() {
    this.maxPromptLength = 12000; // max characters allowed per prompt
    this.sensitivePatterns = [
      /password["']?\s*:\s*["']?[^"'\s,]+/gi,
      /secret["']?\s*:\s*["']?[^"'\s,]+/gi,
      /token["']?\s*:\s*["']?[^"'\s,]+/gi,
      /pin["']?\s*:\s*["']?[^"'\s,]+/gi,
      /bearer\s+[a-zA-Z0-9\._\-]+/gi,
      /eyJ[a-zA-Z0-9_\-]*\.[a-zA-Z0-9_\-]*\.[a-zA-Z0-9_\-]*/g, // JWT token regex
      /midtrans[a-zA-Z0-9_\-]*key[a-zA-Z0-9_\-]*/gi,
      /4[0-9]{12}(?:[0-9]{3})?/g, // Credit card Visa pattern
      /5[1-5][0-9]{14}/g, // Credit card Mastercard pattern
    ];

    this.injectionPatterns = [
      /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
      /disregard\s+all\s+system\s+prompts/gi,
      /you\s+are\s+now\s+DAN/gi,
      /system\s+override\s*:/gi,
      /jailbreak/gi,
    ];
  }

  /**
   * Validates user prompt for prompt injection or unsafe content.
   * @param {string} prompt
   * @returns {{ valid: boolean, reason?: string }}
   */
  validatePrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      return { valid: false, reason: 'Prompt kosong atau format tidak valid' };
    }

    if (prompt.length > this.maxPromptLength) {
      return { valid: false, reason: 'Panjang pesan melebihi batas keamanan' };
    }

    // Check for severe prompt injection attempts
    const hasInjection = this.injectionPatterns.some((pattern) => pattern.test(prompt));
    if (hasInjection) {
      return { valid: false, reason: 'Terdeteksi percobaan peretasan instruksi (prompt injection)' };
    }

    return { valid: true };
  }

  /**
   * Sanitizes input strings or objects by scrubbing sensitive credentials and PII.
   * @param {any} input 
   * @returns {any}
   */
  sanitizeInput(input) {
    if (!input) return input;

    if (typeof input === 'string') {
      let cleaned = input;
      // Truncate if exceeds max length
      if (cleaned.length > this.maxPromptLength) {
        cleaned = cleaned.substring(0, this.maxPromptLength) + '\n[TRUNCATED_FOR_SAFETY]';
      }

      // Scrub sensitive patterns
      this.sensitivePatterns.forEach((pattern) => {
        cleaned = cleaned.replace(pattern, '[REDACTED_SENSITIVE_CREDENTIAL]');
      });

      // Defuse prompt injection attempts
      this.injectionPatterns.forEach((pattern) => {
        cleaned = cleaned.replace(pattern, '[NEUTRALIZED_INJECTION_ATTEMPT]');
      });

      return cleaned;
    }

    if (typeof input === 'object' && !Array.isArray(input)) {
      const sanitizedObj = {};
      Object.keys(input).forEach((key) => {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('password') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('token') ||
          lowerKey.includes('pin') ||
          lowerKey.includes('card') ||
          lowerKey.includes('cvv') ||
          lowerKey.includes('midtrans')
        ) {
          sanitizedObj[key] = '[REDACTED]';
        } else {
          sanitizedObj[key] = this.sanitizeInput(input[key]);
        }
      });
      return sanitizedObj;
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitizeInput(item));
    }

    return input;
  }

  /**
   * Validates if a user role is permitted for a specific AI capability.
   */
  validateRBAC(userRole, feature) {
    const role = (userRole || 'guest').toLowerCase();

    // Super Admin has global access
    if (role === 'super_admin' || role === 'admin') {
      return { allowed: true };
    }

    // Vendor has access to own vendor business AI
    if (role === 'vendor') {
      const allowedVendorFeatures = [
        'AI_RECOMMENDATION',
        'AI_HOMEPAGE',
        'AI_SEARCH',
        'AI_VENDOR_RANKING',
        'AI_ANALYTICS',
      ];
      if (allowedVendorFeatures.includes(feature)) {
        return { allowed: true };
      }
    }

    // Traveler / User access
    if (role === 'user' || role === 'guest') {
      const allowedUserFeatures = [
        'AI_RECOMMENDATION',
        'AI_HOMEPAGE',
        'AI_SEARCH',
        'AI_ASSISTANT',
      ];
      if (allowedUserFeatures.includes(feature)) {
        return { allowed: true };
      }
    }

    return { allowed: false, reason: `Role '${userRole}' is not authorized for feature '${feature}'` };
  }
}

module.exports = new AISecurityService();
