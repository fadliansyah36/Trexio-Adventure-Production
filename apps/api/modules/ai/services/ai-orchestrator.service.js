/**
 * TREXIO AI ENGINE - CENTRAL AI ORCHESTRATOR
 * Coordinates Feature Flags, Security/Privacy Filtering, AI Provider Execution,
 * Usage/Cost Tracking, and Automatic Deterministic Fallbacks.
 */

const GeminiProvider = require('../providers/gemini-provider');
const aiFeatureFlagsService = require('./ai-feature-flags.service');
const aiUsageService = require('./ai-usage.service');
const aiSecurityService = require('./ai-security.service');
const aiDataService = require('./ai-data.service');
const aiEvaluationService = require('./ai-evaluation.service');

class AIOrchestratorService {
  constructor() {
    this.provider = new GeminiProvider();
  }

  /**
   * Main entry point for executing AI tasks cleanly and securely.
   * @param {Object} params { feature, user, prompt, systemInstruction, schema, fallbackFn, model, temperature, groundTruthData }
   * @returns {Promise<{ success: boolean, data: any, isFallback: boolean, usage: any, traceId?: string, error?: string }>}
   */
  async execute({
    feature,
    user = null,
    prompt,
    systemInstruction = null,
    schema = null,
    fallbackFn = null,
    model = null,
    temperature = 0.7,
    timeoutMs = null,
    groundTruthData = null,
  }) {
    const userId = user?.id || 'anonymous';
    const userRole = user?.role || 'user';

    // 1. RBAC Verification
    const rbac = aiSecurityService.validateRBAC(userRole, feature);
    if (!rbac.allowed) {
      if (fallbackFn) {
        const fallbackData = await Promise.resolve(fallbackFn());
        return { success: true, data: fallbackData, isFallback: true, reason: rbac.reason };
      }
      return { success: false, error: rbac.reason, isFallback: false };
    }

    // 2. Feature Flag Check
    const flagEnabled = aiFeatureFlagsService.isFlagEnabled(feature);
    if (!flagEnabled) {
      console.warn(`[AIOrchestrator] Feature flag '${feature}' is disabled. Executing deterministic fallback.`);
      if (fallbackFn) {
        const fallbackData = await Promise.resolve(fallbackFn());
        return {
          success: true,
          data: fallbackData,
          isFallback: true,
          reason: `Feature flag '${feature}' is currently disabled by Super Admin`,
        };
      }
      return {
        success: false,
        error: `Feature flag '${feature}' is currently disabled`,
        isFallback: false,
      };
    }

    // 3. Privacy & Security Input Sanitization
    const sanitizedPrompt = aiSecurityService.sanitizeInput(prompt);
    const sanitizedInstruction = systemInstruction ? aiSecurityService.sanitizeInput(systemInstruction) : null;

    // 4. Provider Execution & Usage Tracking
    try {
      let response;
      if (schema) {
        response = await this.provider.generateStructured(sanitizedPrompt, schema, {
          model,
          temperature,
          timeoutMs,
          systemInstruction: sanitizedInstruction,
        });
      } else {
        response = await this.provider.generateText(sanitizedPrompt, {
          model,
          temperature,
          timeoutMs,
          systemInstruction: sanitizedInstruction,
        });
      }

      // Grounding Verification
      const outputText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data || response.text);
      const groundingInfo = aiEvaluationService.verifyGrounding(
        outputText,
        groundTruthData || {},
        { isSafety: feature === 'AI_SAFETY', isFinancial: feature === 'AI_ANALYTICS' || feature === 'AI_VENDOR_COPILOT' }
      );

      // Record Trace
      const trace = aiEvaluationService.recordTrace({
        feature,
        phase: 14,
        model: response.model,
        promptVersion: '1.0',
        userRole,
        userId,
        query: sanitizedPrompt,
        response: outputText,
        latencyMs: response.latencyMs,
        tokens: { input: response.inputTokens, output: response.outputTokens },
        success: true,
        groundingInfo,
      });

      // Record successful usage
      const usageLog = aiUsageService.recordUsage({
        provider: response.provider,
        model: response.model,
        feature,
        role: userRole,
        userId,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
        latencyMs: response.latencyMs,
        success: true,
      });

      return {
        success: true,
        data: schema ? response.data : response.text,
        isFallback: false,
        traceId: trace.trace_id,
        groundingStatus: groundingInfo.grounding_status,
        usage: {
          totalTokens: response.inputTokens + response.outputTokens,
          estimatedCostUSD: usageLog.estimated_cost_usd,
          latencyMs: response.latencyMs,
        },
      };
    } catch (err) {
      const isQuotaErr = err.message && (err.message.includes('429') || err.message.includes('quota') || err.message.includes('RESOURCE_EXHAUSTED'));

      if (isQuotaErr) {
        console.info(`[AIOrchestrator] Quota rate limit notice for '${feature}'. Executing deterministic fallback.`);
      } else {
        console.info(`[AIOrchestrator] AI Execution notice for feature '${feature}':`, err.message);
      }

      // Record failed usage & trace log
      aiUsageService.recordUsage({
        provider: 'gemini',
        model: model || 'gemini-3.6-flash',
        feature,
        role: userRole,
        userId,
        inputTokens: Math.ceil((sanitizedPrompt?.length || 0) / 4),
        outputTokens: 0,
        latencyMs: 0,
        success: false,
        error: err.message,
      });

      aiEvaluationService.recordTrace({
        feature,
        phase: 14,
        model: model || 'gemini-3.6-flash',
        userRole,
        userId,
        query: sanitizedPrompt,
        response: '',
        latencyMs: 0,
        tokens: { input: Math.ceil((sanitizedPrompt?.length || 0) / 4), output: 0 },
        success: false,
        error: err.message,
      });

      // 5. Graceful Fallback Execution on AI Provider Failure
      if (fallbackFn) {
        if (!isQuotaErr) {
          console.info(`[AIOrchestrator] Provider fallback active. Returning graceful deterministic fallback.`);
        }
        try {
          const fallbackData = await Promise.resolve(fallbackFn());
          return {
            success: true,
            data: fallbackData,
            isFallback: true,
            reason: isQuotaErr
              ? `AI provider rate limited. Served deterministic fallback cleanly.`
              : `AI provider error: ${err.message}`,
          };
        } catch (fallbackErr) {
          return { success: false, error: `AI Error: ${err.message}. Fallback Error: ${fallbackErr.message}`, isFallback: true };
        }
      }

      return { success: false, error: err.message, isFallback: false };
    }
  }

  /**
   * Health check for Trexio AI Orchestrator & Provider.
   */
  async getHealth() {
    const providerHealth = await this.provider.healthCheck();
    const flags = aiFeatureFlagsService.getFlags();
    const usageSummary = aiUsageService.getSummary();

    return {
      status: providerHealth.isHealthy ? 'operational' : 'degraded',
      provider: providerHealth.provider,
      provider_health: providerHealth,
      feature_flags: flags,
      usage_summary: usageSummary,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new AIOrchestratorService();
