// utils/detailedLogger.js
// Logging detalhado para o client React (console)
import { getCurrentDateTime } from './dateUtils';

export function logRequest({ url, method, body, params, query }) {
  console.log('[CLIENT REQUEST]', {
    time: getCurrentDateTime(),
    method,
    url,
    params,
    query,
    body,
  });
}

export function logResponse({ url, method, status, duration, response }) {
  console.log('[CLIENT RESPONSE]', {
    time: getCurrentDateTime(),
    method,
    url,
    status,
    duration: duration + 'ms',
    response,
  });
}

export function logError({ url, method, error }) {
  console.error('[CLIENT ERROR]', {
    time: getCurrentDateTime(),
    error,
    url,
    error,
  });
}
