/**
 * TREXIO AI ENGINE - ACTIVITY & EVENT SYSTEM
 * Captures user marketplace events for personalization and analytics with strict privacy minimization.
 */

const { loadCollection, saveDocument } = require('./aiPostgresPersistence');
const { v4: uuidv4 } = require('uuid');
const { AI_EVENT_TYPES } = require('../types');

class AIEventService {
  constructor() {
    this.events = [];
    this.maxEventsInMemory = 5000;
    this.ready = this.loadFromPostgres();
    this.loadFromDisk();
  }

  async loadFromPostgres() {
    try {
      const loaded = await loadCollection('ai_event_logs');
      this.events = loaded
        .map((doc) => doc.data || doc)
        .sort((a, b) => new Date(b.timestamp || b.created_at || 0) - new Date(a.timestamp || a.created_at || 0))
        .slice(0, this.maxEventsInMemory);
    } catch (err) {
      console.error('[AI PostgreSQL persistence] Failed to load ai_event_logs:', err.message);
    }
  }

  async persistEntry(entry) {
    await saveDocument('ai_event_logs', entry);
  }


  /**
   * Records a user activity event.
   */
  recordEvent({
    userId = 'guest',
    eventType,
    productId = null,
    vendorId = null,
    categoryId = null,
    destination = null,
    searchQuery = null,
    metadata = {},
  }) {
    if (!eventType || !Object.values(AI_EVENT_TYPES).includes(eventType)) {
      throw new Error(`Invalid event type: ${eventType}`);
    }

    // Privacy filter: strip any sensitive fields from metadata
    const sanitizedMetadata = { ...metadata };
    delete sanitizedMetadata.password;
    delete sanitizedMetadata.token;
    delete sanitizedMetadata.pin;
    delete sanitizedMetadata.card_number;

    const eventEntry = {
      id: `evt_${Date.now()}_${uuidv4().substring(0, 6)}`,
      user_id: userId,
      event_type: eventType,
      product_id: productId,
      vendor_id: vendorId,
      category_id: categoryId,
      destination: destination ? String(destination).trim() : null,
      search_query: searchQuery ? String(searchQuery).trim() : null,
      metadata: sanitizedMetadata,
      timestamp: new Date().toISOString(),
    };

    this.events.unshift(eventEntry);
    if (this.events.length > this.maxEventsInMemory) {
      this.events.pop();
    }

    void this.persistEntry(eventEntry);
    return eventEntry;
  }

  /**
   * Retrieves events for a specific user to derive personalization signals.
   */
  getUserEvents(userId, limit = 100) {
    if (!userId) return [];
    return this.events
      .filter((e) => e.user_id === userId)
      .slice(0, Math.min(limit, 500));
  }

  /**
   * Retrieves recent events for analytics or admin monitoring.
   */
  getRecentEvents(limit = 100, eventType = null) {
    let result = this.events;
    if (eventType) {
      result = result.filter((e) => e.event_type === eventType);
    }
    return result.slice(0, Math.min(limit, 500));
  }

  /**
   * Computes event aggregation statistics and recommendation analytics.
   */
  getStats() {
    const totalEvents = this.events.length;
    const typeBreakdown = {};

    this.events.forEach((evt) => {
      const type = evt.event_type || 'OTHER';
      typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
    });

    const recImpressions = typeBreakdown[AI_EVENT_TYPES.RECOMMENDATION_IMPRESSION] || 0;
    const recClicks = typeBreakdown[AI_EVENT_TYPES.RECOMMENDATION_CLICK] || 0;
    const recWishlists = typeBreakdown[AI_EVENT_TYPES.RECOMMENDATION_WISHLIST] || 0;
    const recBookings = typeBreakdown[AI_EVENT_TYPES.RECOMMENDATION_BOOKING] || 0;
    const ctr = recImpressions > 0 ? Number(((recClicks / recImpressions) * 100).toFixed(1)) : 0;
    const conversionRate = recClicks > 0 ? Number(((recBookings / recClicks) * 100).toFixed(1)) : 0;

    return {
      total_events: totalEvents,
      type_breakdown: typeBreakdown,
      recommendation_analytics: {
        impressions: recImpressions,
        clicks: recClicks,
        ctr_percent: ctr,
        wishlists: recWishlists,
        bookings: recBookings,
        conversion_rate_percent: conversionRate,
      },
    };
  }
}

module.exports = new AIEventService();
