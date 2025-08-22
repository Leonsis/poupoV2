// utils/detailedLogger.js
// Logging detalhado para o client React (console)

export function logRequest({ url, method, body, params, query }) {
  console.log('[CLIENT REQUEST]', {
    time: new Date().toISOString(),
    method,
    url,
    params,
    query,
    body,
  });
}

export function logResponse({ url, method, status, duration, response }) {
  console.log('[CLIENT RESPONSE]', {
    time: new Date().toISOString(),
    method,
    url,
    status,
    duration: duration + 'ms',
    response,
  });
}

export function logError({ url, method, error }) {
  console.error('[CLIENT ERROR]', {
    time: new Date().toISOString(),
    method,
    url,
    error,
  });
}
