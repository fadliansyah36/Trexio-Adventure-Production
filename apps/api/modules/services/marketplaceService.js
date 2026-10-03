'use strict';

const tripRepository = require('../repositories/tripRepository');
const vendorRepository = require('../repositories/vendorRepository');

function normalizeLimit(value, fallback = 50) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), 100);
}

function normalizePage(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 1;
  return Math.floor(parsed);
}

function applyFilters(trips, filters = {}) {
  let result = trips.filter((trip) => trip && trip.published !== false);

  if (filters.category) result = result.filter((trip) => trip.category === filters.category);
  if (filters.region) result = result.filter((trip) => trip.region === filters.region);
  if (filters.difficulty) result = result.filter((trip) => trip.difficulty === filters.difficulty);

  if (filters.min_price !== undefined && filters.min_price !== '') {
    const min = Number(filters.min_price);
    if (Number.isFinite(min)) result = result.filter((trip) => Number(trip.price || 0) >= min);
  }

  if (filters.max_price !== undefined && filters.max_price !== '') {
    const max = Number(filters.max_price);
    if (Number.isFinite(max)) result = result.filter((trip) => Number(trip.price || 0) <= max);
  }

  if (filters.q) {
    const query = String(filters.q).trim().toLowerCase();
    if (query) {
      result = result.filter((trip) =>
        [trip.title, trip.destination, trip.description, trip.category, trip.region]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      );
    }
  }

  if (filters.sort === 'price_asc') {
    result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
  } else if (filters.sort === 'price_desc') {
    result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
  } else {
    result.sort((a, b) => Number(b.booked_seats || 0) - Number(a.booked_seats || 0));
  }

  return result;
}

async function listTrips(filters = {}, context = {}) {
  const trips = await tripRepository.list({ tenantId: context.tenantId });
  const filtered = applyFilters(trips, filters);
  const limit = normalizeLimit(filters.limit);
  const page = normalizePage(filters.page);
  const start = (page - 1) * limit;

  return {
    items: filtered.slice(start, start + limit),
    total: filtered.length,
    page,
    limit,
  };
}

async function listFeatured(limit = 6, context = {}) {
  const trips = await tripRepository.list({ tenantId: context.tenantId });
  return applyFilters(trips).slice(0, normalizeLimit(limit, 6));
}

async function findTrip(id, context = {}) {
  return tripRepository.findById(id, { tenantId: context.tenantId });
}

async function enrichTripWithVendor(trip, context = {}) {
  if (!trip) return trip;
  if (!trip.vendor_id) return trip;

  const vendor = await vendorRepository.findById(trip.vendor_id, { tenantId: context.tenantId });
  if (!vendor) return trip;

  return {
    ...trip,
    vendor_name: vendor.brand_name,
    vendor_verified: vendor.status === 'verified' || vendor.status === 'active',
    vendor: vendor,
  };
}

module.exports = {
  listTrips,
  listFeatured,
  findTrip,
  enrichTripWithVendor,
};
