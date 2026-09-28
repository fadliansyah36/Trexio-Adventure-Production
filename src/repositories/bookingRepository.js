const appDocumentRepository = require('./appDocumentRepository');

const COLLECTION = 'bookings';

async function list() {
  return appDocumentRepository.list(COLLECTION);
}

async function findById(id) {
  if (!id) return null;
  const bookings = await list();
  return bookings.find((booking) => String(booking.id) === String(id)) || null;
}

async function findByCode(bookingCode) {
  if (!bookingCode) return null;
  const bookings = await list();
  return bookings.find((booking) => String(booking.booking_code) === String(bookingCode)) || null;
}

async function save(booking) {
  if (!booking || !booking.id) throw new Error('Booking id is required');
  await appDocumentRepository.save(COLLECTION, booking);
  return booking;
}

async function remove(id) {
  if (!id) return false;
  await appDocumentRepository.remove(COLLECTION, id);
  return true;
}

module.exports = { list, findById, findByCode, save, remove };
