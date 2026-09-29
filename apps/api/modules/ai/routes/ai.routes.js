/**
 * TREXIO AI ENGINE - EXPRESS ROUTER
 * Defines secure backend API routes for AI events, recommendations, user profile signals,
 * and Super Admin AI control panels.
 */

const express = require('express');
const { AI_FEATURE_FLAGS, AI_EVENT_TYPES, Type } = require('../types');
const aiOrchestratorService = require('../services/ai-orchestrator.service');
const aiFeatureFlagsService = require('../services/ai-feature-flags.service');
const aiUsageService = require('../services/ai-usage.service');
const aiEventService = require('../services/ai-event.service');
const aiDataService = require('../services/ai-data.service');
const aiRecommendationEngineService = require('../services/ai-recommendation-engine.service');
const aiRecommendationConfigService = require('../services/ai-recommendation-config.service');
const aiHomepageRankingService = require('../services/ai-homepage-ranking.service');
const aiAssistantService = require('../services/ai-assistant.service');
const aiAdventureIntelligenceService = require('../services/ai-adventure-intelligence.service');
const aiVendorCopilotService = require('../services/ai-vendor-copilot.service');
const aiSuperAdminCommandCenterService = require('../services/ai-super-admin-command-center.service');
const aiRiskEngineService = require('../services/ai-risk-engine.service');
const aiGrowthIntelligenceService = require('../services/ai-growth-intelligence.service');
const aiEvaluationService = require('../services/ai-evaluation.service');

