/**
 * TREXIO AI ENGINE - DATA LAYER & METADATA PREPARATION
 * Extracts structured AI metadata from real database records (trips, rentals, vendors, users, reviews, bookings)
 * and provides deterministic marketplace fallback algorithms.
 */

class AIDataService {
  /**
   * Constructs structured Product AI Metadata from canonical database records.
   */
  buildProductMetadata(product, reviews = [], bookings = []) {
    if (!product) return null;

    const prodId = product.id;
    const isTrip = Boolean(product.departure_dates || product.itinerary);

    // Calculate rating and review count from actual reviews
    const prodReviews = reviews.filter((r) => r.item_id === prodId || r.trip_id === prodId || r.rental_id === prodId);
    const reviewCount = prodReviews.length;
    const avgRating = reviewCount > 0
      ? Number((prodReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / reviewCount).toFixed(1))
      : (product.rating || 4.8);

    // Calculate booking count
    const prodBookings = bookings.filter((b) => b.trip_id === prodId || b.rental_id === prodId || b.product_id === prodId);
    const bookingCount = prodBookings.length;

    // Estimate demand score (0 - 100)
    const bookedSeats = product.booked_seats || 0;
    const maxParticipants = product.max_participants || 20;
    const occupancyRate = maxParticipants > 0 ? Math.min(100, Math.round((bookedSeats / maxParticipants) * 100)) : 50;
    const demandScore = Math.min(100, Math.round(occupancyRate * 0.6 + Math.min(bookingCount, 20) * 2));

    return {
      id: product.id,
      title: product.title || product.name,
      slug: product.slug,
      type: isTrip ? 'trip' : 'rental',
      category: product.category || (isTrip ? 'Gunung' : 'Outdoor Gear'),
      destination: product.destination || product.region || 'Indonesia',
      region: product.region || 'Indonesia',
      price: Number(product.price || product.price_per_day || 0),
      difficulty: product.difficulty || 'Pemula',
      duration_days: Number(product.duration_days || 1),
      max_participants: maxParticipants,
      booked_seats: bookedSeats,
      seats_left: Math.max(0, maxParticipants - bookedSeats),
      rating: avgRating,
      review_count: reviewCount,
      booking_count: bookingCount,
      occupancy_rate: occupancyRate,
      demand_score: demandScore,
      vendor_id: product.vendor_id,
      published: product.published !== false && product.available !== false,
      badges: Array.isArray(product.badges) ? product.badges : [],
      created_at: product.created_at,
    };
  }

  /**
   * Constructs structured Vendor AI Metadata from canonical database records.
   */
  buildVendorMetadata(vendor, trips = [], rentals = [], bookings = [], reviews = []) {
    if (!vendor) return null;

    const vendorId = vendor.id;
    const vendorTrips = trips.filter((t) => t.vendor_id === vendorId);
    const vendorRentals = rentals.filter((r) => r.vendor_id === vendorId);
    const totalProducts = vendorTrips.length + vendorRentals.length;

    const vendorBookings = bookings.filter((b) => b.vendor_id === vendorId);
    const completedBookings = vendorBookings.filter((b) => b.status === 'completed' || b.payment_status === 'paid').length;
    const cancelledBookings = vendorBookings.filter((b) => b.status === 'cancelled').length;
    const cancellationRate = vendorBookings.length > 0
      ? Number(((cancelledBookings / vendorBookings.length) * 100).toFixed(1))
      : 0;

    const vendorReviews = reviews.filter((r) => vendorTrips.some((t) => t.id === r.item_id) || vendorRentals.some((ren) => ren.id === r.item_id));
    const avgRating = vendorReviews.length > 0
      ? Number((vendorReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / vendorReviews.length).toFixed(1))
      : 4.9;

    return {
      id: vendor.id,
      brand_name: vendor.brand_name || vendor.slug,
      slug: vendor.slug,
      verification_status: vendor.status || 'verified',
      verified: vendor.status === 'verified',
      total_products: totalProducts,
      completed_bookings: completedBookings,
      cancellation_rate_percent: cancellationRate,
      rating: avgRating,
      review_count: vendorReviews.length,
      types: Array.isArray(vendor.types) ? vendor.types : ['organizer'],
      created_at: vendor.created_at,
    };
  }

