import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import tracingConfig from '../config/tracing.js';
import Trace from '../models/Trace.js';
import logger from '../config/logging.js';

/**
 * TracingService provides observability for AI operations
 *
 * Features:
 * - Creates trace spans for operations
 * - Persists traces to MongoDB and JSON files
 * - Provides query interface for traces
 * - Supports distributed tracing with parent/child spans
 */
class TracingService {
  constructor() {
    this.enabled = tracingConfig.enabled;
    this.outputDir = tracingConfig.outputDir;
    this.persistToDatabase = tracingConfig.persistToDatabase;
    this.includePayloads = tracingConfig.includePayloads;
    this.sampleRate = tracingConfig.sampleRate;

    // In-memory store for recent traces (LRU cache)
    this.inMemoryTraces = [];
    this.maxInMemoryTraces = tracingConfig.maxInMemoryTraces;

    // Initialize output directory
    if (this.enabled) {
      this.initializeOutputDir();
    }
  }

  /**
   * Initialize the output directory for trace files
   */
  async initializeOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      logger.info(`Tracing output directory initialized: ${this.outputDir}`);
    } catch (error) {
      logger.error(`Failed to create tracing output directory: ${error.message}`);
    }
  }

  /**
   * Check if this trace should be sampled based on sample rate
   */
  shouldSample() {
    return Math.random() < this.sampleRate;
  }

  /**
   * Start a new trace span
   *
   * @param {string} operation - Operation name (e.g., 'ollama.generateBiography')
   * @param {object} metadata - Additional metadata
   * @param {string} parentSpanId - Parent span ID for nested operations
   * @returns {object} Span object
   */
  startSpan(operation, metadata = {}, parentSpanId = null) {
    if (!this.enabled || !this.shouldSample()) {
      return null;
    }

    const span = {
      traceId: metadata.traceId || uuidv4(),
      spanId: uuidv4(),
      parentSpanId,
      operation,
      startTime: new Date(),
      metadata: {
        ...metadata,
        environment: process.env.NODE_ENV || 'development'
      },
      status: 'in_progress'
    };

    logger.debug(`Trace span started: ${span.operation} (${span.spanId})`);

    return span;
  }

  /**
   * End a trace span
   *
   * @param {object} span - Span object from startSpan
   * @param {object} result - Operation result
   * @param {Error} error - Error if operation failed
   * @param {object} additionalMetadata - Additional metadata to add
   * @returns {object} Complete span object
   */
  async endSpan(span, result = null, error = null, additionalMetadata = {}) {
    if (!this.enabled || !span) {
      return null;
    }

    const endTime = new Date();

    span.endTime = endTime;
    span.duration_ms = endTime - span.startTime;
    span.status = error ? 'error' : 'success';

    // Add result (with optional payload filtering)
    if (result && this.includePayloads) {
      span.output = this.sanitizePayload(result);
    } else if (result) {
      span.output = {
        type: typeof result,
        length: result?.length || null
      };
    }

    // Add error information
    if (error) {
      span.error = {
        message: error.message,
        code: error.code || null,
        stack: error.stack
      };
    }

    // Merge additional metadata
    span.metadata = {
      ...span.metadata,
      ...additionalMetadata
    };

    // Save trace
    await this.saveTrace(span);

    logger.logTrace(span);
    logger.debug(`Trace span ended: ${span.operation} (${span.duration_ms}ms)`);

    return span;
  }

  /**
   * Sanitize payload to remove sensitive information
   *
   * @param {any}  payload - Data to sanitize
   * @returns {any} Sanitized data
   */
  sanitizePayload(payload) {
    const isSensitiveKey = (key) => {
      if (!key) return false;
      const k = String(key).toLowerCase();
      return (
        k === 'password' ||
        k === 'token' ||
        k === 'apikey' ||
        k === 'api_key' ||
        k === 'secret' ||
        k === 'authorization' ||
        k === 'x-api-key' ||
        k === 'api-key'
      );
    };

    if (typeof payload === 'string') {
      // Truncate very long strings
      return payload.length > 5000 ? payload.substring(0, 5000) + '...' : payload;
    }

    if (Array.isArray(payload)) {
      return payload.map(item => this.sanitizePayload(item));
    }

    if (typeof payload === 'object' && payload !== null) {
      const sanitized = {};

      for (const [key, value] of Object.entries(payload)) {
        if (isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]';
          continue;
        }

        // Common pattern: an object named "headers" containing Authorization/API keys
        if (String(key).toLowerCase() === 'headers' && typeof value === 'object' && value !== null) {
          const headersSanitized = {};
          for (const [headerKey, headerValue] of Object.entries(value)) {
            if (isSensitiveKey(headerKey)) {
              headersSanitized[headerKey] = '[REDACTED]';
            } else {
              headersSanitized[headerKey] = this.sanitizePayload(headerValue);
            }
          }
          sanitized[key] = headersSanitized;
          continue;
        }

        sanitized[key] = this.sanitizePayload(value);
      }

      return sanitized;
    }

    return payload;
  }

  /**
   * Save trace to storage (MongoDB and/or JSON file)
   *
   * @param {object} span - Complete span object
   */
  async saveTrace(span) {
    try {
      // Add to in-memory cache
      this.inMemoryTraces.unshift(span);

      // Maintain max size
      if (this.inMemoryTraces.length > this.maxInMemoryTraces) {
        this.inMemoryTraces = this.inMemoryTraces.slice(0, this.maxInMemoryTraces);
      }

      // Save to MongoDB if enabled
      if (this.persistToDatabase) {
        await Trace.create(span);
      }

      // Save to JSON file
      await this.appendToJsonFile(span);

    } catch (error) {
      logger.error(`Failed to save trace: ${error.message}`);
    }
  }

  /**
   * Append trace to daily JSON file
   *
   * @param {object} span - Trace span
   */
  async appendToJsonFile(span) {
    try {
      const date = span.startTime.toISOString().split('T')[0];
      const filePath = path.join(this.outputDir, `traces-${date}.json`);

      // Read existing traces
      let traces = [];
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        traces = JSON.parse(content);
      } catch (error) {
        // File doesn't exist yet, start with empty array
      }

      // Append new trace
      traces.push(span);

      // Write back
      await fs.writeFile(filePath, JSON.stringify(traces, null, 2));
    } catch (error) {
      logger.error(`Failed to write trace to JSON file: ${error.message}`);
    }
  }

  /**
   * Query traces from MongoDB
   *
   * @param {object} filters - Query filters
   * @param {number} limit - Maximum number of results
   * @returns {array} Array of traces
   */
  async queryTraces(filters = {}, limit = 100) {
    try {
      const query = {};

      if (filters.operation) {
        query.operation = filters.operation;
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.startDate || filters.endDate) {
        query.startTime = {};
        if (filters.startDate) {
          query.startTime.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.startTime.$lte = new Date(filters.endDate);
        }
      }

      if (filters.tags) {
        query.tags = { $in: filters.tags };
      }

      const traces = await Trace.find(query)
        .sort({ startTime: -1 })
        .limit(limit)
        .lean();

      return traces;
    } catch (error) {
      logger.error(`Failed to query traces: ${error.message}`);
      return [];
    }
  }

  /**
   * Get recent traces from in-memory cache
   *
   * @param {number} limit - Number of traces to return
   * @returns {array} Recent traces
   */
  getRecentTraces(limit = 50) {
    return this.inMemoryTraces.slice(0, limit);
  }

  /**
   * Get trace statistics
   *
   * @param {object} filters - Query filters
   * @returns {object} Statistics
   */
  async getStatistics(filters = {}) {
    try {
      const traces = await this.queryTraces(filters, 1000);

      const stats = {
        totalTraces: traces.length,
        successCount: traces.filter(t => t.status === 'success').length,
        errorCount: traces.filter(t => t.status === 'error').length,
        avgDuration: traces.length > 0
          ? traces.reduce((sum, t) => sum + t.duration_ms, 0) / traces.length
          : 0,
        operations: {}
      };

      // Group by operation
      traces.forEach(trace => {
        if (!stats.operations[trace.operation]) {
          stats.operations[trace.operation] = {
            count: 0,
            successCount: 0,
            errorCount: 0,
            totalDuration: 0,
            avgDuration: 0
          };
        }

        const opStats = stats.operations[trace.operation];
        opStats.count++;
        opStats.totalDuration += trace.duration_ms;

        if (trace.status === 'success') {
          opStats.successCount++;
        } else if (trace.status === 'error') {
          opStats.errorCount++;
        }
      });

      // Calculate averages
      Object.values(stats.operations).forEach(opStats => {
        opStats.avgDuration = opStats.totalDuration / opStats.count;
      });

      return stats;
    } catch (error) {
      logger.error(`Failed to get statistics: ${error.message}`);
      return null;
    }
  }

  /**
   * Wrap an async function with tracing
   *
   * @param {string} operation - Operation name
   * @param {Function} fn - Function to wrap
   * @param {object} metadata - Additional metadata
   * @returns {Function} Wrapped function
   */
  traced(operation, fn, metadata = {}) {
    const self = this;

    return async function(...args) {
      const span = self.startSpan(operation, metadata);

      try {
        const result = await fn.apply(this, args);
        await self.endSpan(span, result);
        return result;
      } catch (error) {
        await self.endSpan(span, null, error);
        throw error;
      }
    };
  }
}

// Export singleton instance
const tracingService = new TracingService();
export default tracingService;
