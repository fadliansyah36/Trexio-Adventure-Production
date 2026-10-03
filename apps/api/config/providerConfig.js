/**
 * Trexio provider configuration policy — 10P.8.
 *
 * Required providers fail closed in production.
 * Optional providers expose an explicit unavailable/configuration state;
 * they must never be represented as operational when credentials are absent.
 */

const REQUIRED_PRODUCTION = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
];

const OPTIONAL_PROVIDER_PAIRS = {
  midtrans: ['MIDTRANS_SERVER_KEY', 'MIDTRANS_CLIENT_KEY'],
  gemini: ['GEMINI_API_KEY'],
};

const PLACEHOLDER_PATTERNS = [
  /<[^>]+>/,
  /^(demo|test|placeholder|changeme|replace[-_]?me)$/i,
  /your[-_ ]?(api|secret|key|password)/i,
];

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function isMeaningfulSecret(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  return !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value.trim()));
}

function getProviderStatus() {
  const midtransPresent = OPTIONAL_PROVIDER_PAIRS.midtrans.map((name) => isMeaningfulSecret(process.env[name]));
  const geminiPresent = OPTIONAL_PROVIDER_PAIRS.gemini.map((name) => isMeaningfulSecret(process.env[name]));

  return {
    database: {
      required: true,
      configured: isMeaningfulSecret(process.env.DATABASE_URL),
      fail_closed: true,
    },
    auth: {
      required: true,
      configured:
        isMeaningfulSecret(process.env.SUPABASE_URL) &&
        isMeaningfulSecret(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
        isMeaningfulSecret(process.env.SUPABASE_ANON_KEY),
      fail_closed: true,
    },
    jwt: {
      required: true,
      configured: isMeaningfulSecret(process.env.JWT_SECRET) && process.env.JWT_SECRET.length >= 32,
      fail_closed: true,
    },
    midtrans: {
      required: false,
      configured: midtransPresent.every(Boolean),
      partial: midtransPresent.some(Boolean) && !midtransPresent.every(Boolean),
      fail_closed: true,
    },
    gemini: {
      required: false,
      configured: geminiPresent.every(Boolean),
      partial: false,
      fail_closed: true,
    },
  };
}

function getMissingProductionRequirements() {
  return REQUIRED_PRODUCTION.filter((name) => {
    const value = process.env[name];
    if (name === 'JWT_SECRET') {
      return !isMeaningfulSecret(value) || value.length < 32;
    }
    return !isMeaningfulSecret(value);
  });
}

function assertProductionConfiguration() {
  if (!isProduction()) return { ok: true, mode: 'development' };

  const missing = getMissingProductionRequirements();
  const providers = getProviderStatus();

  if (providers.midtrans.partial) {
    missing.push('MIDTRANS_SERVER_KEY + MIDTRANS_CLIENT_KEY (complete pair)');
  }

  if (missing.length > 0) {
    const error = new Error(
      `Production provider configuration is incomplete: ${Array.from(new Set(missing)).join(', ')}`
    );
    error.code = 'PROVIDER_CONFIGURATION_REQUIRED';
    error.providers = providers;
    throw error;
  }

  return { ok: true, mode: 'production', providers };
}

function requireProvider(providerName) {
  const providers = getProviderStatus();
  const provider = providers[providerName];

  if (!provider) {
    const error = new Error(`Unknown provider: ${providerName}`);
    error.code = 'UNKNOWN_PROVIDER';
    throw error;
  }

  if (!provider.configured) {
    const error = new Error(`Provider "${providerName}" is not configured`);
    error.code = 'PROVIDER_CONFIGURATION_REQUIRED';
    error.provider = providerName;
    throw error;
  }

  return provider;
}

module.exports = {
  REQUIRED_PRODUCTION,
  isProduction,
  isMeaningfulSecret,
  getProviderStatus,
  getMissingProductionRequirements,
  assertProductionConfiguration,
  requireProvider,
};
