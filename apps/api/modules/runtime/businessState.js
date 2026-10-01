/**
 * TREXIO 10P.2 — Request-scoped business state boundary.
 *
 * Process-global business state is prohibited. Legacy server.js route contracts
 * still use synchronous Array/Object APIs, so this boundary hydrates those
 * contracts from PostgreSQL into AsyncLocalStorage for the lifetime of one
 * request and persists the changed snapshot before the response is committed.
 *
 * This is a transitional compatibility boundary, not a second source of truth.
 */
const { AsyncLocalStorage } = require('async_hooks');
const {
  loadUsersFromSupabasePostgres,
  saveUserToSupabasePostgres,
} = require('../persistence/supabasePostgres');
const appDocumentRepository = require('../repositories/appDocumentRepository');
const vendorRepository = require('../repositories/vendorRepository');
const tripRepository = require('../repositories/tripRepository');
const bookingRepository = require('../repositories/bookingRepository');
const paymentRepository = require('../repositories/paymentRepository');

const storage = new AsyncLocalStorage();

const ARRAY_CONFIG = {
  users: { kind: 'users' },
  vendors: { kind: 'vendor' },
  trips: { kind: 'trip' },
  bookings: { kind: 'booking' },
  payment_transactions: { kind: 'payment' },
};

const APP_COLLECTIONS = [
  'conversations','messages','tenants','tenant_domains','destinations','coupons',
  'communities','community_categories','community_members','community_posts',
  'community_comments','community_events','community_bookmarks','community_reports',
  'community_moderation_logs','community_suspended_users','rentals','rental_orders',
  'push_subscriptions','audit_logs','subscription_plans','tenant_subscriptions',
  'advertising_packages','advertising_campaigns','billing_transactions','wishlists',
  'carts','reviews','notifications','payouts','wallets','incidents','articles',
  'announcements','support_tickets','platform_disputes'
];

const OBJECT_COLLECTIONS = {
  masterLocations: 'master_locations',
  masterRolesPermissions: 'master_roles',
  homepageConfig: 'homepage_config',
  featureFlags: 'feature_flags',
};

function current() {
  const ctx = storage.getStore();
  if (!ctx) throw new Error('Business state accessed outside an authenticated request context.');
  return ctx;
}

async function loadCollection(name) {
  const cfg = ARRAY_CONFIG[name];
  if (cfg?.kind === 'users') return loadUsersFromSupabasePostgres();
  if (cfg?.kind === 'vendor') return vendorRepository.list();
  if (cfg?.kind === 'trip') return tripRepository.list();
  if (cfg?.kind === 'booking') return bookingRepository.list();
  if (cfg?.kind === 'payment') return paymentRepository.list();
  return appDocumentRepository.list(name);
}

async function saveCollection(name, docs, before) {
  const cfg = ARRAY_CONFIG[name];
  const currentDocs = Array.isArray(docs) ? docs : [];
  const previous = new Map((before || []).filter(Boolean).map((d) => [String(d.id || d.uid || d.booking_code || d.tx_id || d.order_id || d.code || d.slug), d]));

  if (cfg?.kind === 'users') {
    for (const doc of currentDocs) {
      if (doc) await saveUserToSupabasePostgres(doc);
    }
    return;
  }

  if (cfg?.kind === 'vendor') {
    for (const doc of currentDocs) if (doc?.id) await vendorRepository.save(doc);
    return;
  }
  if (cfg?.kind === 'trip') {
    const afterIds = new Set();
    for (const doc of currentDocs) if (doc?.id) { afterIds.add(String(doc.id)); await tripRepository.save(doc); }
    for (const id of previous.keys()) if (!afterIds.has(id)) await tripRepository.remove(id);
    return;
  }
  if (cfg?.kind === 'booking') {
    for (const doc of currentDocs) if (doc?.id || doc?.booking_code) await bookingRepository.save(doc);
    return;
  }
  if (cfg?.kind === 'payment') {
    for (const doc of currentDocs) if (doc?.id || doc?.tx_id) await paymentRepository.save(doc);
    return;
  }

  await appDocumentRepository.replace(name, currentDocs);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? null));
}

