'use strict';

function createApiClient({ baseUrl, fetchImpl = globalThis.fetch } = {}) {
  if (!fetchImpl) throw new Error('A fetch implementation is required');
  const normalizedBaseUrl = String(baseUrl || '').replace(/\/+$/, '');
  return {
    async request(path, options = {}) {
      const response = await fetchImpl(normalizedBaseUrl + path, {
        credentials: 'include',
        ...options,
        headers: { Accept: 'application/json', ...(options.headers || {}) },
      });
      const contentType = response.headers?.get?.('content-type') || '';
      const body = contentType.includes('application/json') ? await response.json() : await response.text();
      if (!response.ok) {
        const error = new Error(body?.detail || body?.error || 'API request failed');
        error.status = response.status;
        error.body = body;
        throw error;
      }
      return body;
    },
  };
}

module.exports = { createApiClient };
