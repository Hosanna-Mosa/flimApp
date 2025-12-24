const logger = require('../config/logger');
const { fail } = require('../utils/response');

// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });
  if (res.headersSent) return;
  const status = err.status || 500;
  return fail(res, err.message || 'Internal Server Error', status);
};

