const repository = require('../repositories/appDocumentRepository');

async function loadCollection(collection) {
  return repository.list(collection);
}

async function loadSingleton(collection) {
  const docs = await repository.list(collection);
  return docs.find((doc) => doc.id === 'singleton') || null;
}

async function saveSingleton(collection, data) {
  return repository.save(collection, { id: 'singleton', ...data });
}

async function saveDocument(collection, data) {
  return repository.save(collection, data);
}

module.exports = { loadCollection, loadSingleton, saveSingleton, saveDocument };
