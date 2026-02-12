import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration from environment
const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '../../logs');
const LOG_MAX_FILES = process.env.LOG_MAX_FILES || '7d';
const LOG_MAX_SIZE = process.env.LOG_MAX_SIZE || '20m';

// Safe JSON stringifier that handles circular references
const safeStringify = (obj, space = 0) => {
  const seen = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  }, space);
};

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      try {
        msg += ` ${safeStringify(metadata)}`;
      } catch (e) {
        msg += ` [Error serializing metadata: ${e.message}]`;
      }
    }

    return msg;
  })
);

// Custom format for file output (JSON for easier parsing)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: fileFormat,
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: consoleFormat,
      level: LOG_LEVEL
    }),

    // Rotating file transport for all logs
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'biography-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: LOG_MAX_SIZE,
      maxFiles: LOG_MAX_FILES,
      format: fileFormat
    }),

    // Separate file for errors
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'biography-error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: LOG_MAX_SIZE,
      maxFiles: LOG_MAX_FILES,
      format: fileFormat
    })
  ],

  // Handle exceptions and rejections
  exceptionHandlers: [
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'biography-exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: LOG_MAX_SIZE,
      maxFiles: LOG_MAX_FILES
    })
  ],

  rejectionHandlers: [
    new DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'biography-rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: LOG_MAX_SIZE,
      maxFiles: LOG_MAX_FILES
    })
  ]
});

// Add helper methods for structured logging
logger.logRequest = (req, message, metadata = {}) => {
  logger.info(message, {
    ...metadata,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
};

logger.logError = (error, context = {}) => {
  logger.error(error.message, {
    ...context,
    stack: error.stack,
    name: error.name
  });
};

logger.logTrace = (traceData) => {
  logger.info('Trace recorded', {
    traceId: traceData.traceId,
    spanId: traceData.spanId,
    operation: traceData.operation,
    duration_ms: traceData.duration_ms,
    status: traceData.status
  });
};

export default logger;
