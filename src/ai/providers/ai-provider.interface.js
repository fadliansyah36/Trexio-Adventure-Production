/**
 * TREXIO AI ENGINE - ABSTRACT PROVIDER INTERFACE
 * Abstraction layer decoupling Trexio business logic from specific AI providers.
 */

class AIProviderInterface {
  constructor(name) {
    this.name = name;
  }

  /**
   * Generates text given a prompt and options.
   * @param {string} prompt 
   * @param {Object} options { systemInstruction, temperature, timeoutMs, maxTokens }
   * @returns {Promise<{ text: string, inputTokens: number, outputTokens: number, latencyMs: number, provider: string, model: string }>}
   */
  async generateText(prompt, options = {}) {
    throw new Error(`generateText() not implemented in provider ${this.name}`);
  }

  /**
   * Generates structured JSON given a prompt, schema, and options.
   * @param {string} prompt 
   * @param {Object} schema 
   * @param {Object} options 
   * @returns {Promise<{ data: any, rawText: string, inputTokens: number, outputTokens: number, latencyMs: number, provider: string, model: string }>}
   */
  async generateStructured(prompt, schema, options = {}) {
    throw new Error(`generateStructured() not implemented in provider ${this.name}`);
  }

  /**
   * Performs health check on the provider connection.
   * @returns {Promise<{ isHealthy: boolean, provider: string, latencyMs: number, error?: string }>}
   */
  async healthCheck() {
    throw new Error(`healthCheck() not implemented in provider ${this.name}`);
  }
}

module.exports = AIProviderInterface;
