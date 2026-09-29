'use strict';

function getApiBaseUrl(env = process.env) {
  return String(env.TREXIO_API_BASE_URL || env.REACT_APP_API_URL || '/api').replace(/\\/+$/, '');
}

module.exports = { getApiBaseUrl };
