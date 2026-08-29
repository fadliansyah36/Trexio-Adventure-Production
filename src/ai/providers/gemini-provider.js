/**
 * TREXIO AI ENGINE - GEMINI PROVIDER IMPLEMENTATION
 * Uses @google/genai TypeScript/JS SDK with server-side API key handling,
 * timeout controls, retries, and User-Agent telemetry headers.
 */

const { GoogleGenAI } = require('@google/genai');
const AIProviderInterface = require('./ai-provider.interface');
const { AI_MODELS } = require('../types');

class GeminiProvider extends AIProviderInterface {
  constructor() {
    super('gemini');
    this.defaultModel = process.env.AI_MODEL || AI_MODELS.GEMINI_FLASH;
    this.defaultTimeoutMs = parseInt(process.env.AI_TIMEOUT || '12000', 10);
    this.aiClient = null;
  }

  /**
   * Lazy initialization of GoogleGenAI client to prevent module-load crashes if API key is not yet set.
   */
  getClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    if (!this.aiClient) {
      this.aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this.aiClient;
  }

  /**
   * Helper to execute an async function with timeout and retries.
   */
  async _executeWithRetryAndTimeout(fn, timeoutMs = this.defaultTimeoutMs, maxRetries = 2) {
    let lastErr;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let timerId;
      try {
        const timeoutPromise = new Promise((_, reject) => {
          timerId = setTimeout(() => reject(new Error(`AI Request timed out after ${timeoutMs}ms`)), timeoutMs);
        });
        const result = await Promise.race([fn(), timeoutPromise]);
        if (timerId) clearTimeout(timerId);
        return result;
      } catch (err) {
        if (timerId) clearTimeout(timerId);
        lastErr = err;
        // Don't retry if missing API key, auth error, rate limited, or timed out
        if (err.message && (err.message.includes('GEMINI_API_KEY') || err.message.includes('timed out') || err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED'))) {
          throw err;
        }
        if (attempt < maxRetries) {
          // Exponential backoff delay (200ms, 400ms)
          await new Promise((res) => setTimeout(res, 200 * Math.pow(2, attempt)));
        }
      }
    }
    throw lastErr;
  }

  async generateText(prompt, options = {}) {
    const startTime = Date.now();
    const primaryModel = options.model || this.defaultModel;
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
    const candidateModels = Array.from(new Set([
      primaryModel,
      AI_MODELS.GEMINI_LITE || 'gemini-3.1-flash-lite',
      AI_MODELS.GEMINI_FLASH || 'gemini-3.6-flash',
    ]));

    const ai = this.getClient();
    let result = null;
    let usedModel = primaryModel;
    let lastError = null;

    for (const m of candidateModels) {
      try {
        result = await this._executeWithRetryAndTimeout(async () => {
          const config = {};
          if (options.systemInstruction) {
            config.systemInstruction = options.systemInstruction;
          }
          if (typeof options.temperature === 'number') {
            config.temperature = options.temperature;
          }

          const response = await ai.models.generateContent({
            model: m,
            contents: prompt,
            config,
          });

          return response;
        }, timeoutMs);

        usedModel = m;
        break; // Success!
      } catch (err) {
        lastError = err;
        const isQuotaErr = err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED'));
        if (!isQuotaErr) {
          throw err; // Non-quota error, throw immediately
        }
        // If quota error, loop to next fallback candidate model
      }
    }

    if (!result) {
      throw lastError || new Error('All model candidates exhausted due to quota/rate limits');
    }

    const latencyMs = Date.now() - startTime;
    const text = result.text || '';

    // Estimate token counts based on response metadata or string heuristic (approx 4 chars/token)
    const inputTokens = Math.ceil((prompt.length + (options.systemInstruction?.length || 0)) / 4);
    const outputTokens = Math.ceil(text.length / 4);

    return {
      text,
      inputTokens,
      outputTokens,
      latencyMs,
      provider: this.name,
      model: usedModel,
    };
  }

  async generateStructured(prompt, schema, options = {}) {
    const startTime = Date.now();
    const primaryModel = options.model || this.defaultModel;
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
    const candidateModels = Array.from(new Set([
      primaryModel,
      AI_MODELS.GEMINI_LITE || 'gemini-3.1-flash-lite',
      AI_MODELS.GEMINI_FLASH || 'gemini-3.6-flash',
    ]));

    const ai = this.getClient();
    let result = null;
    let usedModel = primaryModel;
    let lastError = null;

    for (const m of candidateModels) {
      try {
        result = await this._executeWithRetryAndTimeout(async () => {
          const config = {
            responseMimeType: 'application/json',
          };
          if (schema) {
            config.responseSchema = schema;
          }
          if (options.systemInstruction) {
            config.systemInstruction = options.systemInstruction;
          }

          const response = await ai.models.generateContent({
            model: m,
            contents: prompt,
            config,
          });

          return response;
        }, timeoutMs);

        usedModel = m;
        break; // Success!
      } catch (err) {
        lastError = err;
        const isQuotaErr = err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED'));
        if (!isQuotaErr) {
          throw err; // Non-quota error, throw immediately
        }
        // If quota error, loop to next fallback candidate model
      }
    }

    if (!result) {
      throw lastError || new Error('All model candidates exhausted due to quota/rate limits');
    }

    const latencyMs = Date.now() - startTime;
    const rawText = result.text || '{}';
    let data = {};

    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.warn('[GeminiProvider] Structured JSON parse failed, returning raw text fallback:', parseErr.message);
      data = { rawText };
    }

    const inputTokens = Math.ceil((prompt.length + (options.systemInstruction?.length || 0)) / 4);
    const outputTokens = Math.ceil(rawText.length / 4);

    return {
      data,
      rawText,
      inputTokens,
      outputTokens,
      latencyMs,
      provider: this.name,
      model: usedModel,
    };
  }

  async healthCheck() {
    const startTime = Date.now();
    try {
      if (!process.env.GEMINI_API_KEY) {
        return {
          isHealthy: false,
          provider: this.name,
          latencyMs: 0,
          error: 'GEMINI_API_KEY is not set in environment variables',
        };
      }

      const ai = this.getClient();
      await ai.models.generateContent({
        model: this.defaultModel,
        contents: 'ping',
      });

      return {
        isHealthy: true,
        provider: this.name,
        latencyMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        isHealthy: false,
        provider: this.name,
        latencyMs: Date.now() - startTime,
        error: err.message,
      };
    }
  }
}

module.exports = GeminiProvider;
