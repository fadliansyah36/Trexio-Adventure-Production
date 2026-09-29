import { api } from "@/lib/api";

export const backpackerService = {
  // Profile
  getProfile: async () => {
    const res = await api.get("/backpacker/profile");
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await api.put("/backpacker/profile", data);
    return res.data;
  },
  getPublicProfile: async (userId) => {
    const res = await api.get(`/backpacker/profile/${userId}`);
    return res.data;
  },

  // Travel Intent
  getTravelIntents: async (params = {}) => {
    const res = await api.get("/backpacker/travel-intents", { params });
    return res.data;
  },
  getMyTravelIntents: async () => {
    const res = await api.get("/backpacker/travel-intents/mine");
    return res.data;
  },
  createTravelIntent: async (data) => {
    const res = await api.post("/backpacker/travel-intents", data);
    return res.data;
  },
  updateTravelIntent: async (id, data) => {
    const res = await api.put(`/backpacker/travel-intents/${id}`, data);
    return res.data;
  },

  // Buddy
  getBuddyMatches: async () => {
    const res = await api.get("/backpacker/buddies/matches");
    return res.data;
  },
  getBuddyConnections: async () => {
    const res = await api.get("/backpacker/buddies/connections");
    return res.data;
  },
  getAuthorizedContact: async (targetUserId) => {
    const res = await api.get(`/backpacker/contact/${targetUserId}`);
    return res.data;
  },
  getConnectionContact: async (connectionId) => {
    const res = await api.get(`/backpacker/connections/${connectionId}/contact`);
    return res.data;
  },
  requestBuddyConnection: async (target_id, match_percentage, source_feature = 'FIND_YOUR_BUDDY') => {
    const res = await api.post("/backpacker/buddies/connect", { target_id, match_percentage, source_feature });
    return res.data;
  },
  updateBuddyConnection: async (id, action) => {
    const res = await api.put(`/backpacker/buddies/connections/${id}`, { action });
    return res.data;
  },
  reportUser: async (target_id, reason, details) => {
    const res = await api.post("/backpacker/buddies/report", { target_id, reason, details });
    return res.data;
  },
  requestAssistance: async (travel_intent_id, reason) => {
    const res = await api.post("/backpacker/assistance-requests", { travel_intent_id, reason });
    return res.data;
  },
  getMyAssistanceRequests: async () => {
    const res = await api.get("/backpacker/assistance-requests/my");
    return res.data;
  },
  getMyGuidedRecommendations: async () => {
    const res = await api.get("/backpacker/suggested-matches/my");
    return res.data;
  },
  respondToSuggestedMatch: async (connectionId, action) => {
    const res = await api.post(`/backpacker/suggested-matches/${connectionId}/respond`, { action });
    return res.data;
  },

  // Shared Ride
  getSharedRides: async (params = {}) => {
    const res = await api.get("/backpacker/shared-rides", { params });
    return res.data;
  },
  createSharedRide: async (data) => {
    const res = await api.post("/backpacker/shared-rides", data);
    return res.data;
  },
  joinSharedRide: async (id, seats = 1, note = "") => {
    const res = await api.post(`/backpacker/shared-rides/${id}/join`, { seats, note });
    return res.data;
  },
  respondToRideRequest: async (requestId, action) => {
    const res = await api.put(`/backpacker/shared-rides/requests/${requestId}`, { action });
    return res.data;
  },
  cancelSharedRide: async (rideId) => {
    const res = await api.delete(`/backpacker/shared-rides/${rideId}`);
    return res.data;
  },

  // Activities & Request Center
  getActivities: async () => {
    const res = await api.get("/backpacker/activities");
    return res.data;
  },

  // Journeys
  getJourneys: async () => {
    const res = await api.get("/backpacker/journeys");
    return res.data;
  },
  createJourney: async (data) => {
    const res = await api.post("/backpacker/journeys", data);
    return res.data;
  },
  getJourneyDetail: async (id) => {
    const res = await api.get(`/backpacker/journeys/${id}`);
    return res.data;
  },
  updateJourneyStatus: async (id, status) => {
    const res = await api.patch(`/backpacker/journeys/${id}/status`, { status });
    return res.data;
  },
  addJourneyStop: async (journeyId, data) => {
    const res = await api.post(`/backpacker/journeys/${journeyId}/stops`, data);
    return res.data;
  },
  updateStopStatus: async (stopId, status) => {
    const res = await api.patch(`/backpacker/journeys/stops/${stopId}/status`, { status });
    return res.data;
  },
  toggleLocationConsent: async (journeyId, consent) => {
    const res = await api.post(`/backpacker/journeys/${journeyId}/location-consent`, { consent });
    return res.data;
  },
  getLocationConsent: async (journeyId) => {
    const res = await api.get(`/backpacker/journeys/${journeyId}/location-consent`);
    return res.data;
  },
  updateLocation: async (journeyId, coords) => {
    const res = await api.post(`/backpacker/journeys/${journeyId}/location`, coords);
    return res.data;
  },
  getJourneyLocations: async (journeyId) => {
    const res = await api.get(`/backpacker/journeys/${journeyId}/locations`);
    return res.data;
  },
  addJourneyExpense: async (journeyId, data) => {
    const res = await api.post(`/backpacker/journeys/${journeyId}/expenses`, data);
    return res.data;
  },
  getJourneyCostSplit: async (journeyId) => {
    const res = await api.get(`/backpacker/journeys/${journeyId}/cost-split`);
    return res.data;
  },
  getMyBookings: async () => {
    const res = await api.get("/backpacker/my-bookings");
    return res.data;
  },

  // Booking References
  getEligibleBookingReferences: async () => {
    const res = await api.get("/backpacker/booking-references");
    return res.data;
  },

  // Route & Local Transport Search
  searchRoutes: async (params = {}) => {
    const res = await api.get("/backpacker/routes/search", { params });
    return res.data;
  },
  getLocalTransports: async (params = {}) => {
    const res = await api.get("/backpacker/transport/local", { params });
    return res.data;
  }
};

export default backpackerService;
