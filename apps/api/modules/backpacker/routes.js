/**
 * TREXIO BACKPACKER - EXPRESS ROUTER
 * Exposes API endpoints for Profiles, Travel Intents, Buddy Matching, Shared Rides, Journeys, and Cost Split.
 */

const express = require('express');
const {
  getProfileByUserId,
  upsertProfile,
  getTravelIntents,
  createTravelIntent,
  updateTravelIntent,
  getBuddyMatches,
  requestBuddyConnection,
  updateBuddyConnectionStatus,
  getUserConnections,
  getSharedRides,
  createSharedRide,
  joinSharedRide,
  requestJoinSharedRide,
  respondToRideRequest,
  cancelSharedRide,
  getBackpackerRequestsAndActivities,
  getUserJourneys,
  createJourney,
  getJourneyDetail,
  updateJourneyStatus,
  addJourneyStop,
  updateJourneyStopStatus,
  addJourneyExpense,
  calculateJourneyCostSummary,
  reportUser,
  toggleLocationConsent,
  updateParticipantLocation,
  getJourneyParticipantLocations,
  getLocationConsentStatus,
  getAuthorizedContactInfo,
  hasValidContact,
  createAssistanceRequest,
  getUserAssistanceRequests,
  getUserGuidedRecommendations,
  getAdminAssistanceRequests,
  getAssistanceCandidates,
  suggestMatchByAdmin,
  respondToSuggestedMatch,
  closeAssistanceRequest,
  getAdminOverview,
  getAdminTravelIntents,
  updateAdminTravelIntent,
  getAdminSharedRides,
  updateAdminSharedRide,
  getAdminJourneysAndCostSplits
} = require('./store');

