const logger = require('../config/logger');
const { fail } = require('../utils/response');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  if (res.headersSent) return;
  
  const status = err.status || 500;
  // Never expose 500 internal/database error messages to the client
  const message = status >= 500 ? 'Internal Server Error' : err.message;
  
  return fail(res, message, status);
};

