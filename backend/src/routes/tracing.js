import express from 'express';
import tracingService from '../services/tracing.js';
import logger from '../config/logging.js';

const router = express.Router();

/**
 * Get recent traces from in-memory cache
 * GET /api/tracing/recent?limit=50
 */
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);

    const traces = tracingService.getRecentTraces(limit);

    res.json({
      count: traces.length,
      traces
    });
  } catch (error) {
    logger.logError(error, { route: '/api/tracing/recent' });
    res.status(500).json({ error: 'Failed to fetch recent traces' });
  }
});

/**
 * Query traces with filters
 * GET /api/tracing/query?operation=ollama.generateBiography&status=success&limit=100
 */
router.get('/query', async (req, res) => {
  try {
    const filters = {
      operation: req.query.operation,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      tags: req.query.tags ? req.query.tags.split(',') : undefined
    };

    const limit = parseInt(req.query.limit || '100', 10);

    const traces = await tracingService.queryTraces(filters, limit);

    res.json({
      count: traces.length,
      filters,
      traces
    });
  } catch (error) {
    logger.logError(error, { route: '/api/tracing/query' });
    res.status(500).json({ error: 'Failed to query traces' });
  }
});

/**
 * Get trace statistics
 * GET /api/tracing/statistics?operation=ollama.generateBiography
 */
router.get('/statistics', async (req, res) => {
  try {
    const filters = {
      operation: req.query.operation,
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const stats = await tracingService.getStatistics(filters);

    res.json(stats);
  } catch (error) {
    logger.logError(error, { route: '/api/tracing/statistics' });
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * Get trace by span ID
 * GET /api/tracing/span/:spanId
 */
router.get('/span/:spanId', async (req, res) => {
  try {
    const { spanId } = req.params;

    const traces = await tracingService.queryTraces({}, 1000);
    const trace = traces.find(t => t.spanId === spanId);

    if (!trace) {
      return res.status(404).json({ error: 'Trace not found' });
    }

    res.json(trace);
  } catch (error) {
    logger.logError(error, { route: '/api/tracing/span' });
    res.status(500).json({ error: 'Failed to fetch trace' });
  }
});

/**
 * Health check for tracing service
 * GET /api/tracing/health
 */
router.get('/health', (req, res) => {
  res.json({
    enabled: tracingService.enabled,
    persistToDatabase: tracingService.persistToDatabase,
    sampleRate: tracingService.sampleRate,
    inMemoryTraceCount: tracingService.inMemoryTraces.length
  });
});

export default router;
