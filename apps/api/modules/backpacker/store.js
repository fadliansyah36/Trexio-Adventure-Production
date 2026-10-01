/**
 * TREXIO BACKPACKER - DATABASE & STORE ENGINE
 * Manages Backpacker data persistence in /data/db_backpacker_*.json
 * Strictly enforces state machines, concurrency locks, and ownership validation.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// PostgreSQL-backed request-scoped data context.
// No process-global business collections and no filesystem persistence are permitted.
const { AsyncLocalStorage } = require('async_hooks');
const appDocumentRepository = require('../repositories/appDocumentRepository');
const { v4: uuidv4 } = require('uuid');

const COLLECTIONS = {
  profiles: 'backpacker_profiles',
  intents: 'backpacker_travel_intents',
  journeys: 'backpacker_journeys',
  stops: 'backpacker_journey_stops',
  participants: 'backpacker_journey_participants',
  expenses: 'backpacker_journey_expenses',
  rides: 'backpacker_shared_rides',
  ride_participants: 'backpacker_shared_ride_participants',
  ride_requests: 'backpacker_shared_ride_requests',
  connections: 'backpacker_connections',
  reports: 'backpacker_reports',
  location_consents: 'backpacker_location_consents',
  locations: 'backpacker_locations',
  assistance_requests: 'backpacker_assistance_requests'
};

const backpackerContext = new AsyncLocalStorage();

function currentContext() {
  const ctx = backpackerContext.getStore();
  if (!ctx) throw new Error('Backpacker data context is not initialized for this request.');
  return ctx;
}

function collectionKey(document) {
  return document && (document.id || document.booking_code || document.tx_id || document.order_id || document.code || document.slug || null);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function createBackpackerRequestContext() {
  const collections = {};
  const snapshots = {};
  for (const [name, repositoryCollection] of Object.entries(COLLECTIONS)) {
    const documents = await appDocumentRepository.list(repositoryCollection);
    collections[name] = Array.isArray(documents) ? documents : [];
    snapshots[name] = new Map(collections[name].filter(Boolean).map((doc) => [String(collectionKey(doc)), JSON.stringify(doc)]));
  }
  return {
    collections,
    snapshots,
    writeChains: new Map(),
    pending: new Set()
  };
}

async function runBackpackerRequestContext(next) {
  const ctx = await createBackpackerRequestContext();
  return backpackerContext.run(ctx, () => next());
}

// Compatibility accessor: the object itself contains no business state.
// All collections are request-scoped snapshots hydrated from PostgreSQL.
const db = new Proxy({}, {
  get(_target, property) {
    if (typeof property !== 'string') return undefined;
    return currentContext().collections[property];
  },
  set(_target, property, value) {
    if (typeof property !== 'string') return false;
    currentContext().collections[property] = value;
    return true;
  }
});

async function persistCollectionSnapshot(name) {
  const ctx = currentContext();
  const repositoryCollection = COLLECTIONS[name];
  if (!repositoryCollection) throw new Error(`Unknown Backpacker collection: ${name}`);
  const current = Array.isArray(ctx.collections[name]) ? ctx.collections[name] : [];
  const before = ctx.snapshots[name] || new Map();
  const after = new Map(current.filter(Boolean).map((doc) => [String(collectionKey(doc)), doc]));

  for (const [id, doc] of after) {
    if (!id || JSON.stringify(doc) !== before.get(id)) {
      await appDocumentRepository.save(repositoryCollection, doc);
    }
  }
  for (const id of before.keys()) {
    if (!after.has(id)) await appDocumentRepository.remove(repositoryCollection, id);
  }
  ctx.snapshots[name] = new Map(Array.from(after.entries()).map(([id, doc]) => [id, JSON.stringify(doc)]));
}

function saveCollection(key) {
  const ctx = currentContext();
  const previous = ctx.writeChains.get(key) || Promise.resolve();
  const operation = previous.then(() => persistCollectionSnapshot(key));
  ctx.writeChains.set(key, operation);
  ctx.pending.add(operation);
  operation.then(() => ctx.pending.delete(operation), () => ctx.pending.delete(operation));
  return operation;
}

async function flushBackpackerRequestContext() {
  const ctx = currentContext();
  while (ctx.pending.size) {
    await Promise.all(Array.from(ctx.pending));
  }
}

// Concurrency Mutex Lock Map for ephemeral coordination only; no business data is stored here.
const locks = new Map();

async function acquireLock(key) {
  while (locks.get(key)) await new Promise((r) => setTimeout(r, 20));
  locks.set(key, true);
}

function releaseLock(key) {
  locks.delete(key);
}

// ==========================================
// STORE API HELPERS & STATE MACHINES
// ==========================================

// --- CONTACT SANITIZATION & PRIVACY HELPERS ---
function sanitizeContactInput(input, type) {
  if (!input || typeof input !== 'string') return '';
  let clean = input.replace(/<[^>]*>/g, '').trim();
  if (type === 'WHATSAPP' || type === 'PHONE') {
    clean = clean.replace(/[^0-9+]/g, '');
    if (clean.length < 8) return '';
  } else if (type === 'INSTAGRAM') {
    clean = clean.replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '').slice(0, 30);
  }
  return clean;
}

function hasValidContact(userId) {
  const prof = getProfileByUserId(userId);
  if (!prof) return false;
  const wa = sanitizeContactInput(prof.whatsapp_number || prof.phone || '', 'WHATSAPP');
  const ig = sanitizeContactInput(prof.instagram_username || prof.instagram || '', 'INSTAGRAM');
  return Boolean(wa || ig);
}

// --- BACKPACKER PROFILE ---
function getProfileByUserId(userId) {
  return db.profiles.find((p) => p.user_id === userId) || null;
}

function upsertProfile(userId, profileData) {
  let prof = getProfileByUserId(userId);
  const now = new Date().toISOString();

  const waNumber = sanitizeContactInput(profileData.whatsapp_number || profileData.phone || profileData.whatsapp || '', 'WHATSAPP');
  const igHandle = sanitizeContactInput(profileData.instagram_username || profileData.instagram || '', 'INSTAGRAM');
  const preferredContact = ['WHATSAPP', 'INSTAGRAM'].includes(profileData.preferred_contact)
    ? profileData.preferred_contact
    : (waNumber ? 'WHATSAPP' : (igHandle ? 'INSTAGRAM' : 'WHATSAPP'));
  const contactVis = ['CONNECTIONS_ONLY', 'MUTUAL_ONLY', 'HIDDEN'].includes(profileData.contact_visibility)
    ? profileData.contact_visibility
    : 'CONNECTIONS_ONLY';

  if (prof) {
    Object.assign(prof, profileData, {
      whatsapp_number: waNumber || prof.whatsapp_number || '',
      phone: waNumber || prof.phone || '',
      instagram_username: igHandle || prof.instagram_username || '',
      preferred_contact: preferredContact,
      contact_visibility: contactVis,
      updated_at: now
    });
  } else {
    prof = {
      id: `bp_prof_${uuidv4().substring(0, 8)}`,
      user_id: userId,
      display_name: profileData.display_name || 'Backpacker',
      bio: profileData.bio || '',
      hiking_level: profileData.hiking_level || 'Beginner',
      preferred_style: profileData.preferred_style || 'BUDGET',
      budget_min: Number(profileData.budget_min) || 0,
      budget_max: Number(profileData.budget_max) || 0,
      whatsapp_number: waNumber,
      phone: waNumber,
      instagram_username: igHandle,
      preferred_contact: preferredContact,
      contact_visibility: contactVis,
      privacy_settings: profileData.privacy_settings || { show_phone: false, show_email: false, show_location: false },
      verified_status: 'UNVERIFIED',
      created_at: now,
      updated_at: now
    };
    db.profiles.push(prof);
  }
  saveCollection('profiles');
  return prof;
}

// --- TRAVEL INTENTS ---
const INTENT_STATUS = ['DRAFT', 'ACTIVE', 'MATCHING', 'CLOSED', 'CANCELLED'];

function getTravelIntents(filters = {}) {
  let list = db.intents.filter((i) => i.status !== 'CANCELLED');
  if (filters.userId) {
    list = list.filter((i) => i.user_id === filters.userId);
  }
  if (filters.status) {
    list = list.filter((i) => i.status === filters.status);
  }
  if (filters.destination) {
    const q = filters.destination.toLowerCase();
    list = list.filter((i) => i.destination && i.destination.toLowerCase().includes(q));
  }
  if (filters.origin) {
    const q = filters.origin.toLowerCase();
    list = list.filter((i) => i.origin && i.origin.toLowerCase().includes(q));
  }
  return list;
}

function createTravelIntent(userId, data) {
  if (!hasValidContact(userId)) {
    throw new Error('At least one contact method (WhatsApp number or Instagram handle) is required in your profile before creating a travel intent.');
  }
  const now = new Date().toISOString();
  const newIntent = {
    id: `intent_${uuidv4().substring(0, 8)}`,
    user_id: userId,
    booking_reference_id: data.booking_reference_id || null,
    booking_reference_name: data.booking_reference_name || null,
    origin: data.origin || 'Jakarta',
    destination: data.destination || 'Sembalun',
    travel_date: data.travel_date || new Date().toISOString().split('T')[0],
    end_date: data.end_date || null,
    budget_min: Number(data.budget_min) || 0,
    budget_max: Number(data.budget_max) || 0,
    route_preference: data.route_preference || 'BALANCED', // CHEAPEST, FASTEST, BALANCED, FEWEST_TRANSFER
    travel_style: data.travel_style || 'ADVENTURE',
    number_of_travelers: Number(data.number_of_travelers) || 1,
    adventure_preference: data.adventure_preference || '',
    status: INTENT_STATUS.includes(data.status) ? data.status : 'ACTIVE',
    privacy_setting: data.privacy_setting || 'PUBLIC', // PUBLIC, BUDDIES_ONLY, PRIVATE
    created_at: now,
    updated_at: now
  };
  db.intents.push(newIntent);
  saveCollection('intents');
  return newIntent;
}

function updateTravelIntent(id, userId, data) {
  const intent = db.intents.find((i) => i.id === id);
  if (!intent) throw new Error('Travel intent not found');
  if (intent.user_id !== userId) throw new Error('Unauthorized update access');

  const now = new Date().toISOString();
  if (data.status && INTENT_STATUS.includes(data.status)) {
    intent.status = data.status;
  }
  ['origin', 'destination', 'travel_date', 'end_date', 'budget_min', 'budget_max', 'route_preference', 'travel_style', 'number_of_travelers', 'adventure_preference', 'privacy_setting', 'booking_reference_id', 'booking_reference_name'].forEach((key) => {
    if (data[key] !== undefined) intent[key] = data[key];
  });
  intent.updated_at = now;
  saveCollection('intents');
  return intent;
}

// --- BUDDY CONNECTIONS & MATCHING ---
function calculateBuddyMatch(intentA, intentB) {
  let score = 0;
  let checks = 0;

  // Destination Match (30%)
  checks++;
  if (intentA.destination && intentB.destination && intentA.destination.toLowerCase().trim() === intentB.destination.toLowerCase().trim()) {
    score += 30;
  } else if (intentA.destination && intentB.destination && (intentA.destination.toLowerCase().includes(intentB.destination.toLowerCase()) || intentB.destination.toLowerCase().includes(intentA.destination.toLowerCase()))) {
    score += 20;
  }

  // Travel Date Match (25%)
  checks++;
  if (intentA.travel_date && intentB.travel_date && intentA.travel_date === intentB.travel_date) {
    score += 25;
  } else {
    score += 10;
  }

  // Origin Match (15%)
  checks++;
  if (intentA.origin && intentB.origin && intentA.origin.toLowerCase().trim() === intentB.origin.toLowerCase().trim()) {
    score += 15;
  }

  // Route & Style Match (15%)
  checks++;
  if (intentA.route_preference === intentB.route_preference) score += 10;
  if (intentA.travel_style === intentB.travel_style) score += 5;

  // Budget Overlap (15%)
  checks++;
  const minA = intentA.budget_min || 0;
  const maxA = intentA.budget_max || Infinity;
  const minB = intentB.budget_min || 0;
  const maxB = intentB.budget_max || Infinity;
  if (Math.max(minA, minB) <= Math.min(maxA, maxB)) {
    score += 15;
  }

  return Math.min(100, Math.max(20, score));
}

function getBuddyMatches(userId) {
  const userIntents = db.intents.filter((i) => i.user_id === userId && i.status === 'ACTIVE');
  if (!userIntents.length) return [];

  const otherIntents = db.intents.filter((i) => i.user_id !== userId && i.status === 'ACTIVE' && i.privacy_setting !== 'PRIVATE');
  const matches = [];

  for (const myIntent of userIntents) {
    for (const otherIntent of otherIntents) {
      const percentage = calculateBuddyMatch(myIntent, otherIntent);
      if (percentage >= 50) {
        const otherProfile = getProfileByUserId(otherIntent.user_id);
        const connection = db.connections.find(
          (c) => (c.requester_id === userId && c.target_id === otherIntent.user_id) || (c.target_id === userId && c.requester_id === otherIntent.user_id)
        );
        matches.push({
          match_percentage: percentage,
          my_intent: myIntent,
          buddy_intent: otherIntent,
          buddy_profile: otherProfile ? {
            display_name: otherProfile.display_name,
            bio: otherProfile.bio,
            hiking_level: otherProfile.hiking_level,
            verified_status: otherProfile.verified_status
          } : null,
          connection_status: connection ? connection.status : 'NONE'
        });
      }
    }
  }

  return matches.sort((a, b) => b.match_percentage - a.match_percentage);
}

function requestBuddyConnection(requesterId, targetId, matchPercentage = 80, sourceFeature = 'FIND_YOUR_BUDDY') {
  if (requesterId === targetId) throw new Error('Cannot request buddy connection with yourself');

  // Contact Requirement Validation
  if (!hasValidContact(requesterId)) {
    throw new Error('At least one contact method (WhatsApp number or Instagram handle) is required in your profile before requesting connections.');
  }

  let conn = db.connections.find(
    (c) => (c.requester_id === requesterId && c.target_id === targetId) || (c.target_id === requesterId && c.requester_id === targetId)
  );

  const now = new Date().toISOString();
  if (conn) {
    if (conn.status === 'BLOCKED') throw new Error('Koneksi diblokir oleh pengguna');
    if (conn.status === 'PENDING') throw new Error('Permintaan koneksi sudah dikirim dan menunggu persetujuan');
    if (conn.status === 'ACCEPTED' || conn.status === 'CONNECTED') throw new Error('Anda sudah terhubung dengan traveler ini');

    conn.status = 'PENDING';
    conn.requester_id = requesterId;
    conn.target_id = targetId;
    conn.source_feature = sourceFeature;
    conn.match_percentage = matchPercentage;
    conn.updated_at = now;
  } else {
    conn = {
      id: `conn_${uuidv4().substring(0, 8)}`,
      requester_id: requesterId,
      target_id: targetId,
      status: 'PENDING', // PENDING, ACCEPTED, REJECTED, CANCELLED, BLOCKED, ENDED
      source_feature: sourceFeature, // FIND_YOUR_BUDDY, SHARE_YOUR_RIDE, SPLIT_YOUR_COST, TRACK_YOUR_JOURNEY
      match_percentage: matchPercentage,
      created_at: now,
      updated_at: now,
      accepted_at: null,
      rejected_at: null,
      cancelled_at: null,
      ended_at: null,
      blocked_at: null
    };
    db.connections.push(conn);
  }
  saveCollection('connections');
  return conn;
}

function updateBuddyConnectionStatus(connectionId, userId, action) {
  const conn = db.connections.find((c) => c.id === connectionId);
  if (!conn) throw new Error('Connection request not found');
  if (conn.target_id !== userId && conn.requester_id !== userId) {
    throw new Error('Unauthorized connection update');
  }

  const validActions = ['ACCEPT', 'REJECT', 'CANCEL', 'BLOCK', 'UNBLOCK', 'DISCONNECT', 'END'];
  if (!validActions.includes(action)) throw new Error(`Action '${action}' is not supported`);

  const now = new Date().toISOString();

  if (action === 'CANCEL') {
    if (conn.status !== 'PENDING') throw new Error('Hanya permintaan status PENDING yang dapat dibatalkan');
    conn.status = 'CANCELLED';
    conn.cancelled_at = now;
  } else if (action === 'ACCEPT') {
    if (conn.target_id !== userId) throw new Error('Akses ditolak: Hanya penerima permintaan yang dapat menyetujui koneksi');
    conn.status = 'ACCEPTED';
    conn.accepted_at = now;
  } else if (action === 'REJECT') {
    if (conn.target_id !== userId) throw new Error('Akses ditolak: Hanya penerima permintaan yang dapat menolak koneksi');
    conn.status = 'REJECTED';
    conn.rejected_at = now;
  } else if (action === 'DISCONNECT' || action === 'END') {
    if (conn.status !== 'ACCEPTED' && conn.status !== 'CONNECTED') throw new Error('Hanya koneksi aktif yang dapat diputuskan');
    conn.status = 'ENDED';
    conn.ended_at = now;
  } else if (action === 'BLOCK') {
    conn.status = 'BLOCKED';
    conn.blocked_at = now;
  } else if (action === 'UNBLOCK') {
    if (conn.status === 'BLOCKED') {
      conn.status = 'CANCELLED';
      conn.updated_at = now;
    }
  }

  conn.updated_at = now;
  saveCollection('connections');
  return conn;
}

function getAuthorizedContactInfo(requestingUserId, targetUserId) {
  const targetProf = getProfileByUserId(targetUserId);
  if (!targetProf) throw new Error('Target profile not found');

  if (requestingUserId === targetUserId) {
    return {
      is_connected: true,
      display_name: targetProf.display_name,
      whatsapp_number: targetProf.whatsapp_number || targetProf.phone || '',
      instagram_username: targetProf.instagram_username || targetProf.instagram || '',
      preferred_contact: targetProf.preferred_contact || 'WHATSAPP'
    };
  }

  // Check active connection record
  const activeConn = db.connections.find(
    (c) =>
      ((c.requester_id === requestingUserId && c.target_id === targetUserId) ||
       (c.requester_id === targetUserId && c.target_id === requestingUserId)) &&
      (c.status === 'ACCEPTED' || c.status === 'CONNECTED')
  );

  // Check if both users are accepted participants in the same active shared ride
  const sharedRideAuth = db.ride_participants?.some(p1 =>
    p1.user_id === requestingUserId && p1.status === 'CONFIRMED' &&
    db.ride_participants.some(p2 => p2.user_id === targetUserId && p2.status === 'CONFIRMED' && p2.shared_ride_id === p1.shared_ride_id)
  ) || db.rides?.some(r =>
    (r.owner_id === requestingUserId || r.owner_id === targetUserId) &&
    db.ride_participants?.some(p => p.shared_ride_id === r.id && p.status === 'CONFIRMED' && (p.user_id === requestingUserId || p.user_id === targetUserId))
  );

  // Check if both users are participants in the same active journey
  const sharedJourneyAuth = db.participants?.some(p1 =>
    p1.user_id === requestingUserId && p1.status === 'JOINED' &&
    db.participants?.some(p2 => p2.user_id === targetUserId && p2.status === 'JOINED' && p2.journey_id === p1.journey_id)
  ) || db.journeys?.some(j =>
    (j.owner_id === requestingUserId || j.owner_id === targetUserId) &&
    db.participants?.some(p => p.journey_id === j.id && p.status === 'JOINED' && (p.user_id === requestingUserId || p.user_id === targetUserId))
  );

  const isAuthorized = Boolean(activeConn || sharedRideAuth || sharedJourneyAuth);

  if (isAuthorized) {
    return {
      is_connected: true,
      display_name: targetProf.display_name,
      whatsapp_number: targetProf.whatsapp_number || targetProf.phone || '',
      instagram_username: targetProf.instagram_username || targetProf.instagram || '',
      preferred_contact: targetProf.preferred_contact || 'WHATSAPP',
      source_feature: activeConn?.source_feature || 'CONNECTED_TRIP'
    };
  }

  return {
    is_connected: false,
    message: 'Kontak tersedia setelah connection diterima',
    whatsapp_number: null,
    instagram_username: null,
    preferred_contact: null
  };
}

function getUserConnections(userId) {
  return db.connections.filter(
    (c) => (c.requester_id === userId || c.target_id === userId) && c.status !== 'REJECTED'
  );
}

// --- SHARED RIDE (ATOMIC CAPACITY LOCK) ---
const RIDE_STATUS = ['OPEN', 'FULL', 'CLOSED', 'CANCELLED', 'COMPLETED'];

function getSharedRides(filters = {}) {
  let list = db.rides.filter((r) => r.status !== 'CANCELLED');
  if (filters.origin) {
    const q = filters.origin.toLowerCase();
    list = list.filter((r) => r.origin && r.origin.toLowerCase().includes(q));
  }
  if (filters.destination) {
    const q = filters.destination.toLowerCase();
    list = list.filter((r) => r.destination && r.destination.toLowerCase().includes(q));
  }
  if (filters.status) {
    list = list.filter((r) => r.status === filters.status);
  }
  return list;
}

function createSharedRide(userId, data) {
  if (!hasValidContact(userId)) {
    throw new Error('At least one contact method (WhatsApp number or Instagram handle) is required in your profile before creating a shared ride offer.');
  }
  const now = new Date().toISOString();
  const capacity = Math.max(1, Number(data.capacity) || 4);
  const estCost = Number(data.estimated_cost) || 0;
  const costPerPerson = Math.round(estCost / capacity);

  const newRide = {
    id: `ride_${uuidv4().substring(0, 8)}`,
    owner_id: userId,
    booking_reference_id: data.booking_reference_id || null,
    booking_reference_name: data.booking_reference_name || null,
    origin: data.origin || 'Bandara Lombok (LOP)',
    destination: data.destination || 'Sembalun',
    date: data.date || new Date().toISOString().split('T')[0],
    departure_time: data.departure_time || '10:00',
    vehicle_info: data.vehicle_info || 'Shared Transport Van',
    product_id: data.product_id || null,
    capacity: capacity,
    available_seats: capacity - 1, // Owner takes 1 seat
    estimated_cost: estCost,
    cost_per_person: costPerPerson,
    status: 'OPEN',
    created_at: now,
    updated_at: now
  };

  db.rides.push(newRide);
  db.ride_participants.push({
    id: `ride_part_${uuidv4().substring(0, 8)}`,
    shared_ride_id: newRide.id,
    user_id: userId,
    seats_booked: 1,
    status: 'CONFIRMED',
    joined_at: now
  });

  saveCollection('rides');
  saveCollection('ride_participants');
  return newRide;
}

async function joinSharedRide(rideId, userId, seats = 1) {
  const lockKey = `ride_lock_${rideId}`;
  await acquireLock(lockKey);

  try {
    const ride = db.rides.find((r) => r.id === rideId);
    if (!ride) throw new Error('Shared ride not found');
    if (ride.status !== 'OPEN') throw new Error(`Shared ride is currently ${ride.status}`);

    const existingPart = db.ride_participants.find(
      (p) => p.shared_ride_id === rideId && p.user_id === userId && p.status === 'CONFIRMED'
    );
    if (existingPart) throw new Error('You have already joined this shared ride');

    const requestedSeats = Math.max(1, Number(seats) || 1);
    if (ride.available_seats < requestedSeats) {
      throw new Error(`Only ${ride.available_seats} seat(s) available in this ride`);
    }

    const now = new Date().toISOString();
    ride.available_seats -= requestedSeats;
    if (ride.available_seats <= 0) {
      ride.status = 'FULL';
    }
    ride.updated_at = now;

    const newPart = {
      id: `ride_part_${uuidv4().substring(0, 8)}`,
      shared_ride_id: rideId,
      user_id: userId,
      seats_booked: requestedSeats,
      status: 'CONFIRMED',
      joined_at: now
    };

    db.ride_participants.push(newPart);
    saveCollection('rides');
    saveCollection('ride_participants');

    return { ride, participant: newPart };
  } finally {
    releaseLock(lockKey);
  }
}

function requestJoinSharedRide(rideId, requesterId, seats = 1, note = '') {
  if (!hasValidContact(requesterId)) {
    throw new Error('At least one contact method (WhatsApp number or Instagram handle) is required in your profile before requesting to join a shared ride.');
  }
  const ride = db.rides.find((r) => r.id === rideId);
  if (!ride) throw new Error('Shared ride not found');
  if (ride.status !== 'OPEN') throw new Error(`Shared ride is currently ${ride.status}`);
  if (ride.owner_id === requesterId) throw new Error('Anda adalah pemilik Nebeng Ride ini');

  const existingPart = db.ride_participants.find(
    (p) => p.shared_ride_id === rideId && p.user_id === requesterId && p.status === 'CONFIRMED'
  );
  if (existingPart) throw new Error('Anda sudah bergabung sebagai peserta di Nebeng Ride ini');

  const existingPending = db.ride_requests.find(
    (r) => r.shared_ride_id === rideId && r.requester_id === requesterId && r.status === 'PENDING'
  );
  if (existingPending) throw new Error('Anda sudah memiliki permintaan bergabung yang sedang diproses (PENDING)');

  const requestedSeats = Math.max(1, Number(seats) || 1);
  if (ride.available_seats < requestedSeats) {
    throw new Error(`Hanya tersisa ${ride.available_seats} kursi pada Nebeng Ride ini`);
  }

  const now = new Date().toISOString();
  const newReq = {
    id: `ride_req_${uuidv4().substring(0, 8)}`,
    shared_ride_id: rideId,
    requester_id: requesterId,
    seats_requested: requestedSeats,
    note: note || '',
    status: 'PENDING',
    created_at: now,
    updated_at: now,
    resolved_by: null
  };

  db.ride_requests.push(newReq);
  saveCollection('ride_requests');
  return { request: newReq, ride };
}

async function respondToRideRequest(requestId, userId, action) {
  const req = db.ride_requests.find((r) => r.id === requestId);
  if (!req) throw new Error('Permintaan bergabung tidak ditemukan');

  const ride = db.rides.find((r) => r.id === req.shared_ride_id);
  if (!ride) throw new Error('Nebeng Ride tidak ditemukan');

  const now = new Date().toISOString();

  if (action === 'CANCEL') {
    if (req.requester_id !== userId && ride.owner_id !== userId) {
      throw new Error('Akses dibatalkan: Anda bukan pemilik request');
    }
    if (req.status !== 'PENDING') throw new Error('Hanya request PENDING yang dapat dibatalkan');
    req.status = 'CANCELLED';
    req.updated_at = now;
    req.resolved_by = userId;
    saveCollection('ride_requests');
    return { request: req, ride };
  }

  if (ride.owner_id !== userId) {
    throw new Error('Akses ditolak: Hanya pemilik Nebeng Ride yang dapat menyetujui/menolak');
  }

  if (req.status !== 'PENDING') {
    throw new Error(`Permintaan sudah diproses dengan status: ${req.status}`);
  }

  if (action === 'ACCEPT') {
    const lockKey = `ride_lock_${ride.id}`;
    await acquireLock(lockKey);
    try {
      if (ride.available_seats < req.seats_requested) {
        throw new Error(`Sisa kursi tidak cukup (${ride.available_seats} kursi tersisa)`);
      }
      ride.available_seats -= req.seats_requested;
      if (ride.available_seats <= 0) {
        ride.status = 'FULL';
      }
      ride.updated_at = now;

      const newPart = {
        id: `ride_part_${uuidv4().substring(0, 8)}`,
        shared_ride_id: ride.id,
        user_id: req.requester_id,
        seats_booked: req.seats_requested,
        status: 'CONFIRMED',
        joined_at: now
      };

      db.ride_participants.push(newPart);
      req.status = 'ACCEPTED';
      req.updated_at = now;
      req.resolved_by = userId;

      // Auto-establish connection between ride owner and requester
      let conn = db.connections.find(
        (c) => (c.requester_id === req.requester_id && c.target_id === userId) || (c.target_id === req.requester_id && c.requester_id === userId)
      );
      if (conn) {
        conn.status = 'ACCEPTED';
        conn.source_feature = 'SHARE_YOUR_RIDE';
        conn.updated_at = now;
        conn.accepted_at = now;
      } else {
        db.connections.push({
          id: `conn_${uuidv4().substring(0, 8)}`,
          requester_id: req.requester_id,
          target_id: userId,
          status: 'ACCEPTED',
          source_feature: 'SHARE_YOUR_RIDE',
          match_percentage: 100,
          created_at: now,
          updated_at: now,
          accepted_at: now
        });
      }

      saveCollection('rides');
      saveCollection('ride_participants');
      saveCollection('ride_requests');
      saveCollection('connections');

      return { request: req, ride, participant: newPart };
    } finally {
      releaseLock(lockKey);
    }
  } else if (action === 'REJECT') {
    req.status = 'REJECTED';
    req.updated_at = now;
    req.resolved_by = userId;
    saveCollection('ride_requests');
    return { request: req, ride };
  } else {
    throw new Error(`Aksi '${action}' tidak valid`);
  }
}

function cancelSharedRide(rideId, ownerId) {
  const ride = db.rides.find((r) => r.id === rideId);
  if (!ride) throw new Error('Nebeng Ride tidak ditemukan');
  if (ride.owner_id !== ownerId) throw new Error('Akses ditolak: Hanya pemilik Nebeng Ride yang dapat membatalkan');

  const now = new Date().toISOString();
  ride.status = 'CANCELLED';
  ride.updated_at = now;

  db.ride_requests.forEach((req) => {
    if (req.shared_ride_id === rideId && req.status === 'PENDING') {
      req.status = 'RIDE_CANCELLED';
      req.updated_at = now;
      req.resolved_by = ownerId;
    }
  });

  saveCollection('rides');
  saveCollection('ride_requests');
  return ride;
}

function getBackpackerRequestsAndActivities(userId) {
  const outgoingRideRequests = db.ride_requests
    .filter((r) => r.requester_id === userId)
    .map((r) => {
      const ride = db.rides.find((rideItem) => rideItem.id === r.shared_ride_id);
      const ownerProf = ride ? getProfileByUserId(ride.owner_id) : null;
      return {
        ...r,
        ride_info: ride ? {
          id: ride.id,
          origin: ride.origin,
          destination: ride.destination,
          date: ride.date,
          departure_time: ride.departure_time,
          vehicle_info: ride.vehicle_info,
          cost_per_person: ride.cost_per_person,
          owner_id: ride.owner_id,
          owner_name: ownerProf?.display_name || 'Teman Backpacker'
        } : null
      };
    });

  const myRideIds = db.rides.filter((r) => r.owner_id === userId).map((r) => r.id);
  const incomingRideRequests = db.ride_requests
    .filter((r) => myRideIds.includes(r.shared_ride_id))
    .map((r) => {
      const ride = db.rides.find((rideItem) => rideItem.id === r.shared_ride_id);
      const reqProf = getProfileByUserId(r.requester_id);
      return {
        ...r,
        ride_info: ride ? {
          id: ride.id,
          origin: ride.origin,
          destination: ride.destination,
          date: ride.date,
          departure_time: ride.departure_time,
          available_seats: ride.available_seats,
          status: ride.status
        } : null,
        requester_profile: reqProf ? {
          display_name: reqProf.display_name,
          hiking_level: reqProf.hiking_level,
          bio: reqProf.bio,
          verified_status: reqProf.verified_status
        } : null
      };
    });

  const incomingBuddyRequests = db.connections
    .filter((c) => c.target_id === userId && c.status === 'PENDING')
    .map((c) => {
      const senderProf = getProfileByUserId(c.requester_id);
      return {
        ...c,
        requester_profile: senderProf ? {
          display_name: senderProf.display_name,
          hiking_level: senderProf.hiking_level,
          bio: senderProf.bio,
          verified_status: senderProf.verified_status
        } : null
      };
    });

  const outgoingBuddyRequests = db.connections
    .filter((c) => c.requester_id === userId)
    .map((c) => {
      const targetProf = getProfileByUserId(c.target_id);
      return {
        ...c,
        target_profile: targetProf ? {
          display_name: targetProf.display_name,
          hiking_level: targetProf.hiking_level,
          bio: targetProf.bio,
          verified_status: targetProf.verified_status
        } : null
      };
    });

  const myRides = db.rides
    .filter((r) => r.owner_id === userId)
    .map((r) => {
      const pendingCount = db.ride_requests.filter(
        (req) => req.shared_ride_id === r.id && req.status === 'PENDING'
      ).length;
      const participants = db.ride_participants
        .filter((p) => p.shared_ride_id === r.id && p.status === 'CONFIRMED')
        .map((p) => {
          const prof = getProfileByUserId(p.user_id);
          return {
            ...p,
            display_name: prof?.display_name || 'Traveler',
            hiking_level: prof?.hiking_level
          };
        });
      return {
        ...r,
        pending_requests_count: pendingCount,
        participants: participants
      };
    });

  const joinedRideIds = db.ride_participants
    .filter((p) => p.user_id === userId && p.status === 'CONFIRMED')
    .map((p) => p.shared_ride_id);

  const joinedRides = db.rides
    .filter((r) => joinedRideIds.includes(r.id) && r.owner_id !== userId)
    .map((r) => {
      const ownerProf = getProfileByUserId(r.owner_id);
      return {
        ...r,
        owner_name: ownerProf?.display_name || 'Pemilik Ride'
      };
    });

  const actionRequiredCount =
    incomingRideRequests.filter((r) => r.status === 'PENDING').length +
    incomingBuddyRequests.length;

  return {
    outgoing_ride_requests: outgoingRideRequests,
    incoming_ride_requests: incomingRideRequests,
    incoming_buddy_requests: incomingBuddyRequests,
    outgoing_buddy_requests: outgoingBuddyRequests,
    my_shared_rides: myRides,
    joined_shared_rides: joinedRides,
    action_required_count: actionRequiredCount
  };
}

// --- JOURNEYS & JOURNEY STOPS ---
const JOURNEY_STATUS = ['PLANNED', 'ACTIVE', 'PAUSED', 'STOPPED', 'COMPLETED', 'CANCELLED'];

function getUserJourneys(userId) {
  const myParticipantJourneys = db.participants
    .filter((p) => p.user_id === userId && p.status === 'JOINED')
    .map((p) => p.journey_id);

  return db.journeys.filter(
    (j) => (j.owner_id === userId || myParticipantJourneys.includes(j.id)) && j.status !== 'CANCELLED'
  );
}

function createJourney(userId, data) {
  const now = new Date().toISOString();
  const journey = {
    id: `journey_${uuidv4().substring(0, 8)}`,
    owner_id: userId,
    booking_reference_id: data.booking_reference_id || null,
    booking_reference_name: data.booking_reference_name || null,
    title: data.title || `Journey to ${data.destination || 'Adventure'}`,
    origin: data.origin || 'Jakarta',
    destination: data.destination || 'Sembalun',
    start_date: data.start_date || new Date().toISOString().split('T')[0],
    end_date: data.end_date || null,
    status: 'PLANNED',
    created_at: now,
    updated_at: now
  };

  db.journeys.push(journey);
  db.participants.push({
    id: `part_${uuidv4().substring(0, 8)}`,
    journey_id: journey.id,
    user_id: userId,
    role: 'OWNER',
    status: 'JOINED',
    joined_at: now
  });

  // Default Stops if provided
  if (Array.isArray(data.stops) && data.stops.length > 0) {
    data.stops.forEach((stop, idx) => {
      db.stops.push({
        id: `stop_${uuidv4().substring(0, 8)}`,
        journey_id: journey.id,
        sequence: idx + 1,
        location: stop.location || 'Checkpoint',
        arrival_time: stop.arrival_time || null,
        departure_time: stop.departure_time || null,
        status: 'PENDING',
        related_product_id: stop.related_product_id || null,
        related_booking_id: stop.related_booking_id || null,
        created_at: now
      });
    });
  }

  saveCollection('journeys');
  saveCollection('participants');
  saveCollection('stops');

  return journey;
}

function getJourneyDetail(journeyId, userId) {
  const journey = db.journeys.find((j) => j.id === journeyId);
  if (!journey) throw new Error('Journey not found');

  const participants = db.participants.filter((p) => p.journey_id === journeyId);
  const isParticipant = participants.some((p) => p.user_id === userId && p.status === 'JOINED');
  if (journey.owner_id !== userId && !isParticipant) {
    throw new Error('Unauthorized journey access');
  }

  const stops = db.stops.filter((s) => s.journey_id === journeyId).sort((a, b) => a.sequence - b.sequence);
  const expenses = db.expenses.filter((e) => e.journey_id === journeyId);

  return {
    ...journey,
    stops,
    participants,
    expenses
  };
}

function updateJourneyStatus(journeyId, userId, newStatus) {
  const journey = db.journeys.find((j) => j.id === journeyId);
  if (!journey) throw new Error('Journey not found');
  if (journey.owner_id !== userId) throw new Error('Only journey owner can change status');
  if (!JOURNEY_STATUS.includes(newStatus)) throw new Error('Invalid status transition');

  const now = new Date().toISOString();
  journey.status = newStatus;
  journey.updated_at = now;
  saveCollection('journeys');
  return journey;
}

function addJourneyStop(journeyId, userId, stopData) {
  const journey = db.journeys.find((j) => j.id === journeyId);
  if (!journey) throw new Error('Journey not found');
  if (journey.owner_id !== userId) throw new Error('Unauthorized stop addition');

  const existingStops = db.stops.filter((s) => s.journey_id === journeyId);
  const now = new Date().toISOString();

  const newStop = {
    id: `stop_${uuidv4().substring(0, 8)}`,
    journey_id: journeyId,
    sequence: existingStops.length + 1,
    location: stopData.location || 'New Stop',
    arrival_time: stopData.arrival_time || null,
    departure_time: stopData.departure_time || null,
    status: 'PENDING',
    related_product_id: stopData.related_product_id || null,
    related_booking_id: stopData.related_booking_id || null,
    created_at: now
  };

  db.stops.push(newStop);
  saveCollection('stops');
  return newStop;
}

// --- JOURNEY EXPENSES & COST SPLIT ---
function addJourneyExpense(journeyId, userId, expenseData) {
  const journey = db.journeys.find((j) => j.id === journeyId);
  if (!journey) throw new Error('Journey not found');

  const isParticipantOrOwner =
    journey.owner_id === userId ||
    db.participants.some((p) => p.journey_id === journeyId && p.user_id === userId && p.status === 'JOINED');
  if (!isParticipantOrOwner) {
    throw new Error('Akses ditolak: Hanya anggota resmi Journey yang dapat menambah pengeluaran');
  }

  const now = new Date().toISOString();
  const totalAmount = Number(expenseData.amount) || 0;
  if (totalAmount <= 0) throw new Error('Expense amount must be greater than 0');

  const splitModel = (expenseData.split_model || 'EQUAL').toUpperCase(); // EQUAL, CUSTOM, PERCENTAGE
  const participants = db.participants.filter((p) => p.journey_id === journeyId && p.status === 'JOINED');
  
  // If no joined participants exist, assign owner as single participant
  const activeUserIds = participants.length > 0 
    ? participants.map((p) => p.user_id) 
    : [journey.owner_id];

  let allocations = [];

  if (splitModel === 'EQUAL') {
    const perPerson = Math.round(totalAmount / activeUserIds.length);
    allocations = activeUserIds.map((uid) => ({
      user_id: uid,
      amount: perPerson,
      percentage: Math.round((100 / activeUserIds.length) * 10) / 10,
      paid: uid === userId
    }));
  } else if (splitModel === 'PERCENTAGE') {
    const customAlloc = expenseData.allocations || [];
    const totalPct = customAlloc.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0);
    if (Math.abs(totalPct - 100) > 1) {
      throw new Error('Total split percentage must equal 100%');
    }
    allocations = customAlloc.map((a) => ({
      user_id: a.user_id,
      percentage: Number(a.percentage),
      amount: Math.round((totalAmount * Number(a.percentage)) / 100),
      paid: a.user_id === userId
    }));
  } else if (splitModel === 'CUSTOM') {
    const customAlloc = expenseData.allocations || [];
    const totalAllocated = customAlloc.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    if (Math.abs(totalAllocated - totalAmount) > 10) {
      throw new Error(`Custom allocations sum (Rp ${totalAllocated.toLocaleString()}) must match total expense (Rp ${totalAmount.toLocaleString()})`);
    }
    allocations = customAlloc.map((a) => ({
      user_id: a.user_id,
      amount: Number(a.amount),
      percentage: Math.round((Number(a.amount) / totalAmount) * 100),
      paid: a.user_id === userId
    }));
  }

  const newExpense = {
    id: `exp_${uuidv4().substring(0, 8)}`,
    journey_id: journeyId,
    payer_id: userId,
    title: expenseData.title || 'Trip Expense',
    category: expenseData.category || 'Other', // Transport, Accommodation, Rental Gear, Food, Other
    amount: totalAmount,
    split_model: splitModel,
    allocations,
    source_type: expenseData.booking_reference_id ? 'EXISTING_BOOKING' : (expenseData.source_type || 'MANUAL'),
    source_id: expenseData.booking_reference_id || expenseData.source_id || null,
    booking_reference_id: expenseData.booking_reference_id || null,
    booking_reference_name: expenseData.booking_reference_name || null,
    created_at: now
  };

  db.expenses.push(newExpense);
  saveCollection('expenses');
  return newExpense;
}

function calculateJourneyCostSummary(journeyId) {
  const journey = db.journeys.find((j) => j.id === journeyId);
  if (!journey) throw new Error('Journey not found');

  const expenses = db.expenses.filter((e) => e.journey_id === journeyId);
  const participants = db.participants.filter((p) => p.journey_id === journeyId);
  const participantUserIds = Array.from(new Set([journey.owner_id, ...participants.map((p) => p.user_id)]));

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Group by category
  const byCategory = {};
  expenses.forEach((e) => {
    const cat = e.category || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + Number(e.amount || 0);
  });

  // Calculate user paid vs assigned balances
  const userBalances = {};
  participantUserIds.forEach((uid) => {
    const prof = db.profiles.find((p) => p.user_id === uid);
    userBalances[uid] = {
      user_id: uid,
      display_name: prof?.display_name || (uid === journey.owner_id ? 'Journey Leader' : 'Backpacker Participant'),
      total_paid: 0,
      total_assigned: 0,
      net_balance: 0,
      status: 'SETTLED'
    };
  });

  expenses.forEach((e) => {
    // Credit the payer
    if (userBalances[e.payer_id]) {
      userBalances[e.payer_id].total_paid += Number(e.amount || 0);
    } else {
      userBalances[e.payer_id] = {
        user_id: e.payer_id,
        display_name: 'Payer',
        total_paid: Number(e.amount || 0),
        total_assigned: 0,
        net_balance: 0,
        status: 'SETTLED'
      };
    }

    // Debit allocated participants
    if (Array.isArray(e.allocations)) {
      e.allocations.forEach((alloc) => {
        if (!userBalances[alloc.user_id]) {
          userBalances[alloc.user_id] = {
            user_id: alloc.user_id,
            display_name: 'Participant',
            total_paid: 0,
            total_assigned: 0,
            net_balance: 0,
            status: 'SETTLED'
          };
        }
        userBalances[alloc.user_id].total_assigned += Number(alloc.amount || 0);
      });
    }
  });

  // Calculate Net Balances
  const participantSummaries = Object.values(userBalances).map((b) => {
    const net = b.total_paid - b.total_assigned;
    let status = 'SETTLED';
    if (net > 500) status = 'RECEIVES_REFUND';
    else if (net < -500) status = 'OWES_PAYMENT';

    return {
      ...b,
      net_balance: net,
      status
    };
  });

  return {
    journey_id: journeyId,
    total_expense: totalExpenseAmount,
    total_expenses_count: expenses.length,
    by_category: byCategory,
    participant_balances: participantSummaries,
    expenses
  };
}

// --- REPORT USER / BUDDY ---
function reportUser(reporterId, targetId, reason, details = '') {
  if (reporterId === targetId) throw new Error('Cannot report yourself');
  const now = new Date().toISOString();
  const report = {
    id: `rep_${uuidv4().substring(0, 8)}`,
    reporter_id: reporterId,
    target_id: targetId,
    reason: reason || 'SPAM_ABUSE',
    details: details || '',
    status: 'SUBMITTED',
    created_at: now
  };
  db.reports.push(report);
  saveCollection('reports');
  return report;
}

// --- STOP STATUS UPDATE ---
function updateJourneyStopStatus(stopId, userId, newStatus) {
  const stop = db.stops.find((s) => s.id === stopId);
  if (!stop) throw new Error('Journey stop not found');
  const journey = db.journeys.find((j) => j.id === stop.journey_id);
  if (!journey) throw new Error('Parent journey not found');

  const participants = db.participants.filter((p) => p.journey_id === journey.id);
  const isParticipant = participants.some((p) => p.user_id === userId && p.status === 'JOINED');
  if (journey.owner_id !== userId && !isParticipant) {
    throw new Error('Unauthorized stop update');
  }

  const validStatuses = ['PENDING', 'ARRIVED', 'COMPLETED'];
  if (!validStatuses.includes(newStatus)) throw new Error('Invalid stop status');

  const now = new Date().toISOString();
  stop.status = newStatus;
  if (newStatus === 'ARRIVED' && !stop.arrival_time) stop.arrival_time = now;
  if (newStatus === 'COMPLETED' && !stop.departure_time) stop.departure_time = now;

  saveCollection('stops');
  return stop;
}

// --- OPT-IN LOCATION TRACKING & CONSENT SECURITY ---
function toggleLocationConsent(journeyId, userId, consentBool) {
  const journey = db.journeys.find((j) => j.id === journeyId);
  if (!journey) throw new Error('Journey not found');

  const now = new Date().toISOString();
  let item = db.location_consents.find((c) => c.journey_id === journeyId && c.user_id === userId);

  if (item) {
    item.consent = !!consentBool;
    item.updated_at = now;
  } else {
    item = {
      id: `loc_consent_${uuidv4().substring(0, 8)}`,
      journey_id: journeyId,
      user_id: userId,
      consent: !!consentBool,
      created_at: now,
      updated_at: now
    };
    db.location_consents.push(item);
  }

  // Retention Purge Policy: If consent is revoked, purge cached live location immediately
  if (!consentBool) {
    db.locations = db.locations.filter((l) => !(l.journey_id === journeyId && l.user_id === userId));
    saveCollection('locations');
  }

  saveCollection('location_consents');
  return item;
}

function updateParticipantLocation(journeyId, userId, coords = {}) {
  const consentRecord = db.location_consents.find((c) => c.journey_id === journeyId && c.user_id === userId);
  if (!consentRecord || !consentRecord.consent) {
    throw new Error('Location sharing is OPT-IN only. Please enable location sharing consent first.');
  }

  const now = new Date().toISOString();
  let loc = db.locations.find((l) => l.journey_id === journeyId && l.user_id === userId);

  if (loc) {
    loc.lat = coords.lat || loc.lat;
    loc.lng = coords.lng || loc.lng;
    loc.heading = coords.heading || 0;
    loc.speed = coords.speed || 0;
    loc.location_name = coords.location_name || loc.location_name;
    loc.updated_at = now;
  } else {
    loc = {
      id: `loc_${uuidv4().substring(0, 8)}`,
      journey_id: journeyId,
      user_id: userId,
      lat: coords.lat || -8.38,
      lng: coords.lng || 116.42,
      heading: coords.heading || 0,
      speed: coords.speed || 0,
      location_name: coords.location_name || 'GPS Active Checkpoint',
      updated_at: now
    };
    db.locations.push(loc);
  }

  saveCollection('locations');
  return loc;
}

function getJourneyParticipantLocations(journeyId, requestingUserId) {
  const journey = db.journeys.find((j) => j.id === journeyId);
  if (!journey) throw new Error('Journey not found');

  const participants = db.participants.filter((p) => p.journey_id === journeyId);
  const isParticipant = participants.some((p) => p.user_id === requestingUserId && p.status === 'JOINED');
  if (journey.owner_id !== requestingUserId && !isParticipant) {
    throw new Error('Unauthorized location access');
  }

  // Get active consents for this journey
  const consents = db.location_consents.filter((c) => c.journey_id === journeyId && c.consent === true);
  const consentedUserIds = consents.map((c) => c.user_id);

  // Return locations ONLY for users who explicitly granted consent
  return db.locations
    .filter((l) => l.journey_id === journeyId && consentedUserIds.includes(l.user_id))
    .map((l) => {
      const prof = getProfileByUserId(l.user_id);
      return {
        ...l,
        display_name: prof?.display_name || 'Journey Buddy',
        hiking_level: prof?.hiking_level
      };
    });
}

function getLocationConsentStatus(journeyId, userId) {
  const item = db.location_consents.find((c) => c.journey_id === journeyId && c.user_id === userId);
  return { journey_id: journeyId, user_id: userId, consent: item ? !!item.consent : false };
}

// ==========================================
// SUPER ADMIN & MEDIATED MATCHING FUNCTIONS (Phase N7)
// ==========================================

function createAssistanceRequest(userId, intentId, reason = '') {
  const intent = db.intents.find(i => i.id === intentId && i.user_id === userId);
  if (!intent) throw new Error('Travel intent tidak ditemukan untuk akun ini.');

  const existing = db.assistance_requests.find(a => a.travel_intent_id === intentId && ['OPEN', 'IN_REVIEW', 'SUGGESTED', 'WAITING_USER_RESPONSE'].includes(a.status));
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const req = {
    id: `ast_req_${uuidv4().substring(0, 8)}`,
    user_id: userId,
    travel_intent_id: intentId,
    destination: intent.destination,
    travel_date: intent.travel_date,
    booking_reference_id: intent.booking_reference_id || null,
    booking_reference_name: intent.booking_reference_name || null,
    reason: reason || 'Membutuhkan bantuan rekomendasi kawan perjalanan terbimbing dari Super Admin Trexio',
    status: 'OPEN', // OPEN, IN_REVIEW, SUGGESTED, WAITING_USER_RESPONSE, WAITING_PARTNER_RESPONSE, MUTUAL_ACCEPTED, CONNECTED, REJECTED, NO_MATCH, RESOLVED, CANCELLED
    suggested_candidate_id: null,
    suggested_intent_id: null,
    assigned_admin: null,
    admin_notes: [],
    created_at: now,
    updated_at: now
  };

  db.assistance_requests.unshift(req);
  saveCollection('assistance_requests');
  return req;
}

function getUserAssistanceRequests(userId) {
  const list = db.assistance_requests.filter(r => String(r.user_id) === String(userId));
  return list.map(req => {
    const intent = db.intents.find(i => i.id === req.travel_intent_id);
    const candProf = req.suggested_candidate_id ? getProfileByUserId(req.suggested_candidate_id) : null;
    const conn = db.connections.find(c => c.assistance_request_id === req.id || (c.intent_id === req.travel_intent_id && (c.requester_id === userId || c.target_id === userId)));

    return {
      ...req,
      travel_intent: intent || null,
      connection_id: conn ? conn.id : null,
      connection_status: conn ? conn.status : null,
      candidate_profile: candProf ? {
        display_name: candProf.display_name || 'Kawan Trexio',
        hiking_level: candProf.hiking_level || 'Hiker',
        travel_style: candProf.preferred_style || 'Backpacker'
      } : null
    };
  });
}

function getUserGuidedRecommendations(userId) {
  // Find all connections suggested by admin where user is requester or candidate
  const list = db.connections.filter(c =>
    (String(c.requester_id) === String(userId) || String(c.target_id) === String(userId)) &&
    ['ADMIN_SUGGESTED', 'PENDING', 'ACCEPTED_BY_REQUESTER', 'ACCEPTED_BY_CANDIDATE', 'ACCEPTED', 'CONNECTED', 'REJECTED'].includes(c.status)
  );

  return list.map(conn => {
    const isRequester = String(conn.requester_id) === String(userId);
    const partnerId = isRequester ? conn.target_id : conn.requester_id;
    const partnerProf = getProfileByUserId(partnerId);
    const partnerIntentId = isRequester ? conn.target_intent_id : conn.intent_id;
    const partnerIntent = db.intents.find(i => i.id === partnerIntentId);

    const isMutualAccepted = conn.status === 'ACCEPTED' || conn.status === 'CONNECTED' || conn.mutual_consent === true;
    const myConsent = isRequester ? conn.accepted_by_requester : conn.accepted_by_candidate;
    const partnerConsent = isRequester ? conn.accepted_by_candidate : conn.accepted_by_requester;

    let authorizedContacts = null;
    if (isMutualAccepted) {
      try {
        authorizedContacts = getAuthorizedContactInfo(userId, partnerId);
      } catch (e) {
        // Fallback
      }
    }

    return {
      id: conn.id,
      connection_id: conn.id,
      assistance_request_id: conn.assistance_request_id || null,
      is_requester: isRequester,
      partner_id: partnerId,
      partner_name: partnerProf?.display_name || 'Kawan Pendaki',
      partner_hiking_level: partnerProf?.hiking_level || 'Junior Hiker',
      partner_travel_style: partnerProf?.preferred_style || partnerIntent?.travel_style || 'Backpacker',
      partner_bio: partnerProf?.bio || '',
      partner_intent: partnerIntent || null,
      match_score: conn.match_score || 85,
      match_reasons: conn.match_reasons || ['Destinasi Kompatibel'],
      status: conn.status,
      my_consent: !!myConsent,
      partner_consent: !!partnerConsent,
      is_mutual_accepted: isMutualAccepted,
      authorized_contacts: authorizedContacts,
      created_at: conn.created_at,
      updated_at: conn.updated_at
    };
  });
}

function getAdminAssistanceRequests(filter = {}) {
  const { status, q } = filter;
  let list = [...db.assistance_requests];
  if (status) list = list.filter(r => r.status === status);
  if (q) {
    const ql = q.toLowerCase();
    list = list.filter(r => (r.destination && r.destination.toLowerCase().includes(ql)) || (r.reason && r.reason.toLowerCase().includes(ql)));
  }

  return list.map(req => {
    const prof = getProfileByUserId(req.user_id);
    const intent = db.intents.find(i => i.id === req.travel_intent_id);
    const candProf = req.suggested_candidate_id ? getProfileByUserId(req.suggested_candidate_id) : null;
    const conn = db.connections.find(c => c.assistance_request_id === req.id);

    return {
      ...req,
      user_name: prof?.display_name || 'Backpacker',
      user_level: prof?.hiking_level || 'Junior Hiker',
      travel_intent: intent || null,
      connection_status: conn ? conn.status : null,
      candidate_profile: candProf ? { display_name: candProf.display_name, hiking_level: candProf.hiking_level } : null
    };
  });
}

async function getAssistanceCandidates(intentId) {
  const intent = db.intents.find(i => i.id === intentId);
  if (!intent) throw new Error('Travel intent not found');

  // Filter out blocked users
  const activeReports = db.reports || [];
  const isBlocked = (u1, u2) => activeReports.some(r =>
    (String(r.reporter_id) === String(u1) && String(r.reported_user_id) === String(u2) && r.action === 'BLOCK') ||
    (String(r.reporter_id) === String(u2) && String(r.reported_user_id) === String(u1) && r.action === 'BLOCK')
  );

  const otherIntents = db.intents.filter(i =>
    i.id !== intentId &&
    String(i.user_id) !== String(intent.user_id) &&
    i.status === 'ACTIVE' &&
    !isBlocked(intent.user_id, i.user_id)
  );

  const baselineCandidates = [];

  for (const other of otherIntents) {
    const score = calculateBuddyMatch(intent, other);
    if (score >= 20) {
      const prof = getProfileByUserId(other.user_id);
      const reasons = [];
      if (intent.destination?.toLowerCase().trim() === other.destination?.toLowerCase().trim()) reasons.push(`Destinasi Sama (${other.destination})`);
      if (intent.travel_date === other.travel_date) reasons.push(`Tanggal Sama (${other.travel_date})`);
      if (intent.origin?.toLowerCase().trim() === other.origin?.toLowerCase().trim()) reasons.push(`Kota Asal Sama (${other.origin})`);
      if (intent.travel_style === other.travel_style) reasons.push(`Gaya Perjalanan Cocok (${other.travel_style})`);
      if (intent.booking_reference_id && other.booking_reference_id && intent.booking_reference_id === other.booking_reference_id) {
        reasons.unshift(`⭐ Booking Reference Marketplace Sama (${intent.booking_reference_name || 'Verified Booking'})`);
      }
      if (reasons.length === 0) reasons.push('Kriteria Anggaran & Rute Kompatibel');

      baselineCandidates.push({
        candidate_intent_id: other.id,
        candidate_user_id: other.user_id,
        display_name: prof?.display_name || 'Kawan Backpacker',
        hiking_level: prof?.hiking_level || 'Junior Hiker',
        travel_style: prof?.preferred_style || other.travel_style,
        bio: prof?.bio || '',
        intent: other,
        match_score: score,
        match_reasons: reasons,
        ai_confidence: score >= 75 ? 'HIGH' : score >= 50 ? 'MEDIUM' : 'LOW'
      });
    }
  }

  // AI Matching Enhancement via Gemini Provider
  let finalCandidates = baselineCandidates.sort((a, b) => b.match_score - a.match_score);
  let lowConfidence = finalCandidates.length === 0 || (finalCandidates[0] && finalCandidates[0].match_score < 45);

  try {
    if (process.env.GEMINI_API_KEY && baselineCandidates.length > 0) {
      const GeminiProvider = require('../ai/providers/gemini-provider');
      const gemini = new GeminiProvider();

      const requesterProf = getProfileByUserId(intent.user_id);
      const promptData = {
        requester: {
          destination: intent.destination,
          travel_date: intent.travel_date,
          origin: intent.origin,
          budget_min: intent.budget_min,
          budget_max: intent.budget_max,
          travel_style: intent.travel_style,
          booking_reference: intent.booking_reference_name || null,
          hiking_level: requesterProf?.hiking_level || 'Junior Hiker'
        },
        candidates: baselineCandidates.slice(0, 10).map(c => ({
          candidate_intent_id: c.candidate_intent_id,
          candidate_user_id: c.candidate_user_id,
          display_name: c.display_name,
          destination: c.intent.destination,
          travel_date: c.intent.travel_date,
          origin: c.intent.origin,
          budget_min: c.intent.budget_min,
          budget_max: c.intent.budget_max,
          travel_style: c.travel_style,
          booking_reference: c.intent.booking_reference_name || null,
          hiking_level: c.hiking_level
        }))
      };

      const aiSystemPrompt = `Anda adalah AI Matching Engine Trexio Backpacker. Tugas Anda adalah mengevaluasi tingkat kompatibilitas kawan perjalanan secara mendalam.
Analisis kesamaan destinasi, fleksibilitas tanggal, kecocokan anggaran, gaya perjalanan, lisensi/level pendakian, serta konteks booking reference marketplace.
Kembalikan JSON terstruktur dengan format:
{
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "evaluated_candidates": [
    {
      "candidate_intent_id": "string",
      "ai_score": number (0-100),
      "ai_reasons": ["string"],
      "explanation": "string"
    }
  ]
}`;

      const aiRes = await gemini.generateStructuredJson(
        `${aiSystemPrompt}\n\nDATA PERMINTAAN MATCHING:\n${JSON.stringify(promptData, null, 2)}`
      );

      if (aiRes && Array.isArray(aiRes.evaluated_candidates)) {
        const evalMap = new Map();
        aiRes.evaluated_candidates.forEach(ec => evalMap.set(ec.candidate_intent_id, ec));

        finalCandidates = finalCandidates.map(c => {
          const evalItem = evalMap.get(c.candidate_intent_id);
          if (evalItem) {
            return {
              ...c,
              match_score: Math.round((c.match_score + (evalItem.ai_score || c.match_score)) / 2),
              match_reasons: evalItem.ai_reasons && evalItem.ai_reasons.length > 0 ? evalItem.ai_reasons : c.match_reasons,
              ai_explanation: evalItem.explanation || 'Evaluasi AI Matching Engine',
              ai_confidence: aiRes.confidence || c.ai_confidence
            };
          }
          return c;
        }).sort((a, b) => b.match_score - a.match_score);

        lowConfidence = aiRes.confidence === 'LOW' || finalCandidates.length === 0 || (finalCandidates[0] && finalCandidates[0].match_score < 45);
      }
    }
  } catch (err) {
    console.warn('[AI Matching Engine] Gemini call skipped/failed, using rule-based scoring:', err.message);
  }

  return {
    candidates: finalCandidates,
    low_confidence: lowConfidence,
    total_candidates: finalCandidates.length
  };
}

function suggestMatchByAdmin(requestId, candidateIntentId, adminUserId, adminNote = '') {
  const req = db.assistance_requests.find(r => r.id === requestId);
  if (!req) throw new Error('Assistance request not found');

  const candIntent = db.intents.find(i => i.id === candidateIntentId);
  if (!candIntent) throw new Error('Candidate travel intent not found');

  const reqIntent = db.intents.find(i => i.id === req.travel_intent_id);
  if (!reqIntent) throw new Error('Original travel intent not found');

  // Blocked user check
  const activeReports = db.reports || [];
  const isBlocked = activeReports.some(rep =>
    (String(rep.reporter_id) === String(req.user_id) && String(rep.reported_user_id) === String(candIntent.user_id) && rep.action === 'BLOCK') ||
    (String(rep.reporter_id) === String(candIntent.user_id) && String(rep.reported_user_id) === String(req.user_id) && rep.action === 'BLOCK')
  );
  if (isBlocked) {
    throw new Error('Akses ditolak: Pengguna ini memblokir atau diblokir oleh kandidat.');
  }

  const score = calculateBuddyMatch(reqIntent, candIntent);
  const reasons = [`Rekomendasi Terbimbing Super Admin Trexio`, `Destinasi: ${reqIntent.destination}`, `Tanggal: ${reqIntent.travel_date}`];
  if (reqIntent.booking_reference_name) {
    reasons.unshift(`Referensi Booking: ${reqIntent.booking_reference_name}`);
  }

  const now = new Date().toISOString();

  // Deactivate existing pending suggestion for this assistance request if any
  const existingConn = db.connections.find(c => c.assistance_request_id === requestId && c.status !== 'ACCEPTED' && c.status !== 'REJECTED');
  if (existingConn) {
    existingConn.status = 'CANCELLED';
  }

  // Create connection with status ADMIN_SUGGESTED
  const conn = {
    id: `conn_${uuidv4().substring(0, 8)}`,
    requester_id: req.user_id,
    target_id: candIntent.user_id,
    intent_id: req.travel_intent_id,
    target_intent_id: candIntent.id,
    status: 'ADMIN_SUGGESTED',
    accepted_by_requester: null,
    accepted_by_candidate: null,
    mutual_consent: false,
    match_score: score,
    match_reasons: reasons,
    suggested_by_admin: adminUserId,
    assistance_request_id: requestId,
    created_at: now,
    updated_at: now
  };

  db.connections.push(conn);
  saveCollection('connections');

  req.status = 'SUGGESTED';
  req.suggested_candidate_id = candIntent.user_id;
  req.suggested_intent_id = candIntent.id;
  req.assigned_admin = adminUserId;
  if (adminNote) req.admin_notes.push({ text: adminNote, created_at: now, admin: adminUserId });
  req.updated_at = now;
  saveCollection('assistance_requests');

  return { connection: conn, assistance_request: req };
}

function respondToSuggestedMatch(userId, connectionId, action) {
  const conn = db.connections.find(c => c.id === connectionId);
  if (!conn) throw new Error('Rekomendasi matching tidak ditemukan.');
  if (!['ADMIN_SUGGESTED', 'PENDING', 'ACCEPTED_BY_REQUESTER', 'ACCEPTED_BY_CANDIDATE'].includes(conn.status)) {
    throw new Error(`Status rekomendasi ('${conn.status}') tidak dapat ditanggapi.`);
  }

  const isRequester = String(conn.requester_id) === String(userId);
  const isCandidate = String(conn.target_id) === String(userId);
  if (!isRequester && !isCandidate) {
    throw new Error('Akses ditolak: Anda bukan bagian dari pemohon atau calon partner rekomendasi ini.');
  }

  const now = new Date().toISOString();

  if (action === 'ACCEPT') {
    if (isRequester) conn.accepted_by_requester = true;
    if (isCandidate) conn.accepted_by_candidate = true;

    // MANDATORY PRIVACY ENGINE: BOTH MUST ACCEPT BEFORE MUTUAL CONSENT & CONTACT UNLOCK
    if (conn.accepted_by_requester === true && conn.accepted_by_candidate === true) {
      conn.status = 'ACCEPTED'; // Connected & Mutual Consent established
      conn.mutual_consent = true;
      conn.mutual_accepted_at = now;
      conn.updated_at = now;
      saveCollection('connections');

      if (conn.assistance_request_id) {
        const ast = db.assistance_requests.find(a => a.id === conn.assistance_request_id);
        if (ast) {
          ast.status = 'CONNECTED';
          ast.resolved_at = now;
          ast.updated_at = now;
          saveCollection('assistance_requests');
        }
      }
    } else {
      // One party accepted, waiting for partner
      conn.status = isRequester ? 'ACCEPTED_BY_REQUESTER' : 'ACCEPTED_BY_CANDIDATE';
      conn.updated_at = now;
      saveCollection('connections');

      if (conn.assistance_request_id) {
        const ast = db.assistance_requests.find(a => a.id === conn.assistance_request_id);
        if (ast) {
          ast.status = 'WAITING_PARTNER_RESPONSE';
          ast.updated_at = now;
          saveCollection('assistance_requests');
        }
      }
    }
  } else if (action === 'REJECT') {
    conn.status = 'REJECTED';
    conn.rejected_by = userId;
    conn.mutual_consent = false;
    conn.updated_at = now;
    saveCollection('connections');

    if (conn.assistance_request_id) {
      const ast = db.assistance_requests.find(a => a.id === conn.assistance_request_id);
      if (ast) {
        ast.status = 'REJECTED';
        ast.updated_at = now;
        saveCollection('assistance_requests');
      }
    }
  } else {
    throw new Error('Action tidak valid. Gunakan ACCEPT atau REJECT.');
  }

  return conn;
}

function closeAssistanceRequest(requestId, adminUserId, adminNote = '', statusReason = 'NO_MATCH') {
  const req = db.assistance_requests.find(r => r.id === requestId);
  if (!req) throw new Error('Assistance request not found');

  const now = new Date().toISOString();
  req.status = statusReason; // e.g. RESOLVED or NO_MATCH or CANCELLED
  req.assigned_admin = adminUserId;
  if (adminNote) req.admin_notes.push({ text: adminNote, created_at: now, admin: adminUserId });
  req.updated_at = now;
  req.resolved_at = now;

  saveCollection('assistance_requests');
  return req;
}

function getAdminOverview() {
  const totalProfiles = db.profiles.length;
  const totalIntents = db.intents.length;
  const activeIntents = db.intents.filter(i => i.status === 'ACTIVE').length;
  const matchedIntents = db.intents.filter(i => i.status === 'MATCHED').length;
  const expiredIntents = db.intents.filter(i => i.status === 'EXPIRED' || i.status === 'CLOSED').length;

  const totalRides = db.rides.length;
  const openRides = db.rides.filter(r => r.status === 'OPEN').length;
  const fullRides = db.rides.filter(r => r.status === 'FULL').length;
  const completedRides = db.rides.filter(r => r.status === 'COMPLETED').length;
  const cancelledRides = db.rides.filter(r => r.status === 'CANCELLED').length;

  const totalJourneys = db.journeys.length;
  const activeJourneys = db.journeys.filter(j => j.status === 'IN_PROGRESS' || j.status === 'PLANNED').length;
  const completedJourneys = db.journeys.filter(j => j.status === 'COMPLETED').length;

  const totalConnections = db.connections.length;
  const acceptedConnections = db.connections.filter(c => c.status === 'ACCEPTED').length;
  const pendingConnections = db.connections.filter(c => c.status === 'PENDING' || c.status === 'ADMIN_SUGGESTED').length;

  const totalAssistance = db.assistance_requests.length;
  const openAssistance = db.assistance_requests.filter(a => a.status === 'OPEN' || a.status === 'IN_REVIEW').length;

  const totalSeats = db.rides.reduce((acc, r) => acc + (r.capacity || 0), 0);
  const bookedSeats = db.rides.reduce((acc, r) => acc + ((r.capacity || 0) - (r.available_seats || 0)), 0);

  const matchRate = totalIntents > 0 ? Math.round((matchedIntents / totalIntents) * 100) : 0;
  const connectionAcceptanceRate = totalConnections > 0 ? Math.round((acceptedConnections / totalConnections) * 100) : 0;
  const seatUtilizationRate = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

  return {
    stats: {
      total_profiles: totalProfiles,
      total_intents: totalIntents,
      active_intents: activeIntents,
      matched_intents: matchedIntents,
      expired_intents: expiredIntents,
      total_rides: totalRides,
      open_rides: openRides,
      full_rides: fullRides,
      completed_rides: completedRides,
      cancelled_rides: cancelledRides,
      total_seats: totalSeats,
      booked_seats: bookedSeats,
      total_journeys: totalJourneys,
      active_journeys: activeJourneys,
      completed_journeys: completedJourneys,
      total_connections: totalConnections,
      accepted_connections: acceptedConnections,
      pending_connections: pendingConnections,
      total_assistance: totalAssistance,
      open_assistance: openAssistance,
      rates: {
        match_rate: matchRate,
        connection_acceptance_rate: connectionAcceptanceRate,
        seat_utilization_rate: seatUtilizationRate
      },
      last_updated: new Date().toISOString()
    }
  };
}

function getAdminTravelIntents(filter = {}) {
  const { status, q } = filter;
  let list = [...db.intents];
  if (status) list = list.filter(i => i.status === status);
  if (q) {
    const ql = q.toLowerCase();
    list = list.filter(i => (i.destination && i.destination.toLowerCase().includes(ql)) || (i.origin && i.origin.toLowerCase().includes(ql)));
  }

  return list.map(intent => {
    const prof = getProfileByUserId(intent.user_id);
    return {
      ...intent,
      user_name: prof?.display_name || 'Traveler',
      user_level: prof?.hiking_level || 'Junior Hiker'
    };
  });
}

function updateAdminTravelIntent(id, data = {}) {
  const intent = db.intents.find(i => i.id === id);
  if (!intent) throw new Error('Travel intent not found');

  const now = new Date().toISOString();
  if (data.status) intent.status = data.status;
  if (data.admin_note) {
    intent.admin_notes = intent.admin_notes || [];
    intent.admin_notes.push({ text: data.admin_note, updated_at: now });
  }
  intent.updated_at = now;
  saveCollection('intents');
  return intent;
}

function getAdminSharedRides(filter = {}) {
  const { status, q } = filter;
  let list = [...db.rides];
  if (status) list = list.filter(r => r.status === status);
  if (q) {
    const ql = q.toLowerCase();
    list = list.filter(r => (r.destination && r.destination.toLowerCase().includes(ql)) || (r.origin && r.origin.toLowerCase().includes(ql)) || (r.vehicle_type && r.vehicle_type.toLowerCase().includes(ql)));
  }

  return list.map(ride => {
    const prof = getProfileByUserId(ride.host_user_id || ride.user_id);
    const requests = db.ride_requests.filter(req => req.shared_ride_id === ride.id);
    return {
      ...ride,
      host_name: prof?.display_name || 'Driver / Host',
      requests_count: requests.length,
      pending_requests_count: requests.filter(req => req.status === 'PENDING').length
    };
  });
}

function updateAdminSharedRide(id, data = {}) {
  const ride = db.rides.find(r => r.id === id);
  if (!ride) throw new Error('Shared ride not found');

  const now = new Date().toISOString();
  if (data.status) ride.status = data.status;
  if (data.admin_note) {
    ride.admin_notes = ride.admin_notes || [];
    ride.admin_notes.push({ text: data.admin_note, updated_at: now });
  }
  ride.updated_at = now;
  saveCollection('rides');
  return ride;
}

function getAdminJourneysAndCostSplits(filter = {}) {
  const { status, q } = filter;
  let list = [...db.journeys];
  if (status) list = list.filter(j => j.status === status);
  if (q) {
    const ql = q.toLowerCase();
    list = list.filter(j => (j.title && j.title.toLowerCase().includes(ql)) || (j.destination && j.destination.toLowerCase().includes(ql)));
  }

  return list.map(j => {
    const ownerProf = getProfileByUserId(j.owner_id);
    const participants = db.participants.filter(p => p.journey_id === j.id);
    const expenses = db.expenses.filter(e => e.journey_id === j.id);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    return {
      ...j,
      owner_name: ownerProf?.display_name || 'Leader',
      participants_count: participants.length,
      expenses_count: expenses.length,
      total_expenses_amount: totalExpenses,
      expenses
    };
  });
}

module.exports = {
  db,
  runBackpackerRequestContext,
  flushBackpackerRequestContext,
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
  sanitizeContactInput,
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
};
