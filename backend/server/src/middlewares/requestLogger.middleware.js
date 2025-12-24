const logger = require('../config/logger');

// ANSI color codes for console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Foreground colors
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  // Extract useful info
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent') || 'Unknown';
  const userId = req.user?.id || 'Anonymous';
  
  // Color-code by method
  const methodColor = {
    GET: colors.green,
    POST: colors.cyan,
    PUT: colors.yellow,
    DELETE: colors.red,
    PATCH: colors.magenta,
  }[method] || colors.reset;
  
  // Log incoming request
  console.log('\n' + colors.bright + '━'.repeat(80) + colors.reset);
  console.log(
    `${colors.gray}[${timestamp}]${colors.reset} ` +
    `${methodColor}${colors.bright}${method}${colors.reset} ` +
    `${colors.blue}${url}${colors.reset}`
  );
  console.log(`${colors.gray}IP: ${ip} | User: ${userId}${colors.reset}`);
  
  // Log headers (excluding sensitive ones)
  if (process.env.LOG_HEADERS === 'true') {
    const safeHeaders = { ...req.headers };
    delete safeHeaders.authorization;
    delete safeHeaders.cookie;
    console.log(`${colors.dim}Headers: ${JSON.stringify(safeHeaders, null, 2)}${colors.reset}`);
  }
  
  // Log query parameters
  if (req.query && Object.keys(req.query).length > 0) {
    console.log(`${colors.yellow}Query: ${JSON.stringify(req.query)}${colors.reset}`);
    logger.info(`Request Query: ${JSON.stringify(req.query)}`);
  }
  
  // Log body (sanitized)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '***';
    if (sanitizedBody.refreshToken) sanitizedBody.refreshToken = '***';
    if (sanitizedBody.accessToken) sanitizedBody.accessToken = '***';
    
    console.log(`${colors.cyan}Body: ${JSON.stringify(sanitizedBody, null, 2)}${colors.reset}`);
    logger.info(`Request Body: ${JSON.stringify(sanitizedBody)}`);
  }
  
  // Log file uploads
  if (req.files || req.file) {
    console.log(`${colors.magenta}Files: ${req.files ? Object.keys(req.files).length : 1} file(s)${colors.reset}`);
  }
  
  // Log request completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 500 ? colors.red :
                       res.statusCode >= 400 ? colors.yellow :
                       res.statusCode >= 300 ? colors.cyan :
                       colors.green;
    
    console.log(
      `${statusColor}${colors.bright}← ${res.statusCode}${colors.reset} ` +
      `${colors.gray}(${duration}ms)${colors.reset}`
    );
    console.log(colors.bright + '━'.repeat(80) + colors.reset + '\n');
    
    // Also log to file
    logger.info(`${ip} ${method} ${url} ${res.statusCode} ${duration}ms`);
  });
  
  // Log incoming request to file
  logger.info(`Incoming Request: ${method} ${url}`);
  
  next();
};

module.exports = requestLogger;

