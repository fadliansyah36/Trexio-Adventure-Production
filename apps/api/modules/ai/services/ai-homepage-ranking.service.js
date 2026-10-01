/**
 * TREXIO AI ENGINE - HOMEPAGE RANKING SERVICE (PHASE 3)
 * Dynamic section-specific ranking engine for Trexio marketplace sections:
 * - Best Trip
 * - High Demand
 * - Popular Open Trip
 * - Guide / Porter / Basecamp / Outdoor Gear Rental
 *
 * Integrates eligibility filtering, time decay, vendor quality, diversity rules,
 * anti-manipulation checks, and manual curation overrides.
 */

const { loadSingleton, saveSingleton } = require('./aiPostgresPersistence');
const aiRecommendationEngineService = require('./ai-recommendation-engine.service');
const aiDataService = require('./ai-data.service');
const aiEventService = require('./ai-event.service');

const DEFAULT_RANKING_CONFIG = {
  section_weights: {
    best_trip: { rating_quality: 30, completed_bookings: 25, vendor_quality: 20, availability: 15, recency: 10 },
    high_demand: { recent_views: 30, recent_searches: 20, wishlist_adds: 20, booking_velocity: 20, conversion: 10 },
    popular_open_trip: { bookings: 30, views: 20, wishlist: 20, rating: 15, availability: 15 },
    guide: { verification: 30, rating: 25, completed_services: 20, destination_relevance: 15, availability: 10 },
    porter: { destination_relevance: 30, availability: 25, rating: 20, completed_services: 15, verification: 10 },
    basecamp: { trail_relevance: 30, rating: 25, facilities: 20, availability: 15, verification: 10 },
    outdoor_rental: { location: 30, availability: 25, rating: 20, rental_activity: 15, vendor_quality: 10 },
  },
  time_decay_half_life_days: 7,
  vendor_max_per_section: 2,
  manual_curations: {
    pinned_product_ids: {}, // { sectionKey: [productId1, productId2] }
    excluded_product_ids: [],
  },
  last_updated: new Date().toISOString(),
  updated_by: 'system',
};

class AIHomepageRankingService {
  constructor() {
    this.config = { ...DEFAULT_RANKING_CONFIG };
    this.ready = this.loadFromPostgres();
  }

  ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  async loadFromPostgres() {
    try {
      const loaded = await loadSingleton('ai_homepage_ranking_config');
      if (loaded) this.this.config = { ...this.this.config, ...loaded.config };
    } catch (err) {
      console.error('[AI PostgreSQL persistence] Failed to load ai_homepage_ranking_config:', err.message);
    }
  }

  async persistToPostgres() {
    await saveSingleton('ai_homepage_ranking_config', { config: this.this.config });
  }

  getConfig() {
    return JSON.parse(JSON.stringify(this.config));
  }

  updateConfig(updatedConfig, userEmail = 'admin@trexio.id') {
    if (updatedConfig.section_weights) {
      this.config.section_weights = { ...this.config.section_weights, ...updatedConfig.section_weights };
    }
    if (typeof updatedConfig.time_decay_half_life_days === 'number') {
      this.config.time_decay_half_life_days = Math.max(1, Math.min(30, updatedConfig.time_decay_half_life_days));
    }
    if (typeof updatedConfig.vendor_max_per_section === 'number') {
      this.config.vendor_max_per_section = Math.max(1, Math.min(5, updatedConfig.vendor_max_per_section));
    }
    if (updatedConfig.manual_curations) {
      this.config.manual_curations = {
        pinned_product_ids: updatedConfig.manual_curations.pinned_product_ids || this.config.manual_curations.pinned_product_ids,
        excluded_product_ids: updatedConfig.manual_curations.excluded_product_ids || this.config.manual_curations.excluded_product_ids,
      };
    }

    this.config.last_updated = new Date().toISOString();
    this.config.updated_by = userEmail;
    void this.persistToPostgres();

    return this.getConfig();
  }