function createArrayProxy(name) {
  return new Proxy([], {
    get(_target, property) {
      const arr = current().collections[name];
      const value = arr[property];
      return typeof value === 'function' ? value.bind(arr) : value;
    },
    set(_target, property, value) {
      const arr = current().collections[name];
      arr[property] = value;
      current().dirty.add(name);
      return true;
    },
  });
}

function createObjectProxy(name) {
  return new Proxy({}, {
    get(_target, property) {
      return current().objects[name][property];
    },
    set(_target, property, value) {
      current().objects[name][property] = value;
      current().dirty.add(name);
      return true;
    },
    deleteProperty(_target, property) {
      delete current().objects[name][property];
      current().dirty.add(name);
      return true;
    },
    ownKeys() {
      return Reflect.ownKeys(current().objects[name]);
    },
    getOwnPropertyDescriptor(_target, property) {
      if (!(property in current().objects[name])) return undefined;
      return { enumerable: true, configurable: true, value: current().objects[name][property], writable: true };
    },
    has(_target, property) {
      return property in current().objects[name];
    },
  });
}

async function initialize() {
  const names = [...Object.keys(ARRAY_CONFIG), ...APP_COLLECTIONS];
  const collections = {};
  const snapshots = {};
  const loaded = await Promise.all(names.map(async (name) => [name, await loadCollection(name)]));
  for (const [name, docs] of loaded) {
    collections[name] = Array.isArray(docs) ? docs : [];
    snapshots[name] = clone(collections[name]);
  }

  const objects = {};
  const objectSnapshots = {};
  for (const [name, collection] of Object.entries(OBJECT_COLLECTIONS)) {
    const docs = await appDocumentRepository.list(collection);
    objects[name] = docs[0]?.data && typeof docs[0].data === 'object'
      ? docs[0].data
      : (docs[0] && typeof docs[0] === 'object' ? docs[0] : {});
    objectSnapshots[name] = clone(objects[name]);
  }

  return { collections, snapshots, objects, objectSnapshots, dirty: new Set() };
}

async function flush() {
  const ctx = current();
  for (const name of Object.keys(ctx.collections)) {
    const before = ctx.snapshots[name];
    const after = ctx.collections[name];
    if (JSON.stringify(before) !== JSON.stringify(after)) await saveCollection(name, after, before);
  }

  for (const name of Object.keys(OBJECT_COLLECTIONS)) {
    if (JSON.stringify(ctx.objectSnapshots[name]) !== JSON.stringify(ctx.objects[name])) {
      await appDocumentRepository.save(OBJECT_COLLECTIONS[name], {
        id: 'runtime_config',
        ...ctx.objects[name],
      });
    }
  }
}

async function runRequestContext(next) {
  const ctx = await initialize();
  return storage.run(ctx, next);
}

function middleware() {
  return (req, res, next) => {
    runRequestContext(() => {
      let committed = false;
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);
      const originalEnd = res.end.bind(res);
      const commit = (writer, payload, encoding, cb) => {
        if (committed) return res;
        committed = true;
        flush().then(() => writer(payload, encoding, cb)).catch(next);
        return res;
      };
      res.json = (payload) => commit(originalJson, payload);
      res.send = (payload) => commit(originalSend, payload);
      res.end = (payload, encoding, cb) => commit(originalEnd, payload, encoding, cb);
      next();
    }).catch(next);
  };
}

const proxies = {};
for (const name of Object.keys(ARRAY_CONFIG)) proxies[name] = createArrayProxy(name);
for (const name of APP_COLLECTIONS) proxies[name] = createArrayProxy(name);
for (const name of Object.keys(OBJECT_COLLECTIONS)) proxies[name] = createObjectProxy(name);

module.exports = {
  middleware,
  proxies,
  runRequestContext,
  flush,
  APP_COLLECTIONS,
  OBJECT_COLLECTIONS,
};
