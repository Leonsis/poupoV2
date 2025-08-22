// middleware/detailedLogger.js
const util = require('util');

function detailedLogger(req, res, next) {
  const start = process.hrtime();
  const { method, originalUrl, body, query, params } = req;
  const user = req.user ? req.user.userId : null;

  // Log de requisição
  console.log('[REQUEST]', {
    time: new Date().toISOString(),
    method,
    url: originalUrl,
    user,
    query,
    params,
    body,
  });

  // Log de resposta
  const oldSend = res.send;
  res.send = function (data) {
    const duration = process.hrtime(start);
    const ms = (duration[0] * 1e3 + duration[1] / 1e6).toFixed(2);
    let responseData;
    try {
      responseData = JSON.parse(data);
    } catch {
      responseData = data;
    }
    console.log('[RESPONSE]', {
      time: new Date().toISOString(),
      method,
      url: originalUrl,
      status: res.statusCode,
      duration: ms + 'ms',
      response: responseData,
    });
    oldSend.apply(res, arguments);
  };

  next();
}

module.exports = detailedLogger;
