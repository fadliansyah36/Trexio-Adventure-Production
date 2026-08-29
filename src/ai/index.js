/**
 * TREXIO AI ENGINE - CENTRAL MODULE EXPORTS
 */

const { AI_FEATURE_FLAGS, AI_EVENT_TYPES, AI_MODELS, MODEL_PRICING } = require('./types');
const GeminiProvider = require('./providers/gemini-provider');
const aiFeatureFlagsService = require('./services/ai-feature-flags.service');
const aiUsageService = require('./services/ai-usage.service');
const aiEventService = require('./services/ai-event.service');
const aiSecurityService = require('./services/ai-security.service');
const aiDataService = require('./services/ai-data.service');
const aiOrchestratorService = require('./services/ai-orchestrator.service');
const aiAdventureIntelligenceService = require('./services/ai-adventure-intelligence.service');
const aiSuperAdminCommandCenterService = require('./services/ai-super-admin-command-center.service');
const aiRiskEngineService = require('./services/ai-risk-engine.service');
const aiGrowthIntelligenceService = require('./services/ai-growth-intelligence.service');
const aiEvaluationService = require('./services/ai-evaluation.service');
const createAIRoutes = require('./routes/ai.routes');

module.exports = {
  AI_FEATURE_FLAGS,
  AI_EVENT_TYPES,
  AI_MODELS,
  MODEL_PRICING,
  GeminiProvider,
  aiFeatureFlagsService,
  aiUsageService,
  aiEventService,
  aiSecurityService,
  aiDataService,
  aiOrchestratorService,
  aiAdventureIntelligenceService,
  aiSuperAdminCommandCenterService,
  aiRiskEngineService,
  aiGrowthIntelligenceService,
  aiEvaluationService,
  createAIRoutes,
};
