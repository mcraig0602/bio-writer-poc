import { randomUUID } from 'crypto';
import logger from '../config/logging.js';

/**
 * Request logging middleware that captures HTTP request/response details
 * Adds unique request ID for correlation with traces
 * Skips noisy endpoints like health checks and tracing API
 */
export const requestLogger = (req, res, next) => {
  // Skip logging for certain routes to reduce noise
  const skipPaths = ['/health', '/api/tracing'];
  const shouldSkip = skipPaths.some(path => req.path.startsWith(path));
  
  if (shouldSkip) {
    return next();
  }

  // Check if request logging is enabled
  const requestLoggingEnabled = process.env.LOG_REQUESTS !== 'false';
  if (!requestLoggingEnabled) {
    return next();
  }

  // Generate unique request ID for correlation
  req.id = randomUUID();
  
  // Capture request start time
  const startTime = Date.now();
  
  // Log incoming request
  const requestMetadata = {
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
  };

  // Optionally log request body (disabled by default for security)
  if (process.env.LOG_REQUEST_BODY === 'true' && req.body && Object.keys(req.body).length > 0) {
    requestMetadata.body = req.body;
  }

  logger.info('Incoming request', requestMetadata);

  // Capture response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const responseMetadata = {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration_ms: duration,
    };

    // Log at appropriate level based on status code
    if (res.statusCode >= 500) {
      logger.error('Request completed with error', responseMetadata);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', responseMetadata);
    } else {
      logger.info('Request completed', responseMetadata);
    }
  });

  next();
};

export default requestLogger;