  /**
   * Constructs privacy-aware User Personalization signals based purely on legitimate Trexio marketplace activity.
   */
  buildUserProfileSignals(user, userBookings = [], userWishlists = [], userEvents = []) {
    if (!user) {
      return {
        user_id: 'guest',
        preferred_destinations: [],
        preferred_categories: [],
        typical_trip_type: 'Open Trip',
        budget_range: { min: 0, max: 2000000 },
        past_bookings_count: 0,
        wishlist_count: 0,
      };
    }

    // Extract destinations from past bookings & events
    const destCounts = {};
    userBookings.forEach((b) => {
      if (b.destination) {
        destCounts[b.destination] = (destCounts[b.destination] || 0) + 3;
      }
    });
    userEvents.forEach((e) => {
      if (e.destination) {
        destCounts[e.destination] = (destCounts[e.destination] || 0) + 1;
      }
    });

    const preferredDestinations = Object.keys(destCounts)
      .sort((a, b) => destCounts[b] - destCounts[a])
      .slice(0, 5);

    // Extract categories
    const catCounts = {};
    userBookings.forEach((b) => {
      const cat = b.category || 'Gunung';
      catCounts[cat] = (catCounts[cat] || 0) + 3;
    });
    userEvents.forEach((e) => {
      if (e.category_id) {
        catCounts[e.category_id] = (catCounts[e.category_id] || 0) + 1;
      }
    });

    const preferredCategories = Object.keys(catCounts)
      .sort((a, b) => catCounts[b] - catCounts[a])
      .slice(0, 5);

    // Compute average booking budget
    const prices = userBookings.map((b) => Number(b.amount || b.price || 0)).filter((p) => p > 0);
    const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 1000000;

    return {
      user_id: user.id,
      name: user.name,
      level_pendaki: user.level_pendaki || 'Pendaki',
      preferred_destinations: preferredDestinations.length > 0 ? preferredDestinations : ['Gunung Bromo', 'Gunung Gede Pangrango'],
      preferred_categories: preferredCategories.length > 0 ? preferredCategories : ['Gunung'],
      typical_trip_type: 'Open Trip',
      budget_range: {
        min: Math.max(0, Math.round(avgPrice * 0.5)),
        max: Math.round(avgPrice * 1.8),
      },
      past_bookings_count: userBookings.length,
      wishlist_count: userWishlists.length,
    };
  }

  /**
   * Deterministic Fallback Algorithm: Ranks products using quality metrics (rating, demand, verification)
   * when AI model is disabled or unreachable.
   */
  getDeterministicRecommendations(trips = [], rentals = [], reviews = [], bookings = [], options = {}) {
    const { category, destination, limit = 6 } = options;

    const allProducts = [
      ...trips.map((t) => this.buildProductMetadata(t, reviews, bookings)),
      ...rentals.map((r) => this.buildProductMetadata(r, reviews, bookings)),
    ].filter(Boolean);

    let filtered = allProducts.filter((p) => p.published);

    if (category) {
      filtered = filtered.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    if (destination) {
      filtered = filtered.filter(
        (p) => p.destination.toLowerCase().includes(destination.toLowerCase()) || p.region.toLowerCase().includes(destination.toLowerCase())
      );
    }

    // Deterministic Composite Score: 40% Rating + 30% Demand Score + 30% Booking Count
    filtered.sort((a, b) => {
      const scoreA = a.rating * 8 + a.demand_score * 0.3 + Math.min(a.booking_count, 20) * 1.5;
      const scoreB = b.rating * 8 + b.demand_score * 0.3 + Math.min(b.booking_count, 20) * 1.5;
      return scoreB - scoreA;
    });

    return filtered.slice(0, limit);
  }

  /**
   * Deterministic Vendor Ranking Fallback.
   */
  getDeterministicVendorRankings(vendors = [], trips = [], rentals = [], bookings = [], reviews = [], limit = 10) {
    const vendorMetas = vendors
      .map((v) => this.buildVendorMetadata(v, trips, rentals, bookings, reviews))
      .filter(Boolean);

    vendorMetas.sort((a, b) => {
      const scoreA = (a.verified ? 20 : 0) + a.rating * 10 + Math.min(a.completed_bookings, 30) * 1 - a.cancellation_rate_percent * 0.5;
      const scoreB = (b.verified ? 20 : 0) + b.rating * 10 + Math.min(b.completed_bookings, 30) * 1 - b.cancellation_rate_percent * 0.5;
      return scoreB - scoreA;
    });

    return vendorMetas.slice(0, limit);
  }
}

module.exports = new AIDataService();
