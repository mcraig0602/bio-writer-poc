import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tracing configuration
const tracingConfig = {
  // Enable/disable tracing
  enabled: process.env.TRACING_ENABLED === 'true',

  // Directory for trace output files
  outputDir: process.env.TRACE_OUTPUT_DIR || path.join(__dirname, '../../traces'),

  // Trace level (debug, info, warn, error)
  level: process.env.TRACE_LEVEL || 'info',

  // Whether to persist traces to MongoDB
  persistToDatabase: process.env.TRACE_PERSIST_TO_DB === 'true',

  // Maximum number of traces to keep in memory
  maxInMemoryTraces: parseInt(process.env.TRACE_MAX_IN_MEMORY || '1000', 10),

  // Whether to include request/response bodies in traces (can be large)
  includePayloads: process.env.TRACE_INCLUDE_PAYLOADS !== 'false',

  // Operations to trace (empty array means trace all)
  operations: process.env.TRACE_OPERATIONS
    ? process.env.TRACE_OPERATIONS.split(',').map(op => op.trim())
    : [],

  // Sample rate (0-1, 1 = trace everything, 0.1 = trace 10%)
  sampleRate: parseFloat(process.env.TRACE_SAMPLE_RATE || '1.0')
};

// Validation
if (tracingConfig.sampleRate < 0 || tracingConfig.sampleRate > 1) {
  throw new Error('TRACE_SAMPLE_RATE must be between 0 and 1');
}

export default tracingConfig;
