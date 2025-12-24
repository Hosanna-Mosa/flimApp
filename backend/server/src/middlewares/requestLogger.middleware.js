const logger = require('../config/logger');

const requestLogger = (req, res, next) => {
  logger.info(`Incoming Request: ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    // Sanitize sensitive fields like password
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***';
    logger.info(`Request Body: ${JSON.stringify(sanitizedBody)}`);
  }
  if (req.query && Object.keys(req.query).length > 0) {
    logger.info(`Request Query: ${JSON.stringify(req.query)}`);
  }
  next();
};

module.exports = requestLogger;
