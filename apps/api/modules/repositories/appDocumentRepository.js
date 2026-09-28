/**
 * Transitional application-document repository boundary.
 *
 * Mission 04 establishes one place for the Express runtime to access the
 * PostgreSQL JSONB compatibility store. Domain repositories can replace these
 * methods incrementally without changing route contracts.
 */
const {
  loadAppDocs,
  upsertAppDoc,
  deleteAppDoc,
  replaceAppCollection,
  APP_DOC_TABLES,
} = require('../persistence/supabasePostgres');

function assertCollection(collection) {
  if (!APP_DOC_TABLES[collection]) {
    throw new Error(`Unknown application collection: ${collection}`);
  }
}

async function list(collection) {
  assertCollection(collection);
  return loadAppDocs(collection);
}

async function save(collection, document) {
  assertCollection(collection);
  return upsertAppDoc(collection, document);
}

async function remove(collection, id) {
  assertCollection(collection);
  return deleteAppDoc(collection, id);
}

/**
 * Transitional bulk persistence used by the legacy in-memory compatibility
 * layer. New domain code should prefer save/remove instead.
 */
async function replace(collection, documents) {
  assertCollection(collection);
  return replaceAppCollection(collection, documents);
}

module.exports = {
  list,
  save,
  remove,
  replace,
  APP_DOC_TABLES,
};
