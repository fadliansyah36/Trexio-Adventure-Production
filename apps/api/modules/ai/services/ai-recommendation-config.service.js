/**
 * TREXIO AI ENGINE - RECOMMENDATION CONFIGURATION SERVICE
 * Centralized configurable recommendation weights and diversity constraints.
 * Allows Super Admin to tune recommendation strategy without code changes.
 */

const { loadSingleton, saveSingleton } = require('./aiPostgresPersistence');

const DEFAULT_CONFIG = {
  weights: {
    preference_match: 25,
    destination_match: 20,
    category_match: 15,
    rating_quality: 15,
    booking_popularity: 15,
    recency_boost: 10,
    vendor_quality: 10,
    cancellation_penalty: 15,
    cold_start_boost: 15,
  },
  diversity: {
    max_items_per_vendor: 2,
    enable_vendor_diversity: true,
    enable_category_diversity: true,
  },
  sponsored_isolation: {
    isolate_paid_ads: true,
    max_sponsored_slots: 2,
  },
  last_updated: new Date().toISOString(),
  updated_by: 'system',
};

class AIRecommendationConfigService {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.ready = this.loadFromPostgres();
  }

  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  loadFromDisk() {
    try {
      this.ensureDataDir();
      if (fs.existsSync(CONFIG_FILE)) {
        const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
        const loaded = JSON.parse(raw);
        if (loaded && typeof loaded === 'object') {
          this.config = {
            weights: { ...DEFAULT_CONFIG.weights, ...loaded.weights },
            diversity: { ...DEFAULT_CONFIG.diversity, ...loaded.diversity },
            sponsored_isolation: { ...DEFAULT_CONFIG.sponsored_isolation, ...loaded.sponsored_isolation },
            last_updated: loaded.last_updated || new Date().toISOString(),
            updated_by: loaded.updated_by || 'system',
          };
        }
      } else {
        this.saveToDisk();
      }
    } catch (err) {
      console.error('[AIRecommendationConfigService] Failed to load config from disk:', err.message);
    }
  }

  saveToDisk() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf8');
    } catch (err) {
      console.error('[AIRecommendationConfigService] Failed to save config to disk:', err.message);
    }
  }

  getConfig() {
    return JSON.parse(JSON.stringify(this.config));
  }

  updateConfig(updatedConfig, userEmail = 'admin@trexio.id') {
    if (updatedConfig.weights) {
      Object.keys(updatedConfig.weights).forEach((k) => {
        const val = Number(updatedConfig.weights[k]);
        if (!isNaN(val)) {
          this.config.weights[k] = Math.max(0, Math.min(100, val));
        }
      });
    }

    if (updatedConfig.diversity) {
      if (typeof updatedConfig.diversity.max_items_per_vendor === 'number') {
        this.config.diversity.max_items_per_vendor = Math.max(1, Math.min(10, updatedConfig.diversity.max_items_per_vendor));
      }
      if (typeof updatedConfig.diversity.enable_vendor_diversity === 'boolean') {
        this.config.diversity.enable_vendor_diversity = updatedConfig.diversity.enable_vendor_diversity;
      }
      if (typeof updatedConfig.diversity.enable_category_diversity === 'boolean') {
        this.config.diversity.enable_category_diversity = updatedConfig.diversity.enable_category_diversity;
      }
    }

    this.config.last_updated = new Date().toISOString();
    this.config.updated_by = userEmail;
    this.saveToDisk();

    return this.getConfig();
  }
}

module.exports = new AIRecommendationConfigService();
