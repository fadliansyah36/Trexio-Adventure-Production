/**
 * TREXIO AI ENGINE - FEATURE FLAGS SERVICE
 * Centralized feature controls allowing Super Admin to enable/disable AI capabilities dynamically.
 */

const fs = require('fs');
const path = require('path');
const { AI_FEATURE_FLAGS } = require('../types');

const DATA_DIR = path.join(__dirname, '..', '..', '..', 'data');
const FLAGS_FILE = path.join(DATA_DIR, 'db_ai_feature_flags.json');

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
    this.loadFromDisk();
  }

  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  loadFromDisk() {
    try {
      this.ensureDataDir();
      if (fs.existsSync(FLAGS_FILE)) {
        const raw = fs.readFileSync(FLAGS_FILE, 'utf8');
        const loaded = JSON.parse(raw);
        if (loaded && typeof loaded === 'object') {
          this.flags = { ...this.flags, ...loaded };
        }
      } else {
        this.saveToDisk();
      }
    } catch (err) {
      console.error('[AIFeatureFlagsService] Failed to load feature flags from disk:', err.message);
    }
  }

  saveToDisk() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(FLAGS_FILE, JSON.stringify(this.flags, null, 2), 'utf8');
    } catch (err) {
      console.error('[AIFeatureFlagsService] Failed to save feature flags to disk:', err.message);
    }
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
    this.saveToDisk();
    return this.getFlags();
  }

  updateFlags(updatedFlags) {
    if (updatedFlags && typeof updatedFlags === 'object') {
      Object.keys(updatedFlags).forEach((key) => {
        if (this.flags[key] !== undefined) {
          this.flags[key] = Boolean(updatedFlags[key]);
        }
      });
      this.saveToDisk();
    }
    return this.getFlags();
  }
}

module.exports = new AIFeatureFlagsService();
