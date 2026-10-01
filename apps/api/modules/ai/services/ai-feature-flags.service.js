/**
 * TREXIO AI ENGINE - FEATURE FLAGS SERVICE
 * Centralized feature controls allowing Super Admin to enable/disable AI capabilities dynamically.
 */

const { loadSingleton, saveSingleton } = require('./aiPostgresPersistence');
const { AI_FEATURE_FLAGS } = require('../types');

class AIFeatureFlagsService {
  constructor() {
    this.flags = {
      [AI_FEATURE_FLAGS.AI_RECOMMENDATION]: true,
      [AI_FEATURE_FLAGS.AI_HOMEPAGE]: true,
      [AI_FEATURE_FLAGS.AI_SEARCH]: true,
      [AI_FEATURE_FLAGS.AI_ASSISTANT]: true,
      [AI_FEATURE_FLAGS.AI_VENDOR_RANKING]: true,
      [AI_FEATURE_FLAGS.AI_SAFETY]: true,
      [AI_FEATURE_FLAGS.AI_FRAUD]: true,
      [AI_FEATURE_FLAGS.AI_ANALYTICS]: true,
    };
    this.ready = this.loadFromPostgres();
  }

  async loadFromPostgres() {
    try {
      const loaded = await loadSingleton('ai_feature_flags');
      if (loaded?.flags) this.flags = { ...this.flags, ...loaded.flags };
    } catch (err) {
      console.error('[AI PostgreSQL persistence] Failed to load ai_feature_flags:', err.message);
    }
  }

  async persistToPostgres() {
    await saveSingleton('ai_feature_flags', { flags: this.flags });
  }


  getFlags() {
    return { ...this.flags };
  }

  isFlagEnabled(flagName) {
    if (this.flags[flagName] === undefined) {
      return true; // Default to enabled if flag is unknown
    }
    return Boolean(this.flags[flagName]);
  }

  isEnabled(flagName) {
    return this.isFlagEnabled(flagName);
  }

  setFlag(flagName, enabled) {
    this.flags[flagName] = Boolean(enabled);
    void this.persistToPostgres();
return this.getFlags();
  }

  updateFlags(updatedFlags) {
    if (updatedFlags && typeof updatedFlags === 'object') {
      Object.keys(updatedFlags).forEach((key) => {
        if (this.flags[key] !== undefined) {
          this.flags[key] = Boolean(updatedFlags[key]);
        }
      });
    void this.persistToPostgres();
}
    return this.getFlags();
  }
}

module.exports = new AIFeatureFlagsService();
