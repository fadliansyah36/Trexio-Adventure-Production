/**
 * TREXIO AI ENGINE - RECOMMENDATION ENGINE SERVICE
 * Production-ready multi-stage recommendation engine using real Trexio database records.
 * Pipeline: Candidate Generation -> Eligibility Filtering -> Multi-Factor Scoring -> Vendor Diversity -> Organic Output.
 */

const aiDataService = require('./ai-data.service');
const aiRecommendationConfigService = require('./ai-recommendation-config.service');
const aiEventService = require('./ai-event.service');

class AIRecommendationEngineService {
  /**
   * Filter candidates based on Trexio marketplace business rules.
   */
  filterEligibility(products, vendors = []) {
    const now = new Date();

    return products.filter((p) => {
      // 1. Published / Active check
      if (p.published === false || p.available === false || p.status === 'inactive') {
        return false;
      }

      // 2. Vendor check (must not be suspended/banned)
      if (p.vendor_id && vendors.length > 0) {
        const vendor = vendors.find((v) => v.id === p.vendor_id);
        if (vendor && (vendor.status === 'suspended' || vendor.status === 'banned')) {
          return false;
        }
      }

      // 3. Price check
      if (!p.price || Number(p.price) <= 0) {
        return false;
      }

      // 4. Trip availability & departure date check
      if (p.type === 'trip' && p.departure_dates && Array.isArray(p.departure_dates) && p.departure_dates.length > 0) {
        const hasUpcomingDate = p.departure_dates.some((d) => {
          const dateObj = new Date(d.date || d);
          return dateObj >= new Date(now.setHours(0, 0, 0, 0));
        });
        if (!hasUpcomingDate) {
          return false;
        }
      }

      // 5. Seats / Stock check
      if (typeof p.seats_left === 'number' && p.seats_left <= 0 && typeof p.stock === 'number' && p.stock <= 0) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calculates composite multi-factor score for a single product given user profile & context.
   */
  calculateScore(product, userProfile, context = {}, configWeights) {
    const weights = configWeights || aiRecommendationConfigService.getConfig().weights;
    let score = 0;
    const scoreBreakdown = {};

    // A. Preference Match Score (Destinations & Categories)
    let prefScore = 0;
    if (userProfile) {
      if (userProfile.preferred_destinations && Array.isArray(userProfile.preferred_destinations)) {
        const destMatch = userProfile.preferred_destinations.some((d) =>
          product.destination?.toLowerCase().includes(d.toLowerCase()) ||
          product.region?.toLowerCase().includes(d.toLowerCase())
        );
        if (destMatch) prefScore += 50;
      }

      if (userProfile.preferred_categories && Array.isArray(userProfile.preferred_categories)) {
        const catMatch = userProfile.preferred_categories.some((c) =>
          product.category?.toLowerCase() === c.toLowerCase()
        );
        if (catMatch) prefScore += 50;
      }

      // Budget match check
      if (userProfile.budget_range && product.price) {
        if (product.price >= userProfile.budget_range.min && product.price <= userProfile.budget_range.max) {
          prefScore += 30;
        }
      }
    }
    const normalizedPrefScore = Math.min(100, prefScore);
    score += (normalizedPrefScore / 100) * weights.preference_match;
    scoreBreakdown.preference = Math.round((normalizedPrefScore / 100) * weights.preference_match);

    // B. Context Match (Category / Destination requested in API query)
    let contextScore = 0;
    if (context.category && product.category?.toLowerCase() === context.category.toLowerCase()) {
      contextScore += 50;
    }
    if (
      context.destination &&
      (product.destination?.toLowerCase().includes(context.destination.toLowerCase()) ||
        product.region?.toLowerCase().includes(context.destination.toLowerCase()))
    ) {
      contextScore += 50;
    }
    const normalizedContext = Math.min(100, contextScore);
    score += (normalizedContext / 100) * (weights.destination_match + weights.category_match);
    scoreBreakdown.context = Math.round((normalizedContext / 100) * (weights.destination_match + weights.category_match));

    // C. Rating Quality Score (0 - 100)
    const ratingVal = product.rating || 4.5;
    const reviewCount = product.review_count || 0;
    // Confidence weighting based on review count
    const confidenceMultiplier = reviewCount >= 5 ? 1.0 : reviewCount >= 1 ? 0.8 : 0.6;
    const ratingScore = (ratingVal / 5.0) * 100 * confidenceMultiplier;
    score += (ratingScore / 100) * weights.rating_quality;
    scoreBreakdown.rating = Math.round((ratingScore / 100) * weights.rating_quality);

    // D. Popularity & Booking Demand Score
    const bookingCount = product.booking_count || 0;
    const occupancyRate = product.occupancy_rate || 50;
    const popScore = Math.min(100, bookingCount * 5 + occupancyRate * 0.5);
    score += (popScore / 100) * weights.booking_popularity;
    scoreBreakdown.popularity = Math.round((popScore / 100) * weights.booking_popularity);

    // E. Cold Start Boost & Recency
    let recencyScore = 0;
    if (bookingCount <= 2) {
      // Apply Cold Start Boost for new products to ensure fair exposure
      recencyScore += weights.cold_start_boost;
    }
    if (product.created_at) {
      const daysOld = (Date.now() - new Date(product.created_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysOld <= 14) recencyScore += 20; // boost for created within 2 weeks
    }
    const normalizedRecency = Math.min(100, recencyScore);
    score += (normalizedRecency / 100) * weights.recency_boost;
    scoreBreakdown.recency = Math.round((normalizedRecency / 100) * weights.recency_boost);

    // F. Vendor Quality & Cancellation Penalty
    let vendorScore = 50;
    if (product.vendor_id) {
      if (product.vendor_verified) vendorScore += 30;
      if (product.vendor_cancellation_rate) {
        vendorScore -= product.vendor_cancellation_rate * 0.5;
      }
    }
    const normalizedVendor = Math.max(0, Math.min(100, vendorScore));
    score += (normalizedVendor / 100) * weights.vendor_quality;
    scoreBreakdown.vendor = Math.round((normalizedVendor / 100) * weights.vendor_quality);

    return {
      finalScore: Number(score.toFixed(2)),
      breakdown: scoreBreakdown,
    };
  }

  /**
   * Generates human-explainable reason for the user UI.
   */
  generateReason(product, userProfile, context = {}, scoreData) {
    if (context.destination && product.destination?.toLowerCase().includes(context.destination.toLowerCase())) {
      return `Pilihan utama untuk destinasi ${product.destination}`;
    }

    if (userProfile?.preferred_destinations?.some((d) => product.destination?.toLowerCase().includes(d.toLowerCase()))) {
      return `Sesuai minat destinasi favoritmu: ${product.destination}`;
    }

    if (userProfile?.preferred_categories?.some((c) => product.category?.toLowerCase() === c.toLowerCase())) {
      return `Rekomendasi ${product.category} terbaik untuk pendakianmu`;
    }

    if (product.rating >= 4.8 && product.review_count >= 3) {
      return `Rating ${product.rating} dari ${product.review_count} pendaki Trexio`;
    }

    if (product.booking_count <= 2) {
      return `Layanan & Trip Baru dari ${product.region || 'Trexio Marketplace'}`;
    }

    if (product.demand_score >= 70) {
      return `Sangat diminati pendaki minggu ini`;
    }

    return `Rekomendasi terbaik di kategori ${product.category || 'Outdoor'}`;
  }

  /**
   * Applies vendor diversity rules to avoid one vendor dominating the recommendation list.
   */
  applyDiversityRules(scoredProducts, limit = 6) {
    const config = aiRecommendationConfigService.getConfig();
    const maxPerVendor = config.diversity.max_items_per_vendor || 2;
    const enableDiversity = config.diversity.enable_vendor_diversity !== false;

    if (!enableDiversity || scoredProducts.length <= limit) {
      return scoredProducts.slice(0, limit);
    }

    const vendorCounts = {};
    const result = [];
    const overflow = [];

    for (const item of scoredProducts) {
      const vId = item.vendor_id || 'unassigned';
      const currentCount = vendorCounts[vId] || 0;

      if (currentCount < maxPerVendor) {
        result.push(item);
        vendorCounts[vId] = currentCount + 1;
      } else {
        overflow.push(item);
      }

      if (result.length >= limit) break;
    }

    // Fill remaining if needed from overflow
    if (result.length < limit && overflow.length > 0) {
      const remainingNeeded = limit - result.length;
      result.push(...overflow.slice(0, remainingNeeded));
    }

    return result;
  }

  /**
   * Main Personalized Recommendation Pipeline.
   */
  async getPersonalizedRecommendations({
    user = null,
    category = null,
    destination = null,
    limit = 6,
    trips = [],
    rentals = [],
    vendors = [],
    reviews = [],
    bookings = [],
    wishlists = [],
  }) {
    // 1. Build Candidate List from DB
    const allCandidates = [
      ...trips.map((t) => aiDataService.buildProductMetadata(t, reviews, bookings)),
      ...rentals.map((r) => aiDataService.buildProductMetadata(r, reviews, bookings)),
    ].filter(Boolean);

    // 2. Eligibility Filter
    const eligible = this.filterEligibility(allCandidates, vendors);

    // 3. Extract User Signals
    const userEvents = user ? aiEventService.getUserEvents(user.id, 50) : [];
    const userProfile = aiDataService.buildUserProfileSignals(user, bookings, wishlists, userEvents);

    // 4. Score Candidates
    const configWeights = aiRecommendationConfigService.getConfig().weights;
    const context = { category, destination };

    const scored = eligible.map((prod) => {
      const { finalScore, breakdown } = this.calculateScore(prod, userProfile, context, configWeights);
      const ai_reason = this.generateReason(prod, userProfile, context, { finalScore, breakdown });

      return {
        ...prod,
        recommendation_score: finalScore,
        score_breakdown: breakdown,
        ai_reason,
      };
    });

    // 5. Rank
    scored.sort((a, b) => b.recommendation_score - a.recommendation_score);

    // 6. Apply Diversity
    const finalRecs = this.applyDiversityRules(scored, limit);

    return finalRecs;
  }

  /**
   * Similar Products Recommendation (Content-Based Matching).
   */
  async getSimilarProducts(productId, { trips = [], rentals = [], reviews = [], bookings = [], vendors = [], limit = 4 }) {
    const allCandidates = [
      ...trips.map((t) => aiDataService.buildProductMetadata(t, reviews, bookings)),
      ...rentals.map((r) => aiDataService.buildProductMetadata(r, reviews, bookings)),
    ].filter(Boolean);

    const targetProduct = allCandidates.find((p) => p.id === productId);
    if (!targetProduct) {
      return this.filterEligibility(allCandidates, vendors).slice(0, limit);
    }

    const eligible = this.filterEligibility(allCandidates, vendors).filter((p) => p.id !== productId);

    const scored = eligible.map((p) => {
      let score = 0;
      if (p.category === targetProduct.category) score += 40;
      if (p.destination === targetProduct.destination || p.region === targetProduct.region) score += 40;
      if (Math.abs(p.price - targetProduct.price) / (targetProduct.price || 1) < 0.3) score += 20;

      return {
        ...p,
        similarity_score: score,
        ai_reason: `Serupa dalam kategori ${p.category} & wilayah ${p.region || p.destination}`,
      };
    });

    scored.sort((a, b) => b.similarity_score - a.similarity_score);
    return scored.slice(0, limit);
  }

  /**
   * Cross-Category Recommendations (e.g., booked Gunung Prau trip -> recommend Guide, Porter, Outdoor Gear Rental).
   */
  async getCrossCategoryRecommendations(productId, { trips = [], rentals = [], reviews = [], bookings = [], vendors = [], limit = 4 }) {
    const allCandidates = [
      ...trips.map((t) => aiDataService.buildProductMetadata(t, reviews, bookings)),
      ...rentals.map((r) => aiDataService.buildProductMetadata(r, reviews, bookings)),
    ].filter(Boolean);

    const target = allCandidates.find((p) => p.id === productId);
    const destination = target?.destination || target?.region || 'Gunung';

    const eligible = this.filterEligibility(allCandidates, vendors).filter((p) => p.id !== productId);

    // Prioritize complementary category items (e.g. if target is trip, prioritize gear rental or guides)
    const targetType = target?.type || 'trip';
    const complementaryType = targetType === 'trip' ? 'rental' : 'trip';

    const scored = eligible.map((p) => {
      let score = 0;
      if (p.type === complementaryType) score += 50;
      if (p.destination === destination || p.region === destination) score += 40;
      if (p.rating >= 4.5) score += 10;

      return {
        ...p,
        cross_category_score: score,
        ai_reason: `Perlengkapan & Layanan Pelengkap untuk ${destination}`,
      };
    });

    scored.sort((a, b) => b.cross_category_score - a.cross_category_score);
    return scored.slice(0, limit);
  }
}

module.exports = new AIRecommendationEngineService();
