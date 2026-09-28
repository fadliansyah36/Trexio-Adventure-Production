/**
 * API-local AI boundary adapter.
 *
 * Phase 09C extraction keeps the existing AI implementation source stable while
 * making the API runtime depend on an API-owned module boundary. Internal AI
 * implementation extraction is intentionally deferred until its dependency
 * graph is independently verified.
 */
module.exports = require('../../../../src/ai');
