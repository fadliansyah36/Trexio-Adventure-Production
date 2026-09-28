const appDocumentRepository = require('./appDocumentRepository');

const COLLECTION = 'payments';

async function list() {
  return appDocumentRepository.list(COLLECTION);
}

async function findByTransactionId(txId) {
  if (!txId) return null;
  const payments = await list();
  return payments.find((payment) => String(payment.tx_id) === String(txId)) || null;
}

async function save(payment) {
  if (!payment || !payment.tx_id) throw new Error('Payment transaction id is required');
  await appDocumentRepository.save(COLLECTION, payment);
  return payment;
}

async function remove(id) {
  if (!id) return false;
  await appDocumentRepository.remove(COLLECTION, id);
  return true;
}

module.exports = { list, findByTransactionId, save, remove };