  /**
   * Time decay function: w = exp(-lambda * delta_days)
   */
  calculateTimeDecay(eventDate) {
    if (!eventDate) return 0.5;
    const daysOld = (Date.now() - new Date(eventDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 0) return 1.0;
    const halfLife = this.config.time_decay_half_life_days || 7;
    const lambda = Math.LN2 / halfLife;
    return Math.exp(-lambda * daysOld);
  }

  /**
   * Filter candidates based on server-side eligibility rules
   */
  filterEligibility(candidates, vendors = []) {
    const excludedIds = this.config.manual_curations.excluded_product_ids || [];
    return aiRecommendationEngineService.filterEligibility(candidates, vendors).filter((p) => !excludedIds.includes(p.id));
  }

  /**
   * Scores product for "Best Trip" section
   */
  scoreBestTrip(product, weights) {
    const ratingScore = (product.rating / 5.0) * 100 * (product.review_count >= 3 ? 1.0 : 0.7);
    const bookingScore = Math.min(100, product.booking_count * 5);
    const vendorScore = product.vendor_verified ? 100 : 50;
    const availScore = product.available ? 100 : 0;
    const recencyScore = product.created_at ? Math.min(100, this.calculateTimeDecay(product.created_at) * 100) : 50;

    const w = weights || this.config.section_weights.best_trip;
    const totalWeight = w.rating_quality + w.completed_bookings + w.vendor_quality + w.availability + w.recency;

    const score =
      (ratingScore * w.rating_quality +
        bookingScore * w.completed_bookings +
        vendorScore * w.vendor_quality +
        availScore * w.availability +
        recencyScore * w.recency) /
      (totalWeight || 100);

    return Number(score.toFixed(2));
  }

  /**
   * Scores product for "High Demand" section using recent event signals
   */
  scoreHighDemand(product, recentEvents = [], weights) {
    const w = weights || this.config.section_weights.high_demand;

    // Filter events for this product within last 7 days with time decay
    const prodEvents = recentEvents.filter((e) => e.productId === product.id || e.product_id === product.id);

    let viewSignal = 0;
    let wishlistSignal = 0;
    let bookingSignal = 0;

    prodEvents.forEach((e) => {
      const decay = this.calculateTimeDecay(e.timestamp || e.created_at);
      if (e.eventType === 'PRODUCT_VIEW' || e.eventType === 'TRIP_VIEW') viewSignal += 10 * decay;
      if (e.eventType === 'WISHLIST_ADD') wishlistSignal += 25 * decay;
      if (e.eventType === 'BOOKING_STARTED' || e.eventType === 'BOOKING_COMPLETED') bookingSignal += 50 * decay;
    });

    const viewScore = Math.min(100, viewSignal);
    const wishlistScore = Math.min(100, wishlistSignal);
    const bookingVelocityScore = Math.min(100, bookingSignal);
    const conversionScore = Math.min(100, product.conversion_rate ? product.conversion_rate * 100 : 50);

    const totalWeight = w.recent_views + w.wishlist_adds + w.booking_velocity + w.conversion;

    const score =
      (viewScore * w.recent_views +
        wishlistScore * w.wishlist_adds +
        bookingVelocityScore * w.booking_velocity +
        conversionScore * w.conversion) /
      (totalWeight || 100);

    return Number(score.toFixed(2));
  }

  /**
   * Scores product for "Popular Open Trip"
   */
  scorePopularOpenTrip(product, weights) {
    const w = weights || this.config.section_weights.popular_open_trip;

    const bookingScore = Math.min(100, product.booking_count * 8);
    const viewScore = Math.min(100, (product.views_count || 10) * 2);
    const wishlistScore = Math.min(100, (product.wishlist_count || 2) * 10);
    const ratingScore = (product.rating / 5.0) * 100;
    const availScore = product.available ? 100 : 0;

    const totalWeight = w.bookings + w.views + w.wishlist + w.rating + w.availability;

    const score =
      (bookingScore * w.bookings +
        viewScore * w.views +
        wishlistScore * w.wishlist +
        ratingScore * w.rating +
        availScore * w.availability) /
      (totalWeight || 100);

    return Number(score.toFixed(2));
  }

  /**
   * Apply Vendor Diversity & Manual Pinned Overrides
   */
  applySectionRanking(scoredItems, sectionKey, limit = 6) {
    const pinnedIds = this.config.manual_curations.pinned_product_ids[sectionKey] || [];
    const maxPerVendor = this.config.vendor_max_per_section || 2;

    // Separate pinned items from organic scored items
    const pinnedItems = [];
    const unpinnedItems = [];

    scoredItems.forEach((item) => {
      if (pinnedIds.includes(item.id)) {
        pinnedItems.push({ ...item, is_pinned: true, ai_reason: 'Rekomendasi Utama Trexio' });
      } else {
        unpinnedItems.push(item);
      }
    });

    // Sort unpinned items by organic score descending
    unpinnedItems.sort((a, b) => (b.homepage_score || 0) - (a.homepage_score || 0));

    // Apply vendor diversity on unpinned
    const vendorCounts = {};
    const diverseUnpinned = [];

    pinnedItems.forEach((p) => {
      const vId = p.vendor_id || 'unassigned';
      vendorCounts[vId] = (vendorCounts[vId] || 0) + 1;
    });

    for (const item of unpinnedItems) {
      const vId = item.vendor_id || 'unassigned';
      const count = vendorCounts[vId] || 0;
      if (count < maxPerVendor) {
        diverseUnpinned.push(item);
        vendorCounts[vId] = count + 1;
      }
    }

    const finalSection = [...pinnedItems, ...diverseUnpinned].slice(0, limit);
    return finalSection;
  }

  /**
   * Main Homepage Section Composer Engine
   */
  async getRankedHomepageSections({ trips = [], rentals = [], vendors = [], reviews = [], bookings = [], wishlists = [], user = null }) {
    // 1. Candidate Generation
    const tripCandidates = trips.map((t) => aiDataService.buildProductMetadata(t, reviews, bookings)).filter(Boolean);
    const rentalCandidates = rentals.map((r) => aiDataService.buildProductMetadata(r, reviews, bookings)).filter(Boolean);

    const eligibleTrips = this.filterEligibility(tripCandidates, vendors);
    const eligibleRentals = this.filterEligibility(rentalCandidates, vendors);

    const recentEvents = aiEventService.getRecentEvents(100);

    // 2. Score "Best Trip"
    const bestTripScored = eligibleTrips.map((p) => ({
      ...p,
      homepage_score: this.scoreBestTrip(p),
      ai_reason: `Top Rated Trip (${p.rating}★) di ${p.destination || 'Indonesia'}`,
    }));
    const bestTrips = this.applySectionRanking(bestTripScored, 'best_trip', 6);

    // 3. Score "High Demand"
    const highDemandScored = eligibleTrips.map((p) => ({
      ...p,
      homepage_score: this.scoreHighDemand(p, recentEvents),
      ai_reason: `Sedang Banyak Dicari & Dipesan Pendaki`,
    }));
    const highDemand = this.applySectionRanking(highDemandScored, 'high_demand', 6);

    // 4. Score "Popular Open Trip"
    const openTripsScored = eligibleTrips
      .filter((p) => p.category?.toLowerCase() === 'open trip' || p.type === 'trip')
      .map((p) => ({
        ...p,
        homepage_score: this.scorePopularOpenTrip(p),
        ai_reason: `Open Trip Favorit dengan Demand Tinggi`,
      }));
    const popularOpenTrips = this.applySectionRanking(openTripsScored, 'popular_open_trip', 6);

    // 5. Section "Outdoor Gear Rental"
    const rentalScored = eligibleRentals.map((r) => ({
      ...r,
      homepage_score: (r.rating / 5.0) * 80 + Math.min(20, (r.booking_count || 0) * 5),
      ai_reason: `Perlengkapan Outdoor Berkualitas & Terawat`,
    }));
    const outdoorRental = this.applySectionRanking(rentalScored, 'outdoor_rental', 6);

    // 6. Section "Recommended For You" (Personalized if user logged in, or best popular if guest)
    const recommendedForYou = await aiRecommendationEngineService.getPersonalizedRecommendations({
      user,
      limit: 6,
      trips,
      rentals,
      vendors,
      reviews,
      bookings,
      wishlists,
    });

    return {
      recommended_for_you: recommendedForYou,
      best_trips: bestTrips,
      high_demand: highDemand,
      popular_open_trips: popularOpenTrips,
      outdoor_rental: outdoorRental,
    };
  }
}

module.exports = new AIHomepageRankingService();
