/**
 * TREXIO AI ENGINE - USAGE & COST CONTROL SERVICE
 * Tracks operational AI usage, token consumption, latency, estimated costs, and failure rates.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { MODEL_PRICING } = require('../types');

const DATA_DIR = path.join(__dirname, '..', '..', '..', 'data');
const USAGE_FILE = path.join(DATA_DIR, 'db_ai_usage_logs.json');

class AIUsageService {
  constructor() {
    this.logs = [];
    this.maxLogsInMemory = 2000;
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
      if (fs.existsSync(USAGE_FILE)) {
        const raw = fs.readFileSync(USAGE_FILE, 'utf8');
        const loaded = JSON.parse(raw);
        if (Array.isArray(loaded)) {
          this.logs = loaded;
        }
      }
    } catch (err) {
      console.error('[AIUsageService] Failed to load usage logs from disk:', err.message);
    }
  }

  saveToDisk() {
    try {
      this.ensureDataDir();
      // Keep disk size reasonable (last 2000 logs)
      const dataToSave = this.logs.slice(0, this.maxLogsInMemory);
      fs.writeFileSync(USAGE_FILE, JSON.stringify(dataToSave, null, 2), 'utf8');
    } catch (err) {
      console.error('[AIUsageService] Failed to save usage logs to disk:', err.message);
    }
  }

  /**
   * Calculates estimated cost in USD based on model pricing table.
   */
  calculateCost(model, inputTokens, outputTokens) {
    const pricing = MODEL_PRICING[model] || MODEL_PRICING['gemini-3.6-flash'];
    const inputCost = (inputTokens / 1000) * pricing.inputPer1k;
    const outputCost = (outputTokens / 1000) * pricing.outputPer1k;
    return Number((inputCost + outputCost).toFixed(6));
  }

  /**
   * Records an operational AI request execution.
   */
  recordUsage({
    provider = 'gemini',
    model = 'gemini-3.6-flash',
    feature = 'AI_RECOMMENDATION',
    role = 'user',
    userId = 'anonymous',
    inputTokens = 0,
    outputTokens = 0,
    latencyMs = 0,
    success = true,
    error = null,
  }) {
    const estimatedCostUSD = this.calculateCost(model, inputTokens, outputTokens);

    const logEntry = {
      id: `ai_log_${Date.now()}_${uuidv4().substring(0, 6)}`,
      provider,
      model,
      feature,
      role,
      user_id: userId,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
      estimated_cost_usd: estimatedCostUSD,
      latency_ms: latencyMs,
      success: Boolean(success),
      error: error ? String(error) : null,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(logEntry);
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs.pop();
    }

    this.saveToDisk();
    return logEntry;
  }

  /**
   * Generates summary metrics for Super Admin AI monitoring dashboard.
   */
  getSummary() {
    const totalRequests = this.logs.length;
    let successfulRequests = 0;
    let failedRequests = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUSD = 0;
    let totalLatency = 0;

    const featureBreakdown = {};
    const modelBreakdown = {};

    this.logs.forEach((log) => {
      if (log.success) {
        successfulRequests++;
      } else {
        failedRequests++;
      }

      totalInputTokens += log.input_tokens || 0;
      totalOutputTokens += log.output_tokens || 0;
      totalCostUSD += log.estimated_cost_usd || 0;
      totalLatency += log.latency_ms || 0;

      // Feature breakdown
      const feat = log.feature || 'UNKNOWN';
      if (!featureBreakdown[feat]) {
        featureBreakdown[feat] = { requests: 0, tokens: 0, costUSD: 0 };
      }
      featureBreakdown[feat].requests++;
      featureBreakdown[feat].tokens += log.total_tokens || 0;
      featureBreakdown[feat].costUSD += log.estimated_cost_usd || 0;

      // Model breakdown
      const mod = log.model || 'UNKNOWN';
      if (!modelBreakdown[mod]) {
        modelBreakdown[mod] = { requests: 0, tokens: 0, costUSD: 0 };
      }
      modelBreakdown[mod].requests++;
      modelBreakdown[mod].tokens += log.total_tokens || 0;
      modelBreakdown[mod].costUSD += log.estimated_cost_usd || 0;
    });

    const avgLatencyMs = totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0;
    const successRatePercent = totalRequests > 0 ? Number(((successfulRequests / totalRequests) * 100).toFixed(1)) : 100;

    return {
      total_requests: totalRequests,
      successful_requests: successfulRequests,
      failed_requests: failedRequests,
      success_rate_percent: successRatePercent,
      total_input_tokens: totalInputTokens,
      total_output_tokens: totalOutputTokens,
      total_tokens: totalInputTokens + totalOutputTokens,
      total_cost_usd: Number(totalCostUSD.toFixed(4)),
      total_estimated_cost_usd: Number(totalCostUSD.toFixed(4)),
      avg_latency_ms: avgLatencyMs,
      feature_breakdown: featureBreakdown,
      model_breakdown: modelBreakdown,
    };
  }

  getUsageStats() {
    return this.getSummary();
  }

  getLogs(limit = 100, feature = null) {
    let result = this.logs;
    if (feature) {
      result = result.filter((l) => l.feature === feature);
    }
    return result.slice(0, Math.min(limit, 500));
  }
}

module.exports = new AIUsageService();
