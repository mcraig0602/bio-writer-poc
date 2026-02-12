import mongoose from 'mongoose';
// NOTE: This will eventually move to datdog.
// TODO: Figure out DD LLM observability for this?
const traceSchema = new mongoose.Schema({
  // Unique trace identifier
  traceId: {
    type: String,
    required: true,
    index: true
  },

  // Span identifier (for distributed tracing)
  spanId: {
    type: String,
    required: true,
    index: true
  },

  // Parent span ID (for nested operations)
  parentSpanId: {
    type: String,
    default: null
  },

  // Operation name (e.g., 'ollama.generateBiography', 'api.POST/biography/generate')
  operation: {
    type: String,
    required: true,
    index: true
  },

  // Timestamp when operation started
  startTime: {
    type: Date,
    required: true,
    index: true
  },

  // Timestamp when operation ended
  endTime: {
    type: Date,
    required: true
  },

  // Duration in milliseconds
  duration_ms: {
    type: Number,
    required: true
  },

  // Status: 'success', 'error', 'timeout'
  status: {
    type: String,
    enum: ['success', 'error', 'timeout'],
    required: true,
    index: true
  },

  // Input data (sanitized, may exclude sensitive info)
  input: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // Output data
  output: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // Error information (if status is 'error')
  error: {
    message: String,
    code: String,
    stack: String
  },

  // Metadata (model name, user ID, session ID, etc.)
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Tags for filtering
  tags: {
    type: [String],
    default: [],
    index: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for common queries
traceSchema.index({ operation: 1, startTime: -1 });
traceSchema.index({ status: 1, startTime: -1 });
traceSchema.index({ 'metadata.sessionId': 1 });
traceSchema.index({ tags: 1, startTime: -1 });

// TTL index: automatically delete traces older than 30 days
traceSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Trace = mongoose.model('Trace', traceSchema);

export default Trace;
