const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');

const logsDir = path.join(__dirname, '../../logs');

const fileTransport = (filename, level) =>
  new winston.transports.DailyRotateFile({
    level,
    dirname: logsDir,
    filename: `${filename}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '10m',
    maxFiles: '14d',
  });

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message, ...meta }) =>
        `${timestamp} [${level}]: ${message}${
          Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
        }`
    )
  ),
  transports: [
    fileTransport('combined', 'info'),
    fileTransport('error', 'error'),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

module.exports = logger;