function createBackpackerRouter(options = {}) {
  const { authenticateToken, notifyUser = null } = typeof options === 'function' ? {} : options;

  const getUsers = () => (typeof options.users === 'function' ? options.users() : (options.users || []));
  const getTrips = () => (typeof options.trips === 'function' ? options.trips() : (options.trips || []));
  const getRentals = () => (typeof options.rentals === 'function' ? options.rentals() : (options.rentals || []));
  const getBookings = () => (typeof options.bookings === 'function' ? options.bookings() : (options.bookings || []));
  const getCategoryItems = () => (typeof options.category_items === 'function' ? options.category_items() : (options.category_items || {}));

  // Server-side Ownership & Eligibility Validation for Booking References (Anti-IDOR & Security Gate)
  const validateBookingReference = (userId, userEmail, bookingRefId) => {
    if (!bookingRefId) return null;
    const allBookings = getBookings();
    const found = (Array.isArray(allBookings) ? allBookings : []).find(b =>
      String(b.id) === String(bookingRefId) || String(b.booking_code) === String(bookingRefId)
    );
    if (!found) {
      throw new Error(`Booking reference '${bookingRefId}' tidak ditemukan.`);
    }

    // Ownership check (Anti-IDOR)
    const isOwner = String(found.user_id) === String(userId) ||
                    (found.user_email && String(found.user_email).toLowerCase() === String(userEmail || '').toLowerCase()) ||
                    (found.contact_email && String(found.contact_email).toLowerCase() === String(userEmail || '').toLowerCase());
    if (!isOwner) {
      throw new Error(`Akses ditolak: Anda tidak memiliki wewenang atas booking reference ini.`);
    }

    // Payment / Status Eligibility check
    const payStatus = String(found.payment_status || '').toLowerCase();
    const bookStatus = String(found.booking_status || found.status || '').toLowerCase();
    const isPaid = payStatus === 'verified' || payStatus === 'paid' || payStatus === 'success' ||
                   bookStatus === 'confirmed' || bookStatus === 'completed' || bookStatus === 'active';
    const isInvalid = ['cancelled', 'expired', 'failed', 'rejected', 'refunded'].includes(payStatus) ||
                      ['cancelled', 'expired', 'failed', 'rejected', 'refunded'].includes(bookStatus);

    if (!isPaid || isInvalid) {
      throw new Error(`Booking status ('${payStatus || bookStatus}') tidak memenuhi kualifikasi sebagai referensi tujuan (minimal Lunas/Verified).`);
    }

    return {
      booking_reference_id: found.id,
      booking_code: found.booking_code || found.id,
      product_id: found.trip_id || found.product_id || found.item_id || null,
      product_name: found.trip_title || found.product_name || found.title || 'Booking Trexio',
      destination: found.trip_destination || found.destination || found.meeting_point || 'Destinasi Trexio',
      trip_date: found.departure_date || found.start_date || found.travel_date || found.booking_date || null
    };
  };

  const getAllTransportProducts = () => {
    const allTrips = getTrips();
    const catItems = getCategoryItems();

    // 1. Gather matching transport/shuttle products from trips array
    const tripTransports = (allTrips || []).filter((t) => {
      const cat = (t.category || t.category_type || t.type || '').toLowerCase();
      const title = (t.title || '').toLowerCase();
      return (
        cat.includes('shuttle') ||
        cat.includes('transport') ||
        cat.includes('travel') ||
        cat.includes('jeep') ||
        cat.includes('local') ||
        title.includes('shuttle') ||
        title.includes('transport') ||
        title.includes('elf') ||
        title.includes('antar') ||
        title.includes('hardtop') ||
        title.includes('pick-up') ||
        title.includes('hiace') ||
        title.includes('speedboat')
      );
    });

    // 2. Gather from category_items['shuttle'] and category_items['transportasi']
    const shuttleList = Array.isArray(catItems.shuttle) ? catItems.shuttle : [];
    const transportList = Array.isArray(catItems.transportasi) ? catItems.transportasi : [];

    const mappedCatItems = [...shuttleList, ...transportList].map((item) => {
      if (item.trip_id) {
        const linked = (allTrips || []).find((x) => x.id === item.trip_id);
        if (linked) return linked;
      }

      const pickupPt = item.location || 'Titik Penjemputan / Basecamp';
      const dropPt = item.destination || item.location || 'Basecamp Tujuan';
      const specsArr = Array.isArray(item.specs) ? item.specs : [];

      return {
        id: item.id,
        product_id: item.id,
        vendor_id: item.vendor_id || null,
        vendor_name: item.provider || item.organizer || 'TREXIO Partner',
        title: item.title,
        slug: item.slug || item.id,
        category: item.category || 'Shuttle & Transportasi',
        transport_type: item.transportType || item.vehicle_type || (specsArr[0] || 'Angkutan Lokal'),
        price: Number(item.price || 150000),
        currency: 'IDR',
        price_unit: item.price_unit || 'trip',
        location: item.location || 'Indonesia',
        pickup_point: pickupPt,
        pickup_points: Array.isArray(item.meeting_points) ? item.meeting_points : [pickupPt],
        dropoff_point: dropPt,
        dropoff: dropPt,
        departure_schedules: item.departure_dates || item.available_dates || ['Setiap Hari'],
        schedules: item.departure_dates || item.available_dates || ['Setiap Hari'],
        available_seats: item.stock || item.max_participants || 12,
        availability: item.stock || item.max_participants || 12,
        distance: item.distance || '45 km',
        duration: '1 Hari / Trip',
        cover_image: item.image || item.cover_image,
        description: item.description || '',
        specs: specsArr,
        vendor_badge: item.badge || 'Partner Resmi Trexio'
      };
    });

    const combinedMap = new Map();
    [...tripTransports, ...mappedCatItems].forEach((t) => {
      if (t && t.id && !combinedMap.has(t.id)) {
        combinedMap.set(t.id, t);
      }
    });

    return Array.from(combinedMap.values());
  };
  const router = express.Router();

  // Helper response wrapper
  const success = (res, data, message = 'Success') => res.json({ status: 'success', message, data });
  const error = (res, message, code = 400, details = null) =>
    res.status(code).json({ status: 'error', message, code, details });

  const sendNotif = (targetUserId, title, message, type = 'community', link = '/backpacker') => {
    if (typeof notifyUser === 'function') {
      try {
        notifyUser(targetUserId, title, message, type, link, 'community');
      } catch (e) {
        console.error('[BACKPACKER NOTIF ERR]', e.message);
      }
    }
  };

  // 1. BACKPACKER PROFILE API
  router.get('/profile', authenticateToken, (req, res) => {
    try {
      let prof = getProfileByUserId(req.user.id);
      if (!prof) {
        prof = upsertProfile(req.user.id, {
          display_name: req.user.name || 'Backpacker',
          bio: req.user.bio || 'Outdoor traveler',
          hiking_level: req.user.level_pendaki || 'Beginner'
        });
      }
      return success(res, prof);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  router.put('/profile', authenticateToken, (req, res) => {
    try {
      const prof = upsertProfile(req.user.id, req.body || {});
      return success(res, prof, 'Profile updated successfully');
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  router.get('/profile/:userId', authenticateToken, (req, res) => {
    try {
      const prof = getProfileByUserId(req.params.userId);
      if (!prof) return error(res, 'Backpacker profile not found', 404);

      // Privacy Filtering
      const isOwner = req.user.id === req.params.userId;
      const filtered = {
        id: prof.id,
        user_id: prof.user_id,
        display_name: prof.display_name,
        bio: prof.bio,
        hiking_level: prof.hiking_level,
        preferred_style: prof.preferred_style,
        verified_status: prof.verified_status,
        created_at: prof.created_at
      };

      if (isOwner || prof.privacy_settings?.show_phone) {
        const u = users.find((x) => x.id === prof.user_id);
        if (u) filtered.phone = u.phone;
      }

      return success(res, filtered);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  // ==========================================
  // BOOKING REFERENCES API (Phase N6)
  // ==========================================
  router.get('/booking-references', authenticateToken, (req, res) => {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email || '';
      const allBookings = getBookings();

      const userBookings = (Array.isArray(allBookings) ? allBookings : []).filter(b => {
        const isOwner = String(b.user_id) === String(userId) ||
                        (b.user_email && String(b.user_email).toLowerCase() === String(userEmail).toLowerCase()) ||
                        (b.contact_email && String(b.contact_email).toLowerCase() === String(userEmail).toLowerCase());
        return isOwner;
      });

      const eligibleBookings = userBookings.filter(b => {
        const payStatus = String(b.payment_status || '').toLowerCase();
        const bookStatus = String(b.booking_status || b.status || '').toLowerCase();

        const isPaid = payStatus === 'verified' || payStatus === 'paid' || payStatus === 'success' ||
                       bookStatus === 'confirmed' || bookStatus === 'completed' || bookStatus === 'active';

        const isInvalid = ['cancelled', 'expired', 'failed', 'rejected', 'refunded'].includes(payStatus) ||
                          ['cancelled', 'expired', 'failed', 'rejected', 'refunded'].includes(bookStatus);

        return isPaid && !isInvalid;
      }).map(b => ({
        id: b.id,
        booking_code: b.booking_code || b.id,
        product_id: b.trip_id || b.product_id || b.item_id || null,
        product_name: b.trip_title || b.product_name || b.title || 'Booking Trexio',
        destination: b.trip_destination || b.destination || b.meeting_point || 'Destinasi Trexio',
        trip_date: b.departure_date || b.start_date || b.travel_date || b.booking_date || null,
        meeting_point: b.meeting_point || b.pickup_point || null,
        vendor_name: b.vendor_name || 'Mitra Trexio',
        booking_status: b.booking_status || 'confirmed',
        payment_status: b.payment_status || 'verified'
      }));

      return success(res, eligibleBookings);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  // 2. TRAVEL INTENT API
  router.get('/travel-intents', authenticateToken, (req, res) => {
    try {
      const filters = {
        destination: req.query.destination,
        origin: req.query.origin,
        status: req.query.status || 'ACTIVE'
      };
      const intents = getTravelIntents(filters);
      return success(res, intents);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  router.get('/travel-intents/mine', authenticateToken, (req, res) => {
    try {
      const intents = getTravelIntents({ userId: req.user.id });
      return success(res, intents);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  router.post('/travel-intents', authenticateToken, (req, res) => {
    try {
      if (!req.body.destination || !req.body.origin) {
        return error(res, 'Origin and destination are required fields');
      }

      // Verify booking reference if provided
      if (req.body.booking_reference_id) {
        const validatedRef = validateBookingReference(req.user.id, req.user.email, req.body.booking_reference_id);
        if (validatedRef) {
          req.body.booking_reference_name = validatedRef.product_name;
        }
      }

      const newIntent = createTravelIntent(req.user.id, req.body);
      return success(res, newIntent, 'Travel intent created successfully');
    } catch (err) {
      if (err.message?.includes('contact method') || err.message?.includes('contact')) {
        return error(res, err.message, 400, { code: 'CONTACT_PROFILE_INCOMPLETE', action: 'COMPLETE_CONTACT_PROFILE' });
      }
      return error(res, err.message, 400);
    }
  });

  router.put('/travel-intents/:id', authenticateToken, (req, res) => {
    try {
      if (req.body.booking_reference_id) {
        const validatedRef = validateBookingReference(req.user.id, req.user.email, req.body.booking_reference_id);
        if (validatedRef) {
          req.body.booking_reference_name = validatedRef.product_name;
        }
      }
      const updated = updateTravelIntent(req.params.id, req.user.id, req.body);
      return success(res, updated, 'Travel intent updated');
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  // 3. BUDDY MATCHING & CONNECTION API
  router.get('/buddies/matches', authenticateToken, (req, res) => {
    try {
      const matches = getBuddyMatches(req.user.id);
      return success(res, matches);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  router.get('/buddies/connections', authenticateToken, (req, res) => {
    try {
      const conns = getUserConnections(req.user.id);
      return success(res, conns);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  // Secure Contact Info Reveal Endpoint
  router.get('/contact/:targetUserId', authenticateToken, (req, res) => {
    try {
      const contactInfo = getAuthorizedContactInfo(req.user.id, req.params.targetUserId);
      return success(res, contactInfo);
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  router.get('/connections/:id/contact', authenticateToken, (req, res) => {
    try {
      const conns = getUserConnections(req.user.id);
      const conn = conns.find((c) => c.id === req.params.id);
      if (!conn) return error(res, 'Connection not found or unauthorized', 404);

      const targetUserId = conn.requester_id === req.user.id ? conn.target_id : conn.requester_id;
      const contactInfo = getAuthorizedContactInfo(req.user.id, targetUserId);
      return success(res, contactInfo);
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  router.post('/buddies/connect', authenticateToken, (req, res) => {
    try {
      const { target_id, match_percentage, source_feature } = req.body;
      if (!target_id) return error(res, 'Target user ID is required');

      const conn = requestBuddyConnection(req.user.id, target_id, match_percentage || 80, source_feature || 'FIND_YOUR_BUDDY');

      // Trigger NOTIFICATION: BUDDY_REQUEST
      const senderProf = getProfileByUserId(req.user.id);
      sendNotif(
        target_id,
        'Permintaan Koneksi Backpacker Buddy!',
        `${senderProf?.display_name || 'Seorang traveler'} ingin terhubung dengan Anda sebagai kawan trip (${match_percentage || 80}% Match).`,
        'community',
        '/backpacker'
      );

      return success(res, conn, 'Buddy connection request sent');
    } catch (err) {
      if (err.message?.includes('contact method') || err.message?.includes('contact')) {
        return error(res, err.message, 400, { code: 'CONTACT_PROFILE_INCOMPLETE', action: 'COMPLETE_CONTACT_PROFILE' });
      }
      return error(res, err.message, 400);
    }
  });

  router.put('/buddies/connections/:id', authenticateToken, (req, res) => {
    try {
      const { action } = req.body; // ACCEPT, REJECT, CANCEL, BLOCK, UNBLOCK, DISCONNECT, END
      const updated = updateBuddyConnectionStatus(req.params.id, req.user.id, action);

      if (action === 'ACCEPT') {
        const acceptorProf = getProfileByUserId(req.user.id);
        const notifyTarget = updated.requester_id === req.user.id ? updated.target_id : updated.requester_id;
        sendNotif(
          notifyTarget,
          'Permintaan Koneksi Diterima! 🎉',
          `${acceptorProf?.display_name || 'Kawan backpacker'} menyetujui koneksi Buddy Anda. Kontak langsung kini dapat diakses!`,
          'community',
          '/backpacker'
        );
      } else if (action === 'DISCONNECT' || action === 'END') {
        const disconnectorProf = getProfileByUserId(req.user.id);
        const notifyTarget = updated.requester_id === req.user.id ? updated.target_id : updated.requester_id;
        sendNotif(
          notifyTarget,
          'Koneksi Buddy Diputuskan',
          `${disconnectorProf?.display_name || 'Kawan backpacker'} memutuskan koneksi kawan trip. Access ke informasi kontak telah ditutup.`,
          'community',
          '/backpacker'
        );
      }

      return success(res, updated, `Buddy connection ${action.toLowerCase()} processed successfully`);
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  router.post('/buddies/report', authenticateToken, (req, res) => {
    try {
      const { target_id, reason, details } = req.body;
      if (!target_id) return error(res, 'Target user ID is required');
      const report = reportUser(req.user.id, target_id, reason, details);
      return success(res, report, 'Report submitted successfully. Thank you for keeping Trexio safe!');
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  // 4. REQUEST & ACTIVITY LIFECYCLE CENTER API
  router.get('/activities', authenticateToken, (req, res) => {
    try {
      const data = getBackpackerRequestsAndActivities(req.user.id);
      return success(res, data);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  router.get('/requests', authenticateToken, (req, res) => {
    try {
      const data = getBackpackerRequestsAndActivities(req.user.id);
      return success(res, data);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  // 5. SHARED RIDE API (CARPOOLING / COST SHARING)
  router.get('/shared-rides', authenticateToken, (req, res) => {
    try {
      const rides = getSharedRides({
        origin: req.query.origin,
        destination: req.query.destination,
        status: req.query.status
      });
      return success(res, rides);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  router.post('/shared-rides', authenticateToken, (req, res) => {
    try {
      if (!req.body.origin || !req.body.destination) {
        return error(res, 'Origin and destination are required');
      }
      if (req.body.booking_reference_id) {
        const validatedRef = validateBookingReference(req.user.id, req.user.email, req.body.booking_reference_id);
        if (validatedRef) {
          req.body.booking_reference_name = validatedRef.product_name;
        }
      }
      const ride = createSharedRide(req.user.id, req.body);
      return success(res, ride, 'Shared ride created');
    } catch (err) {
      if (err.message?.includes('contact method') || err.message?.includes('contact')) {
        return error(res, err.message, 400, { code: 'CONTACT_PROFILE_INCOMPLETE', action: 'COMPLETE_CONTACT_PROFILE' });
      }
      return error(res, err.message, 400);
    }
  });

  router.post('/shared-rides/:id/join', authenticateToken, async (req, res) => {
    try {
      const seats = req.body.seats || 1;
      const note = req.body.note || '';
      const result = requestJoinSharedRide(req.params.id, req.user.id, seats, note);

      // Trigger NOTIFICATION: RIDE_JOIN_REQUEST
      const joinerProf = getProfileByUserId(req.user.id);
      if (result.ride.owner_id !== req.user.id) {
        sendNotif(
          result.ride.owner_id,
          'Permintaan Nebeng Ride Baru! 🚗',
          `${joinerProf?.display_name || 'Seorang traveler'} meminta ${seats} kursi untuk rute ${result.ride.origin} -> ${result.ride.destination}. Buka Activity Center untuk menyetujui.`,
          'booking',
          '/backpacker?tab=activity'
        );
      }

      return success(res, result, 'Permintaan bergabung ke Nebeng Ride berhasil dikirim (PENDING)');
    } catch (err) {
      if (err.message?.includes('contact method') || err.message?.includes('contact')) {
        return error(res, err.message, 400, { code: 'CONTACT_PROFILE_INCOMPLETE', action: 'COMPLETE_CONTACT_PROFILE' });
      }
      return error(res, err.message, 400);
    }
  });

  router.put('/shared-rides/requests/:id', authenticateToken, async (req, res) => {
    try {
      const { action } = req.body; // ACCEPT, REJECT, CANCEL
      if (!action) return error(res, 'Aksi (action) harus ditentukan (ACCEPT, REJECT, CANCEL)');

      const result = await respondToRideRequest(req.params.id, req.user.id, action);
      const userProf = getProfileByUserId(req.user.id);

      if (action === 'ACCEPT') {
        sendNotif(
          result.request.requester_id,
          'Permintaan Nebeng Ride Disetujui! 🎉',
          `${userProf?.display_name || 'Pemilik ride'} telah menyetujui permintaan Anda untuk rute ${result.ride.origin} -> ${result.ride.destination}.`,
          'booking',
          '/backpacker?tab=activity'
        );
      } else if (action === 'REJECT') {
        sendNotif(
          result.request.requester_id,
          'Permintaan Nebeng Ride Belum Diterima',
          `${userProf?.display_name || 'Pemilik ride'} menolak permintaan nebeng untuk rute ${result.ride.origin} -> ${result.ride.destination}.`,
          'booking',
          '/backpacker?tab=activity'
        );
      }

      return success(res, result, `Status permintaan Nebeng Ride berhasil diperbarui (${action})`);
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  router.delete('/shared-rides/:id', authenticateToken, (req, res) => {
    try {
      const cancelledRide = cancelSharedRide(req.params.id, req.user.id);
      return success(res, cancelledRide, 'Nebeng Ride berhasil dibatalkan');
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  // 5. JOURNEY MANAGEMENT & TRACKING API
  router.get('/journeys', authenticateToken, (req, res) => {
    try {
      const journeys = getUserJourneys(req.user.id);
      return success(res, journeys);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  router.post('/journeys', authenticateToken, (req, res) => {
    try {
      if (!req.body.destination) {
        return error(res, 'Destination is required to create a journey');
      }
      if (req.body.booking_reference_id) {
        const validatedRef = validateBookingReference(req.user.id, req.user.email, req.body.booking_reference_id);
        if (validatedRef) {
          req.body.booking_reference_name = validatedRef.product_name;
        }
      }
      const journey = createJourney(req.user.id, req.body);
      return success(res, journey, 'Journey created successfully');
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  router.get('/journeys/:id', authenticateToken, (req, res) => {
    try {
      const detail = getJourneyDetail(req.params.id, req.user.id);
      return success(res, detail);
    } catch (err) {
      return error(res, err.message, 403);
    }
  });

  router.patch('/journeys/:id/status', authenticateToken, (req, res) => {
    try {
      const updated = updateJourneyStatus(req.params.id, req.user.id, req.body.status);

      // Trigger NOTIFICATIONS: JOURNEY_STARTED / JOURNEY_COMPLETED
      try {
        const detail = getJourneyDetail(req.params.id, req.user.id);
        const participantUserIds = (detail.participants || []).map((p) => p.user_id);

        if (req.body.status === 'ACTIVE') {
          participantUserIds.forEach((uid) => {
            sendNotif(
              uid,
              'Journey Dimulai! 🚀',
              `Ekspedisi "${updated.title}" telah RESMI DIMULAI oleh Leader! Selamat berpetualang.`,
              'trip',
              '/backpacker'
            );
          });
        } else if (req.body.status === 'COMPLETED') {
          participantUserIds.forEach((uid) => {
            sendNotif(
              uid,
              'Journey Selesai! 🏁',
              `Ekspedisi "${updated.title}" telah selesai. Cek rangkuman pengeluaran & Split Cost Anda.`,
              'trip',
              '/backpacker'
            );
          });
        }
      } catch (e) {
        console.error('[NOTIF ERR]', e.message);
      }

      return success(res, updated, 'Journey status updated');
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  router.post('/journeys/:id/stops', authenticateToken, (req, res) => {
    try {
      const stop = addJourneyStop(req.params.id, req.user.id, req.body);
      return success(res, stop, 'Journey stop added');
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  router.patch('/journeys/stops/:stopId/status', authenticateToken, (req, res) => {
    try {
      const { status } = req.body;
      const updated = updateJourneyStopStatus(req.params.stopId, req.user.id, status);
      return success(res, updated, `Stop status updated to ${status}`);
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  // OPT-IN Location Tracking & Privacy Controls
  router.post('/journeys/:id/location-consent', authenticateToken, (req, res) => {
    try {
      const { consent } = req.body;
      const record = toggleLocationConsent(req.params.id, req.user.id, !!consent);
      return success(res, record, `Location sharing consent ${consent ? 'enabled' : 'disabled'}`);
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  router.get('/journeys/:id/location-consent', authenticateToken, (req, res) => {
    try {
      const record = getLocationConsentStatus(req.params.id, req.user.id);
      return success(res, record);
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  router.post('/journeys/:id/location', authenticateToken, (req, res) => {
    try {
      const loc = updateParticipantLocation(req.params.id, req.user.id, req.body || {});
      return success(res, loc, 'Location updated');
    } catch (err) {
      return error(res, err.message, 403);
    }
  });

  router.get('/journeys/:id/locations', authenticateToken, (req, res) => {
    try {
      const locations = getJourneyParticipantLocations(req.params.id, req.user.id);
      return success(res, locations);
    } catch (err) {
      return error(res, err.message, 403);
    }
  });

  // 6. EXPENSE & COST SPLIT API
  router.post('/journeys/:id/expenses', authenticateToken, (req, res) => {
    try {
      if (!req.body.title || !req.body.amount) {
        return error(res, 'Title and amount are required for expense');
      }
      if (req.body.booking_reference_id) {
        const validatedRef = validateBookingReference(req.user.id, req.user.email, req.body.booking_reference_id);
        if (validatedRef) {
          req.body.booking_reference_name = validatedRef.product_name;
        }
      }
      const expense = addJourneyExpense(req.params.id, req.user.id, req.body);
      return success(res, expense, 'Expense added successfully');
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  router.get('/journeys/:id/cost-split', authenticateToken, (req, res) => {
    try {
      const summary = calculateJourneyCostSummary(req.params.id);
      return success(res, summary, 'Journey cost split summary retrieved');
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  // Helper endpoint: Get user's existing bookings for linking into Cost Split
  router.get('/my-bookings', authenticateToken, (req, res) => {
    try {
      const myBookings = bookings.filter(
        (b) => b.user_id === req.user.id || b.customer_id === req.user.id || b.email === req.user.email
      );
      return success(res, myBookings);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  // 7. FIND LOCAL TRANSPORT
  router.get('/transport/local', authenticateToken, (req, res) => {
    try {
      const { location = '', destination = '', keyword = '', q = '', date = '', passenger = 1 } = req.query;
      const searchTerm = (keyword || q || '').trim().toLowerCase();
      const locTerm = (location || '').trim().toLowerCase();
      const destTerm = (destination || '').trim().toLowerCase();

      const allTransports = getAllTransportProducts();

      let matchingTransports = allTransports.filter((t) => {
        const title = (t.title || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const loc = (t.location || '').toLowerCase();
        const pickup = (t.pickup_point || '').toLowerCase();
        const dropoff = (t.dropoff_point || t.dropoff || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        const transType = (t.transport_type || '').toLowerCase();
        const specsText = Array.isArray(t.specs) ? t.specs.join(' ').toLowerCase() : '';

        if (locTerm) {
          const matchLoc =
            loc.includes(locTerm) ||
            pickup.includes(locTerm) ||
            title.includes(locTerm) ||
            desc.includes(locTerm) ||
            specsText.includes(locTerm);
          if (!matchLoc) return false;
        }

        if (destTerm) {
          const matchDest =
            loc.includes(destTerm) ||
            dropoff.includes(destTerm) ||
            title.includes(destTerm) ||
            desc.includes(destTerm) ||
            specsText.includes(destTerm);
          if (!matchDest) return false;
        }

        if (searchTerm) {
          const matchSearch =
            title.includes(searchTerm) ||
            desc.includes(searchTerm) ||
            cat.includes(searchTerm) ||
            transType.includes(searchTerm) ||
            specsText.includes(searchTerm) ||
            loc.includes(searchTerm);
          if (!matchSearch) return false;
        }

        return true;
      });

      // Fallback: if specific query returned 0 items, return all available transport options
      if (matchingTransports.length === 0) {
        matchingTransports = allTransports;
      }

      const formattedTransports = matchingTransports.map((t) => {
        const maxCap = t.max_participants || t.available_seats || 12;
        const booked = t.booked_seats || 0;
        const availableSeats = Math.max(1, maxCap - booked);

        const pickupPt = t.pickup_point || (Array.isArray(t.meeting_points) ? t.meeting_points.join(', ') : t.location || 'Meeting Point Kota');
        const dropPt = t.dropoff_point || t.destination || t.location || 'Basecamp Tujuan';
        const schedulesArr = Array.isArray(t.departure_dates) && t.departure_dates.length > 0
          ? t.departure_dates
          : (Array.isArray(t.schedules) ? t.schedules : ['Setiap Hari']);

        return {
          id: t.id,
          product_id: t.id,
          vendor_id: t.vendor_id || null,
          vendor_name: t.vendor_name || 'TREXIO Partner',
          title: t.title,
          slug: t.slug || t.id,
          category: t.category || 'Shuttle & Transportasi',
          transport_type: t.transport_type || t.vehicle_type || 'Angkutan Lokal',
          price: t.price || 150000,
          currency: 'IDR',
          price_unit: t.price_unit || 'trip',
          pickup_point: pickupPt,
          pickup_points: Array.isArray(t.meeting_points) ? t.meeting_points : [pickupPt],
          dropoff_point: dropPt,
          dropoff: dropPt,
          departure_schedules: schedulesArr,
          schedules: schedulesArr,
          available_seats: availableSeats,
          availability: availableSeats,
          distance: t.distance || '45 km',
          duration: t.duration || `${t.duration_days || 1} Hari / Trip`,
          cover_image: t.cover_image || t.image,
          description: t.description || '',
          specs: t.specs || [],
          vendor_badge: t.vendor_badge || t.badge || 'Partner Resmi Trexio'
        };
      });

      return success(res, {
        query: { location, destination, keyword: searchTerm, date, passenger },
        count: formattedTransports.length,
        items: formattedTransports
      });
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  // 8. FIND YOUR ROUTE (INTEGRATION WITH EXISTING SHUTTLE & TRANSPORTATION MARKETPLACE SUPPLY)
  router.get('/routes/search', authenticateToken, (req, res) => {
    try {
      const {
        origin = 'Jakarta',
        destination = 'Sembalun',
        date = '2026-09-01',
        passenger = 1,
        budget = 2000000,
        preference = 'BALANCED'
      } = req.query;

      // Filter existing transportation & shuttle products from marketplace supply
      const transportProducts = getAllTransportProducts();

      const p1 = transportProducts[0] || {
        id: 'cat_shut_00',
        vendor_id: null,
        price: 150000,
        title: 'Shuttle VIP Jakarta/Bandung ke Basecamp Cibodas Gede'
      };
      const p2 = transportProducts[1] || {
        id: 'cat_shut_02',
        vendor_id: null,
        price: 120000,
        title: 'Shuttle Executive HiAce Bandara Lombok ↔ Sembalun'
      };

      // Construct route options for all 4 priorities: CHEAPEST, FASTEST, BALANCED, FEWEST_TRANSFERS
      const routeResults = [
        {
          route_id: `route_cheap_${Date.now()}`,
          name: 'Rute Ekonomis (Cheapest - Shuttle & Angkutan Lokal)',
          type: 'CHEAPEST',
          origin: origin || 'Jakarta',
          destination: destination || 'Sembalun',
          total_price: 650000,
          estimated_duration: '18 jam',
          transfer_count: 2,
          segments: [
            {
              segment_id: 'seg_c1',
              mode: 'Bus Executive / Shuttle',
              from: origin || 'Jakarta',
              to: 'Surabaya / Banyuwangi',
              duration: '10 jam',
              price: 350000,
              product_id: p1.id,
              vendor_id: p1.vendor_id || null,
              availability: 8
            },
            {
              segment_id: 'seg_c2',
              mode: 'Kapal Ferry / Shuttle Pelabuhan',
              from: 'Banyuwangi',
              to: 'Lombok (Lembar/Mataram)',
              duration: '5 jam',
              price: 180000,
              product_id: p2.id,
              vendor_id: p2.vendor_id || null,
              availability: 12
            },
            {
              segment_id: 'seg_c3',
              mode: 'Angkutan Lokal / Mini Shuttle',
              from: 'Mataram',
              to: destination || 'Sembalun',
              duration: '3 jam',
              price: 120000,
              product_id: null,
              vendor_id: null,
              availability: 15
            }
          ]
        },
        {
          route_id: `route_fast_${Date.now()}`,
          name: 'Rute Tercepat (Fastest - Flight + Direct Basecamp Shuttle)',
          type: 'FASTEST',
          origin: origin || 'Jakarta',
          destination: destination || 'Sembalun',
          total_price: 1450000,
          estimated_duration: '5 jam',
          transfer_count: 1,
          segments: [
            {
              segment_id: 'seg_f1',
              mode: 'Penerbangan Domestik',
              from: `${origin || 'Jakarta'} (CGK/HLP)`,
              to: 'Bandara Lombok (LOP)',
              duration: '2 jam',
              price: 1100000,
              product_id: null,
              vendor_id: null,
              availability: 20
            },
            {
              segment_id: 'seg_f2',
              mode: 'Official Basecamp Shuttle',
              from: 'Bandara Lombok (LOP)',
              to: `${destination || 'Sembalun'} Basecamp`,
              duration: '3 jam',
              price: 350000,
              product_id: p1.id,
              vendor_id: p1.vendor_id || null,
              availability: 6
            }
          ]
        },
        {
          route_id: `route_bal_${Date.now()}`,
          name: 'Rute Seimbang (Balanced - Executive Travel Shuttle)',
          type: 'BALANCED',
          origin: origin || 'Jakarta',
          destination: destination || 'Sembalun',
          total_price: 950000,
          estimated_duration: '12 jam',
          transfer_count: 1,
          segments: [
            {
              segment_id: 'seg_b1',
              mode: 'Travel / Executive Van',
              from: origin || 'Jakarta',
              to: 'Mataram Lombok',
              duration: '9 jam',
              price: 700000,
              product_id: p1.id,
              vendor_id: p1.vendor_id || null,
              availability: 5
            },
            {
              segment_id: 'seg_b2',
              mode: 'Shuttle Transportasi',
              from: 'Mataram',
              to: destination || 'Sembalun',
              duration: '3 jam',
              price: 250000,
              product_id: p2.id,
              vendor_id: p2.vendor_id || null,
              availability: 10
            }
          ]
        },
        {
          route_id: `route_fewest_${Date.now()}`,
          name: 'Rute Tanpa Transit (Fewest Transfer - Direct Overland Travel)',
          type: 'FEWEST_TRANSFERS',
          origin: origin || 'Jakarta',
          destination: destination || 'Sembalun',
          total_price: 1050000,
          estimated_duration: '16 jam',
          transfer_count: 0,
          segments: [
            {
              segment_id: 'seg_dt1',
              mode: 'Direct Intercity Overland Bus & Shuttle',
              from: origin || 'Jakarta',
              to: `${destination || 'Sembalun'} Basecamp`,
              duration: '16 jam',
              price: 1050000,
              product_id: p1.id,
              vendor_id: p1.vendor_id || null,
              availability: 7
            }
          ]
        }
      ];

      return success(res, {
        query: { origin, destination, date, passenger, budget, preference },
        supply_count: transportProducts.length,
        results: routeResults
      });
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  // --- USER ASSISTANCE & SUGGESTED MATCHES ENDPOINTS ---
  router.get('/assistance-requests/my', authenticateToken, async (req, res) => {
    try {
      const requests = getUserAssistanceRequests(req.user.id);
      return success(res, requests);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  router.get('/suggested-matches/my', authenticateToken, async (req, res) => {
    try {
      const recommendations = getUserGuidedRecommendations(req.user.id);
      return success(res, recommendations);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  router.post('/assistance-requests', authenticateToken, async (req, res) => {
    try {
      const { travel_intent_id, reason } = req.body;
      if (!travel_intent_id) return error(res, 'travel_intent_id is required', 400);

      const request = createAssistanceRequest(req.user.id, travel_intent_id, reason);
      return success(res, request, 'Permintaan bantuan kawan trip berhasil dikirim ke Super Admin');
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  router.post('/suggested-matches/:id/respond', authenticateToken, async (req, res) => {
    try {
      const { action } = req.body; // 'ACCEPT' or 'REJECT'
      if (!action || !['ACCEPT', 'REJECT'].includes(action)) {
        return error(res, 'Action MUST be ACCEPT or REJECT', 400);
      }

      const connection = respondToSuggestedMatch(req.user.id, req.params.id, action);
      const isMutual = connection.status === 'ACCEPTED' || connection.mutual_consent === true;
      const msg = isMutual
        ? 'Kedua belah pihak telah menyetujui! Kontak yang diotorisasi sekarang dapat diakses.'
        : action === 'ACCEPT'
        ? 'Persetujuan Anda telah dicatat. Menunggu konfirmasi dari calon partner.'
        : 'Rekomendasi kawan trip ditolak.';

      if (notifyUser) {
        try {
          const partnerId = String(connection.requester_id) === String(req.user.id) ? connection.target_id : connection.requester_id;
          notifyUser(partnerId, {
            type: 'BACKPACKER_MATCH_RESPONSE',
            title: isMutual ? 'Match Berhasil! Kontak Terbuka 🎉' : 'Update Rekomendasi Kawan Trip',
            message: isMutual
              ? 'Calon partner Anda juga menyetujui rekomendasi Super Admin! Silakan lihat kontak pribadi di Backpacker Dashboard.'
              : `Status rekomendasi kawan trip diperbarui (${action}).`,
            connection_id: connection.id
          });
        } catch (e) {
          // Non-blocking
        }
      }

      return success(res, connection, msg);
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  // --- SUPER ADMIN OPERATIONS CENTER ENDPOINTS ---
  const requireSuperAdmin = (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const role = req.user.role || '';
    const roles = req.user.roles || [];
    const isSuper = role === 'super_admin' || role === 'platform_admin' || roles.includes('super_admin') || roles.includes('platform_admin') || req.user.email === 'farhanfadliansyah@gmail.com';
    if (!isSuper) {
      return res.status(403).json({ success: false, error: 'Access denied: Requires Trexio Super Admin credentials', code: 'FORBIDDEN_PERMISSION' });
    }
    next();
  };

  router.get('/admin/overview', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const overview = getAdminOverview();
      return success(res, overview);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  router.get('/admin/intents', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const list = getAdminTravelIntents(req.query);
      return success(res, list);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  router.put('/admin/intents/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const updated = updateAdminTravelIntent(req.params.id, req.body);
      return success(res, updated, 'Status Travel Intent berhasil diperbarui oleh Admin');
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  router.get('/admin/rides', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const list = getAdminSharedRides(req.query);
      return success(res, list);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  router.put('/admin/rides/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const updated = updateAdminSharedRide(req.params.id, req.body);
      return success(res, updated, 'Status Shared Ride berhasil diperbarui oleh Admin');
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  router.get('/admin/journeys', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const list = getAdminJourneysAndCostSplits(req.query);
      return success(res, list);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  router.get('/admin/assistance-requests', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const list = getAdminAssistanceRequests(req.query);
      return success(res, list);
    } catch (err) {
      return error(res, err.message, 500);
    }
  });

  router.get('/admin/assistance-candidates/:intentId', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const candidates = await getAssistanceCandidates(req.params.intentId);
      return success(res, candidates);
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  router.post('/admin/assistance-requests/:id/suggest', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { candidate_intent_id, admin_note } = req.body;
      if (!candidate_intent_id) return error(res, 'candidate_intent_id is required', 400);

      const result = suggestMatchByAdmin(req.params.id, candidate_intent_id, req.user.id || req.user.email, admin_note);

      if (notifyUser) {
        try {
          // Notify requester
          notifyUser(result.connection.requester_id, {
            type: 'BACKPACKER_MATCH_SUGGESTION',
            title: 'Rekomendasi Terbimbing dari Super Admin Trexio',
            message: 'Super Admin telah menemukan rekomendasi kawan trip untuk Anda! Silakan buka Bantuan Matching untuk meninjau.',
            connection_id: result.connection.id
          });
          // Notify candidate
          notifyUser(result.connection.target_id, {
            type: 'BACKPACKER_MATCH_SUGGESTION',
            title: 'Rekomendasi Terbimbing dari Super Admin Trexio',
            message: 'Super Admin Trexio merekomendasikan Anda sebagai kawan trip pendakian. Silakan tinjau dan tanggapi di Backpacker Dashboard.',
            connection_id: result.connection.id
          });
        } catch (e) {
          // Non-blocking notification failure
        }
      }

      return success(res, result, 'Rekomendasi kawan trip terbimbing berhasil dikirim ke kedua calon partner!');
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  router.post('/admin/assistance-requests/:id/close', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
      const { admin_note, status_reason } = req.body;
      const result = closeAssistanceRequest(req.params.id, req.user.id || req.user.email, admin_note, status_reason || 'NO_MATCH');
      return success(res, result, 'Permintaan bantuan matching berhasil ditutup.');
    } catch (err) {
      return error(res, err.message, 400);
    }
  });

  return router;
}

module.exports = { createBackpackerRouter };