function createAIRoutes(dbStores, middlewares = {}) {
  const router = express.Router();
  const { authenticateToken = (req, res, next) => next(), requireSuperAdmin = (req, res, next) => next() } = middlewares;

  // [C-6] Rate limiters to prevent unauthenticated abuse / runaway LLM cost.
  const rateLimit = require('express-rate-limit');
  const aiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: 'Terlalu banyak permintaan AI. Coba lagi sebentar.' },
  });
  const aiChatLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: 'Batas percakapan AI tercapai. Coba lagi beberapa menit.' },
  });

  const getTrips = () => dbStores.trips || [];
  const getRentals = () => dbStores.rentals || [];
  const getVendors = () => dbStores.vendors || [];
  const getUsers = () => dbStores.users || [];
  const getReviews = () => dbStores.reviews || [];
  const getBookings = () => dbStores.bookings || [];
  const getWishlists = () => dbStores.wishlists || [];

  // ==========================================
  // PUBLIC / USER AI API ROUTES
  // ==========================================

  /**
   * POST /api/ai/events
   * Capture client-side activity event for personalization signals
   */
  router.post('/events', (req, res) => {
    try {
      const { event_type, product_id, vendor_id, category_id, destination, search_query, metadata } = req.body;
      const userId = req.user?.id || 'guest';

      const event = aiEventService.recordEvent({
        userId,
        eventType: event_type,
        productId: product_id,
        vendorId: vendor_id,
        categoryId: category_id,
        destination,
        searchQuery: search_query,
        metadata,
      });

      res.json({ ok: true, event });
    } catch (err) {
      res.status(400).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/recommendations/for-you
   * Multi-stage personalized recommendation engine feed
   */
  router.get('/recommendations/for-you', aiLimiter, async (req, res) => {
    try {
      const { category, destination, limit = 6 } = req.query;
      const user = req.user || null;
      const isEnabled = aiFeatureFlagsService.isEnabled(AI_FEATURE_FLAGS.AI_RECOMMENDATION);

      const trips = getTrips();
      const rentals = getRentals();
      const vendors = getVendors();
      const reviews = getReviews();
      const bookings = getBookings();
      const wishlists = getWishlists();

      let recommendations = [];

      if (isEnabled) {
        recommendations = await aiRecommendationEngineService.getPersonalizedRecommendations({
          user,
          category,
          destination,
          limit: parseInt(limit, 10),
          trips,
          rentals,
          vendors,
          reviews,
          bookings,
          wishlists,
        });
      } else {
        // Fallback: Deterministic active products
        const fallbackList = aiDataService.getDeterministicRecommendations(trips, rentals, reviews, bookings, {
          category,
          destination,
          limit: parseInt(limit, 10),
        });
        recommendations = fallbackList.map((p) => ({
          ...p,
          recommendation_score: 50,
          ai_reason: `Rekomendasi populer di ${p.destination || 'Trexio Marketplace'}`,
        }));
      }

      // Record recommendation impression in event system for feedback loop
      if (recommendations.length > 0) {
        try {
          aiEventService.recordEvent({
            userId: user?.id || 'guest',
            eventType: AI_EVENT_TYPES.RECOMMENDATION_IMPRESSION,
            metadata: {
              count: recommendations.length,
              product_ids: recommendations.map((r) => r.id),
            },
          });
        } catch (e) {
          // ignore tracking error
        }
      }

      res.json({
        ok: true,
        recommendations,
        isFallback: !isEnabled,
        count: recommendations.length,
      });
    } catch (err) {
      console.error('[AIRoutes] Personalized recommendation error:', err.message);
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/recommendations/similar/:productId
   * Similar products recommendation endpoint
   */
  router.get('/recommendations/similar/:productId', async (req, res) => {
    try {
      const { productId } = req.params;
      const { limit = 4 } = req.query;

      const similar = await aiRecommendationEngineService.getSimilarProducts(productId, {
        trips: getTrips(),
        rentals: getRentals(),
        reviews: getReviews(),
        bookings: getBookings(),
        vendors: getVendors(),
        limit: parseInt(limit, 10),
      });

      res.json({ ok: true, recommendations: similar });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/recommendations/cross-category/:productId
   * Cross-category contextual recommendation endpoint
   */
  router.get('/recommendations/cross-category/:productId', async (req, res) => {
    try {
      const { productId } = req.params;
      const { limit = 4 } = req.query;

      const crossRecs = await aiRecommendationEngineService.getCrossCategoryRecommendations(productId, {
        trips: getTrips(),
        rentals: getRentals(),
        reviews: getReviews(),
        bookings: getBookings(),
        vendors: getVendors(),
        limit: parseInt(limit, 10),
      });

      res.json({ ok: true, recommendations: crossRecs });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/recommendations
   * Legacy alias endpoint mapping to for-you for backward compatibility
   */
  router.get('/recommendations', aiLimiter, async (req, res) => {
    try {
      const { category, destination, limit = 6 } = req.query;
      const user = req.user || null;

      const recommendations = await aiRecommendationEngineService.getPersonalizedRecommendations({
        user,
        category,
        destination,
        limit: parseInt(limit, 10),
        trips: getTrips(),
        rentals: getRentals(),
        vendors: getVendors(),
        reviews: getReviews(),
        bookings: getBookings(),
        wishlists: getWishlists(),
      });

      res.json({
        ok: true,
        recommendations,
        isFallback: false,
        count: recommendations.length,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/profile
   * Returns current user's sanitized AI profile signals
   */
  router.get('/profile', authenticateToken, (req, res) => {
    try {
      const user = req.user;
      const bookings = getBookings().filter((b) => b.user_id === user.id || b.user_email === user.email);
      const wishlists = getWishlists().filter((w) => w.user_id === user.id);
      const events = aiEventService.getUserEvents(user.id, 50);

      const signals = aiDataService.buildUserProfileSignals(user, bookings, wishlists, events);
      res.json({ ok: true, profile: signals });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * POST /api/ai/orchestrate
   * Secure endpoint to run orchestrated AI tasks (e.g., smart search assistant)
   */
  router.post('/orchestrate', authenticateToken, aiChatLimiter, async (req, res) => {
    try {
      const { feature = AI_FEATURE_FLAGS.AI_ASSISTANT, prompt, systemInstruction } = req.body;
      const user = req.user || null;

      if (!prompt) {
        return res.status(400).json({ ok: false, error: 'Prompt parameter is required' });
      }

      const result = await aiOrchestratorService.execute({
        feature,
        user,
        prompt,
        systemInstruction,
        fallbackFn: () => ({
          message: 'Asisten AI Trexio saat ini menggunakan mode standar. Silakan cari trip atau perlengkapan langsung dari menu utama.',
        }),
      });

      res.json({ ok: true, result });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * POST /api/ai/assistant/chat
   * Main Conversational AI Assistant Chat Endpoint
   */
  router.post('/assistant/chat', authenticateToken, aiChatLimiter, async (req, res) => {
    try {
      const { message, sessionId = `sess_${Date.now()}` } = req.body;
      const user = req.user || null;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ ok: false, error: 'Pesan user wajib diisi.' });
      }

      const isEnabled = aiFeatureFlagsService.isEnabled(AI_FEATURE_FLAGS.AI_ASSISTANT);

      // Process message using Assistant Service with real DB Stores
      const assistantResult = await aiAssistantService.processUserMessage({
        userMessage: message.trim(),
        sessionId,
        user,
        dbStores,
      });

      // Record event log
      try {
        aiEventService.recordEvent({
          userId: user?.id || 'guest',
          eventType: 'AI_ASSISTANT_CHAT',
          searchQuery: message.trim(),
          metadata: {
            intent: assistantResult.intent,
            products_returned: assistantResult.products.length,
          },
        });
      } catch (e) {
        // ignore tracking
      }

      res.json({
        ok: true,
        answer: assistantResult.answer,
        products: assistantResult.products,
        intent: assistantResult.intent,
        extractedParams: assistantResult.extractedParams,
        suggestedPrompts: assistantResult.suggestedPrompts,
        sessionId: assistantResult.sessionId,
        isFallback: !isEnabled,
      });
    } catch (err) {
      console.error('[AIRoutes] Assistant Chat Error:', err.message);
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * DELETE /api/ai/assistant/chat/:sessionId
   * Clears conversation history for the given session ID
   */
  router.delete('/assistant/chat/:sessionId', (req, res) => {
    try {
      const { sessionId } = req.params;
      const cleared = aiAssistantService.clearMemory(sessionId);
      res.json({ ok: true, cleared, message: 'Riwayat obrolan AI berhasil direset.' });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/assistant/prompts
   * Retrieves recommended default prompts for user discovery
   */
  router.get('/assistant/prompts', (req, res) => {
    try {
      const prompts = aiAssistantService.getDefaultSuggestedPrompts();
      res.json({ ok: true, prompts });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  // ==========================================
  // PHASE 8 — VENDOR AI BUSINESS COPILOT API ROUTES
  // ==========================================

  /**
   * GET /api/ai/vendor/copilot/overview
   * Full Real-time Analytics & Intelligence Dashboard for Authorized Vendor
   */
  router.get('/vendor/copilot/overview', authenticateToken, (req, res) => {
    try {
      const user = req.user;
      const { period = '30d', vendor_id } = req.query;

      const copilotData = aiVendorCopilotService.getVendorDashboardCopilotData({
        user,
        requestedVendorId: vendor_id,
        period,
        dbStores,
      });

      if (!copilotData.ok) {
        return res.status(403).json(copilotData);
      }

      res.json(copilotData);
    } catch (err) {
      console.error('[AIRoutes] Vendor Copilot Overview error:', err.message);
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * POST /api/ai/vendor/copilot/chat
   * Natural Language Conversational Business Copilot for Authorized Vendor
   */
  router.post('/vendor/copilot/chat', authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      const { message, sessionId, period = '30d', vendor_id } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ ok: false, error: 'Pesan vendor wajib diisi.' });
      }

      const result = await aiVendorCopilotService.processVendorCopilotChat({
        user,
        message: message.trim(),
        sessionId,
        period,
        requestedVendorId: vendor_id,
        dbStores,
      });

      res.json({ ok: true, ...result });
    } catch (err) {
      console.error('[AIRoutes] Vendor Copilot Chat error:', err.message);
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * POST /api/ai/vendor/copilot/listing-assistant
   * AI Listing Assistant for drafting title, description, highlights, itinerary & SEO
   */
  router.post('/vendor/copilot/listing-assistant', authenticateToken, async (req, res) => {
    try {
      const user = req.user;
      const productInput = req.body || {};

      const draftResult = await aiVendorCopilotService.generateProductListingDraft({
        user,
        productInput,
        dbStores,
      });

      res.json(draftResult);
    } catch (err) {
      console.error('[AIRoutes] Listing Assistant error:', err.message);
      res.status(400).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  // ==========================================
  // SUPER ADMIN AI CONTROL API ROUTES
  // ==========================================

  /**
   * GET /api/super/ai/overview
   * Super Admin dashboard overview for AI Status, Health, Feature Flags, and Usage Summary
   */
  router.get('/super/overview', requireSuperAdmin, async (req, res) => {
    try {
      const health = await aiOrchestratorService.getHealth();
      const eventStats = aiEventService.getStats();

      res.json({
        ok: true,
        overview: {
          ...health,
          event_stats: eventStats,
        },
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/super/ai/flags
   * Get all central AI feature flags
   */
  router.get('/super/flags', requireSuperAdmin, (req, res) => {
    try {
      const flags = aiFeatureFlagsService.getFlags();
      res.json({ ok: true, flags });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * PATCH /api/super/ai/flags
   * Toggle feature flags in real-time
   */
  router.patch('/super/flags', requireSuperAdmin, (req, res) => {
    try {
      const updated = aiFeatureFlagsService.updateFlags(req.body);
      res.json({ ok: true, flags: updated, message: 'Fitur AI berhasil diperbarui.' });
    } catch (err) {
      res.status(400).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/super/ai/usage
   * Retrieve operational usage & cost monitoring logs
   */
  router.get('/super/usage', requireSuperAdmin, (req, res) => {
    try {
      const { limit = 100, feature } = req.query;
      const summary = aiUsageService.getSummary();
      const logs = aiUsageService.getLogs(parseInt(limit, 10), feature);

      res.json({ ok: true, summary, logs });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/super/ai/logs
   * Retrieve operational audit and event logs
   */
  router.get('/super/logs', requireSuperAdmin, (req, res) => {
    try {
      const { limit = 100, type } = req.query;
      const recentEvents = aiEventService.getRecentEvents(parseInt(limit, 10), type);
      res.json({ ok: true, logs: recentEvents });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/super/ai/recommendations/config
   * Get recommendation engine scoring weights & diversity rules
   */
  router.get('/super/recommendations/config', requireSuperAdmin, (req, res) => {
    try {
      const config = aiRecommendationConfigService.getConfig();
      res.json({ ok: true, config });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * PATCH /api/super/ai/recommendations/config
   * Update recommendation engine scoring weights & diversity rules
   */
  router.patch('/super/recommendations/config', requireSuperAdmin, (req, res) => {
    try {
      const updatedConfig = aiRecommendationConfigService.updateConfig(req.body, req.user?.email || 'admin@trexio.id');
      res.json({ ok: true, config: updatedConfig, message: 'Bobot dan aturan Rekomendasi AI berhasil diperbarui!' });
    } catch (err) {
      res.status(400).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/homepage/ranked
   * Retrieves Phase 3 dynamic section-specific ranked marketplace sections
   */
  router.get('/homepage/ranked', async (req, res) => {
    try {
      const user = req.user || null;
      const isEnabled = aiFeatureFlagsService.isEnabled(AI_FEATURE_FLAGS.AI_HOMEPAGE);

      if (!isEnabled) {
        // Fallback to basic unranked listings if flag disabled
        return res.json({
          ok: true,
          isFallback: true,
          sections: {
            recommended_for_you: [],
            best_trips: getTrips().slice(0, 6),
            high_demand: getTrips().slice(0, 6),
            popular_open_trips: getTrips().slice(0, 6),
            outdoor_rental: getRentals().slice(0, 6),
          },
        });
      }

      const rankedSections = await aiHomepageRankingService.getRankedHomepageSections({
        trips: getTrips(),
        rentals: getRentals(),
        vendors: getVendors(),
        reviews: getReviews(),
        bookings: getBookings(),
        wishlists: getWishlists(),
        user,
      });

      res.json({
        ok: true,
        isFallback: false,
        sections: rankedSections,
      });
    } catch (err) {
      console.error('[AIRoutes] Homepage ranking error:', err.message);
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/super/ai/homepage/config
   * Get Phase 3 homepage ranking weights & manual curations
   */
  router.get('/super/homepage/config', requireSuperAdmin, (req, res) => {
    try {
      const config = aiHomepageRankingService.getConfig();
      res.json({ ok: true, config });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * PATCH /api/super/ai/homepage/config
   * Update Phase 3 homepage ranking weights & manual curations
   */
  router.patch('/super/homepage/config', requireSuperAdmin, (req, res) => {
    try {
      const updatedConfig = aiHomepageRankingService.updateConfig(req.body, req.user?.email || 'admin@trexio.id');
      res.json({ ok: true, config: updatedConfig, message: 'Konfigurasi Perangkingan Beranda AI berhasil disimpan!' });
    } catch (err) {
      res.status(400).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  // ==========================================
  // PHASE 7 — AI SAFETY & ADVENTURE INTELLIGENCE ENDPOINTS
  // ==========================================

  /**
   * GET /api/ai/safety/weather
   * Retrieve live weather forecast for mountain/destination
   */
  router.get('/safety/weather', async (req, res) => {
    try {
      const { destination } = req.query;
      const weather = await aiAdventureIntelligenceService.getWeatherForDestination(destination || 'dest_prau');
      res.json({ ok: true, weather });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/safety/destination/:destinationIdOrSlug
   * Destination Intelligence: Master location + Trail statuses + Official Alerts
   */
  router.get('/safety/destination/:destinationIdOrSlug', (req, res) => {
    try {
      const intel = aiAdventureIntelligenceService.getDestinationIntelligence(req.params.destinationIdOrSlug, dbStores);
      if (!intel) {
        return res.status(404).json({ ok: false, error: 'Destinasi tidak ditemukan dalam database master.' });
      }
      res.json({ ok: true, intelligence: intel });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/safety/trail-status
   * Get verified trail statuses
   */
  router.get('/safety/trail-status', (req, res) => {
    try {
      const { destination } = req.query;
      const trailStatuses = aiAdventureIntelligenceService.getTrailStatuses(destination);
      res.json({ ok: true, trail_statuses: trailStatuses });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/safety/official-alerts
   * Get official alerts (BMKG, TN, BASARNAS)
   */
  router.get('/safety/official-alerts', (req, res) => {
    try {
      const { destination } = req.query;
      const alerts = aiAdventureIntelligenceService.getOfficialAlerts(destination);
      res.json({ ok: true, official_alerts: alerts });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * POST /api/ai/safety/readiness
   * Evaluate Trip Readiness based on equipment, weather, route, and user experience
   */
  router.post('/safety/readiness', authenticateToken, aiChatLimiter, async (req, res) => {
    try {
      const readiness = await aiAdventureIntelligenceService.evaluateTripReadiness(req.body, dbStores);
      res.json({ ok: true, readiness });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * POST /api/ai/safety/checklist
   * Generate contextual equipment checklist
   */
  router.post('/safety/checklist', (req, res) => {
    try {
      const checklist = aiAdventureIntelligenceService.generateEquipmentChecklist(req.body);
      res.json({ ok: true, checklist });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/safety/checklist
   * Get saved user checklist
   */
  router.get('/safety/checklist', (req, res) => {
    try {
      const userId = req.user?.id || req.query.user_id || 'guest';
      const checklist = aiAdventureIntelligenceService.getUserChecklist(userId, req.query.trip_id);
      res.json({ ok: true, checklist });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * POST /api/ai/safety/checklist/save
   * Save user equipment checklist state
   */
  router.post('/safety/checklist/save', (req, res) => {
    try {
      const userId = req.user?.id || req.body.user_id || 'guest';
      const saved = aiAdventureIntelligenceService.saveUserChecklist(userId, req.body);
      res.json({ ok: true, checklist: saved });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/safety/emergency
   * Get verified emergency contacts and protocols
   */
  router.get('/safety/emergency', (req, res) => {
    try {
      const emergency = aiAdventureIntelligenceService.getEmergencyAssistanceInfo(req.query.destination);
      res.json({ ok: true, emergency });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/super/ai/safety/overview
   * Super Admin Safety Center Overview
   */
  router.get('/super/safety/overview', requireSuperAdmin, (req, res) => {
    try {
      const overview = aiAdventureIntelligenceService.getOverview(dbStores);
      res.json({ ok: true, overview });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/super/ai/vendor-copilot/stats
   * Super Admin AI Vendor Business Copilot Monitoring & Adoption Stats
   */
  router.get('/super/vendor-copilot/stats', requireSuperAdmin, (req, res) => {
    try {
      const stats = aiVendorCopilotService.getSuperAdminVendorCopilotStats(dbStores);
      res.json({ ok: true, stats });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * PATCH /api/super/ai/safety/trail-status
   * Update or create trail status
   */
  router.patch('/super/safety/trail-status', requireSuperAdmin, (req, res) => {
    try {
      const updated = aiAdventureIntelligenceService.updateTrailStatus(req.body);
      res.json({ ok: true, trail_status: updated, message: 'Status jalur pendakian berhasil diperbarui!' });
    } catch (err) {
      res.status(400).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * POST /api/super/ai/safety/official-alerts
   * Create official safety alert
   */
  router.post('/super/safety/official-alerts', requireSuperAdmin, (req, res) => {
    try {
      const alert = aiAdventureIntelligenceService.addOfficialAlert(req.body);
      res.json({ ok: true, official_alert: alert, message: 'Peringatan resmi berhasil diterbitkan!' });
    } catch (err) {
      res.status(400).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * DELETE /api/super/ai/safety/official-alerts/:id
   * Delete official alert
   */
  router.delete('/super/safety/official-alerts/:id', requireSuperAdmin, (req, res) => {
    try {
      aiAdventureIntelligenceService.deleteOfficialAlert(req.params.id);
      res.json({ ok: true, message: 'Peringatan resmi telah dihapus.' });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  // ==========================================
  // PHASE 10 - AI SUPER ADMIN COMMAND CENTER
  // ==========================================

  /**
   * GET /api/ai/super/command-center/overview
   */
  router.get('/super/command-center/overview', requireSuperAdmin, (req, res) => {
    try {
      const { period = '30d', start_date, end_date } = req.query;
      const overview = aiSuperAdminCommandCenterService.calculateExecutiveOverview(dbStores, period, {
        start_date,
        end_date,
      });
      res.json({ ok: true, ...overview });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * POST /api/ai/super/command-center/ask
   */
  router.post('/super/command-center/ask', requireSuperAdmin, async (req, res) => {
    try {
      const { query = '', period = '30d' } = req.body;
      if (!query || !query.trim()) {
        return res.status(400).json({ ok: false, error: 'Pertanyaan tidak boleh kosong.' });
      }
      const response = await aiSuperAdminCommandCenterService.askTrexioAI(dbStores, query.trim(), period);
      res.json({ ok: true, ...response });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/command-center/supply-demand
   */
  router.get('/super/command-center/supply-demand', requireSuperAdmin, (req, res) => {
    try {
      const data = aiSuperAdminCommandCenterService.getSupplyDemandGap(dbStores);
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/command-center/vendor-intel
   */
  router.get('/super/command-center/vendor-intel', requireSuperAdmin, (req, res) => {
    try {
      const data = aiSuperAdminCommandCenterService.getVendorIntelligence(dbStores);
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/command-center/tenant-intel
   */
  router.get('/super/command-center/tenant-intel', requireSuperAdmin, (req, res) => {
    try {
      const data = aiSuperAdminCommandCenterService.getTenantIntelligence(dbStores);
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/command-center/booking-revenue
   */
  router.get('/super/command-center/booking-revenue', requireSuperAdmin, (req, res) => {
    try {
      const data = aiSuperAdminCommandCenterService.getBookingRevenueIntelligence(dbStores);
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/command-center/trexio-pay
   */
  router.get('/super/command-center/trexio-pay', requireSuperAdmin, (req, res) => {
    try {
      const data = aiSuperAdminCommandCenterService.getTrexioPayIntelligence(dbStores);
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/command-center/search-discovery
   */
  router.get('/super/command-center/search-discovery', requireSuperAdmin, (req, res) => {
    try {
      const data = aiSuperAdminCommandCenterService.getSearchDiscoveryIntelligence(dbStores);
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/command-center/seo-content
   */
  router.get('/super/command-center/seo-content', requireSuperAdmin, (req, res) => {
    try {
      const data = aiSuperAdminCommandCenterService.getSEOContentIntelligence(dbStores);
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/command-center/community
   */
  router.get('/super/command-center/community', requireSuperAdmin, (req, res) => {
    try {
      const data = aiSuperAdminCommandCenterService.getCommunityIntelligence(dbStores);
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/command-center/safety
   */
  router.get('/super/command-center/safety', requireSuperAdmin, (req, res) => {
    try {
      const data = aiSuperAdminCommandCenterService.getSafetyIntelligence(dbStores);
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/command-center/ai-monitoring
   */
  router.get('/super/command-center/ai-monitoring', requireSuperAdmin, (req, res) => {
    try {
      const data = aiSuperAdminCommandCenterService.getAISystemMonitoring();
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/command-center/opportunities
   */
  router.get('/super/command-center/opportunities', requireSuperAdmin, (req, res) => {
    try {
      const opportunities = aiSuperAdminCommandCenterService.getOpportunityCenter(dbStores);
      res.json({ ok: true, opportunities });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/command-center/alerts
   */
  router.get('/super/command-center/alerts', requireSuperAdmin, (req, res) => {
    try {
      const alerts = aiSuperAdminCommandCenterService.getAlertCenter(dbStores);
      res.json({ ok: true, alerts });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  // ==========================================
  // PHASE 11 - TRUST, FRAUD & RISK INTELLIGENCE
  // ==========================================

  /**
   * GET /api/ai/super/risk/overview
   */
  router.get('/super/risk/overview', requireSuperAdmin, (req, res) => {
    try {
      const overview = aiRiskEngineService.getRiskOverview(dbStores);
      res.json({ ok: true, ...overview });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/risk/cases
   */
  router.get('/super/risk/cases', requireSuperAdmin, (req, res) => {
    try {
      const { status = 'ALL' } = req.query;
      const cases = aiRiskEngineService.getRiskCases(status);
      res.json({ ok: true, cases });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * POST /api/ai/super/risk/cases/create
   */
  router.post('/super/risk/cases/create', requireSuperAdmin, (req, res) => {
    try {
      const newCase = aiRiskEngineService.createRiskCase(req.body);
      res.json({ ok: true, case: newCase });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * PATCH /api/ai/super/risk/cases/:id/status
   */
  router.patch('/super/risk/cases/:id/status', requireSuperAdmin, (req, res) => {
    try {
      const { status, review_note } = req.body;
      const reviewer = req.user?.email || req.user?.name || 'Super Admin';
      const updatedCase = aiRiskEngineService.updateRiskCaseStatus(
        req.params.id,
        status,
        review_note,
        reviewer
      );
      res.json({ ok: true, case: updatedCase });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/risk/cases/:id/explain
   */
  router.get('/super/risk/cases/:id/explain', requireSuperAdmin, async (req, res) => {
    try {
      const explanation = await aiRiskEngineService.explainCaseRisk(req.params.id);
      res.json({ ok: true, ...explanation });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/risk/accounts
   */
  router.get('/super/risk/accounts', requireSuperAdmin, (req, res) => {
    try {
      const data = aiRiskEngineService.getAccountRisk(dbStores);
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/risk/vendors
   */
  router.get('/super/risk/vendors', requireSuperAdmin, (req, res) => {
    try {
      const data = aiRiskEngineService.getVendorRisk(dbStores);
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/risk/bookings
   */
  router.get('/super/risk/bookings', requireSuperAdmin, (req, res) => {
    try {
      const data = aiRiskEngineService.getBookingRisk(dbStores);
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/risk/payments
   */
  router.get('/super/risk/payments', requireSuperAdmin, (req, res) => {
    try {
      const data = aiRiskEngineService.getPaymentRisk(dbStores);
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/risk/reviews
   */
  router.get('/super/risk/reviews', requireSuperAdmin, (req, res) => {
    try {
      const data = aiRiskEngineService.getReviewRisk(dbStores);
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/risk/community
   */
  router.get('/super/risk/community', requireSuperAdmin, (req, res) => {
    try {
      const data = aiRiskEngineService.getCommunityRisk(dbStores);
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/risk/ai-abuse
   */
  router.get('/super/risk/ai-abuse', requireSuperAdmin, (req, res) => {
    try {
      const data = aiRiskEngineService.getAIAbuseSignals();
      res.json({ ok: true, ...data });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  // ==========================================
  // PHASE 12 - AI GROWTH & MARKETPLACE INTELLIGENCE
  // ==========================================

  /**
   * GET /api/ai/super/growth/overview
   */
  router.get('/super/growth/overview', requireSuperAdmin, (req, res) => {
    try {
      const overview = aiGrowthIntelligenceService.getGrowthOverview(dbStores);
      res.json({ ok: true, ...overview });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/growth/gaps
   */
  router.get('/super/growth/gaps', requireSuperAdmin, (req, res) => {
    try {
      const gaps = aiGrowthIntelligenceService.calculateSupplyDemandGaps(dbStores);
      res.json({ ok: true, gaps });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/growth/destinations
   */
  router.get('/super/growth/destinations', requireSuperAdmin, (req, res) => {
    try {
      const destinations = aiGrowthIntelligenceService.getDestinationIntelligence(dbStores);
      res.json({ ok: true, destinations });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/growth/categories
   */
  router.get('/super/growth/categories', requireSuperAdmin, (req, res) => {
    try {
      const categories = aiGrowthIntelligenceService.getCategoryIntelligence(dbStores);
      res.json({ ok: true, categories });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/growth/conversion
   */
  router.get('/super/growth/conversion', requireSuperAdmin, (req, res) => {
    try {
      const funnel = aiGrowthIntelligenceService.getConversionFunnel(dbStores);
      res.json({ ok: true, ...funnel });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/growth/gap-map
   */
  router.get('/super/growth/gap-map', requireSuperAdmin, (req, res) => {
    try {
      const matrix = aiGrowthIntelligenceService.getMarketplaceGapMap(dbStores);
      res.json({ ok: true, matrix });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * POST /api/ai/super/growth/ask
   */
  router.post('/super/growth/ask', requireSuperAdmin, async (req, res) => {
    try {
      const { query } = req.body;
      const answer = await aiGrowthIntelligenceService.askGrowthAI(dbStores, query || 'Apa peluang pertumbuhan terbesar saat ini?');
      res.json({ ok: true, ...answer });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  // ==========================================
  // PHASE 14 - AI EVALUATION, QUALITY & OBSERVABILITY
  // ==========================================

  /**
   * POST /api/ai/feedback
   * Capture user feedback (Helpful, Not Helpful, Report)
   */
  router.post('/feedback', (req, res) => {
    try {
      const { trace_id, feature, model, prompt_version, rating, reason } = req.body;
      const userId = req.user?.id || 'anonymous';

      const feedback = aiEvaluationService.recordUserFeedback({
        traceId: trace_id,
        feature,
        model,
        promptVersion: prompt_version,
        rating,
        reason,
        userId,
      });

      res.json({ ok: true, feedback });
    } catch (err) {
      res.status(400).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/evaluation/overview
   */
  router.get('/super/evaluation/overview', requireSuperAdmin, (req, res) => {
    try {
      const overview = aiEvaluationService.getEvaluationOverview(dbStores);
      res.json({ ok: true, overview });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/evaluation/golden-dataset
   */
  router.get('/super/evaluation/golden-dataset', requireSuperAdmin, (req, res) => {
    try {
      const dataset = aiEvaluationService.getGoldenDataset();
      res.json({ ok: true, dataset });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * POST /api/ai/super/evaluation/golden-dataset
   */
  router.post('/super/evaluation/golden-dataset', requireSuperAdmin, (req, res) => {
    try {
      const testCase = aiEvaluationService.addOrUpdateGoldenTestCase(req.body);
      res.json({ ok: true, testCase });
    } catch (err) {
      res.status(400).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * POST /api/ai/super/evaluation/regression
   */
  router.post('/super/evaluation/regression', requireSuperAdmin, async (req, res) => {
    try {
      const { candidateModel, candidatePromptVersion, feature } = req.body;
      const report = await aiEvaluationService.runRegressionSuite({
        candidateModel,
        candidatePromptVersion,
        feature,
      });
      res.json({ ok: true, report });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/evaluation/models
   */
  router.get('/super/evaluation/models', requireSuperAdmin, (req, res) => {
    try {
      const models = aiEvaluationService.compareModels();
      res.json({ ok: true, models });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/evaluation/traces
   */
  router.get('/super/evaluation/traces', requireSuperAdmin, (req, res) => {
    try {
      const traces = aiEvaluationService.getTraces(req.query);
      res.json({ ok: true, traces });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  /**
   * GET /api/ai/super/evaluation/alerts
   */
  router.get('/super/evaluation/alerts', requireSuperAdmin, (req, res) => {
    try {
      const alerts = aiEvaluationService.getAlerts();
      res.json({ ok: true, alerts });
    } catch (err) {
      res.status(500).json({ ok: false, error: 'Terjadi kesalahan pada layanan AI. Silakan coba lagi.' });
    }
  });

  return router;
}

module.exports = createAIRoutes;
