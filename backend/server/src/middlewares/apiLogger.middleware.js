const morgan = require('morgan');
const logger = require('../config/logger');

const stream = {
  write: (message) => logger.info(message.trim()),
};

const apiLogger = morgan(
  ':remote-addr :method :url :status :response-time ms - :res[content-length]',
  { stream }
);

module.exports = apiLogger;

