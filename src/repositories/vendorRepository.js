const appDocumentRepository = require('./appDocumentRepository');

const COLLECTION = 'vendors';

async function list() {
  return appDocumentRepository.list(COLLECTION);
}

async function findById(id) {
  if (!id) return null;
  const vendors = await list();
  return vendors.find((vendor) => String(vendor.id) === String(id)) || null;
}

async function findByUserId(userId) {
  if (!userId) return null;
  const vendors = await list();
  return vendors.find((vendor) => String(vendor.user_id) === String(userId)) || null;
}

async function save(vendor) {
  if (!vendor || !vendor.id) throw new Error('Vendor id is required');
  await appDocumentRepository.save(COLLECTION, vendor);
  return vendor;
}

async function remove(id) {
  if (!id) return false;
  await appDocumentRepository.remove(COLLECTION, id);
  return true;
}

module.exports = { list, findById, findByUserId, save, remove };
