const appDocumentRepository = require('./appDocumentRepository');

const COLLECTION = 'trips';

async function list() {
  return appDocumentRepository.list(COLLECTION);
}

async function findById(id) {
  if (!id) return null;
  const trips = await list();
  return trips.find((trip) => String(trip.id) === String(id)) || null;
}

async function save(trip) {
  if (!trip || !trip.id) throw new Error('Trip id is required');
  await appDocumentRepository.save(COLLECTION, trip);
  return trip;
}

async function remove(id) {
  if (!id) return false;
  await appDocumentRepository.remove(COLLECTION, id);
  return true;
}

module.exports = { list, findById, save, remove };
