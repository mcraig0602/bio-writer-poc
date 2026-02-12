# Tracing Guide

This document describes the tracing system implemented for the Biography POC project. Tracing provides observability for all AI/LLM operations, enabling performance analysis, debugging, and quality monitoring.

## Overview

The tracing system automatically captures detailed information about every LLM operation:
- Input/output data
- Execution time (duration in milliseconds)
- Success/failure status
- Metadata (provider, base URL, endpoint, model name, token usage, etc.)
- Error details when operations fail

## Architecture

### Components

1. **Tracing Service** (`backend/src/services/tracing.js`)
   - Core tracing functionality
   - Creates and manages trace spans
   - Persists traces to MongoDB and JSON files
   - Provides query interface

2. **Tracing Configuration** (`backend/src/config/tracing.js`)
   - Centralized configuration
   - Environment-based settings
   - Sample rate control

3. **Trace Model** (`backend/src/models/Trace.js`)
   - MongoDB schema for traces
   - Indexes for efficient querying
   - Auto-expiration after 30 days

4. **Tracing API** (`backend/src/routes/tracing.js`)
   - REST endpoints for querying traces
   - Statistics and analytics
   - Health checks

5. **Logger** (`backend/src/config/logging.js`)
   - Winston-based structured logging
   - Rotating log files
   - Integration with tracing

### Data Flow

```
API Request
    ↓
Tracing Middleware (future)
    ↓
Service Method (e.g., ollama.generateBiography)
    ↓
tracingService.startSpan()
    ↓
Execute Operation
    ↓
tracingService.endSpan()
    ↓
Save to:
  - MongoDB (Trace collection)
  - JSON file (./traces/traces-YYYY-MM-DD.json)
  - In-memory cache (last 1000 traces)
```

## Configuration

### Environment Variables

Add these to your `backend/.env` file:

```env
# Enable/disable tracing
TRACING_ENABLED=true

# Directory for JSON trace files
TRACE_OUTPUT_DIR=./traces

# Trace level (debug, info, warn, error)
TRACE_LEVEL=info

# Persist to MongoDB
TRACE_PERSIST_TO_DB=true

# Include full input/output in traces (can be large)
TRACE_INCLUDE_PAYLOADS=true

# Maximum traces to keep in memory
TRACE_MAX_IN_MEMORY=1000

# Sample rate: 1.0 = trace everything, 0.1 = trace 10%
TRACE_SAMPLE_RATE=1.0
```

### AI Provider Metadata

The AI client is configured via OpenAI-style variables (preferred):

```env
AI_BASE_URL=http://localhost:11434
AI_MODEL=llama3.1

# Optional OpenAI-like knobs (mapped to Ollama today)
# AI_TEMPERATURE=0.7
# AI_MAX_TOKENS=512
# AI_TIMEOUT_MS=60000
# AI_MAX_RETRIES=2
```

When present, these values are added to trace span `metadata` for `ollama.*` operations (e.g., `provider`, `baseUrl`, `endpoint`, `temperature`, `maxTokens`, `timeoutMs`).

### Logging Configuration

```env
LOG_LEVEL=info
LOG_DIR=./logs
LOG_MAX_FILES=7d
LOG_MAX_SIZE=20m
```

## Usage

### Adding Tracing to a Function

Wrap any async function with tracing:

```javascript
import tracingService from '../services/tracing.js';
import logger from '../config/logging.js';

async function myAIFunction(input) {
  // Start a trace span
  const span = tracingService.startSpan('myAIFunction', {
    inputLength: input.length,
    model: 'llama3.1'
  });

  try {
    // Perform operation
    const result = await performOperation(input);

    // End span with success
    await tracingService.endSpan(span, {
      outputLength: result.length,
      tokensUsed: 1234
    });

    return result;
  } catch (error) {
    // End span with error
    logger.error('Operation failed:', error.message);
    await tracingService.endSpan(span, null, error);
    throw error;
  }
}
```

### Nested Operations (Parent/Child Spans)

For distributed tracing with nested operations:

```javascript
async function parentOperation(input) {
  const parentSpan = tracingService.startSpan('parentOperation', { input });

  try {
    // Child operation uses parent span ID
    const childSpan = tracingService.startSpan(
      'childOperation',
      { traceId: parentSpan.traceId },
      parentSpan.spanId  // parent span ID
    );

    const result = await childOperation();

    await tracingService.endSpan(childSpan, result);
    await tracingService.endSpan(parentSpan, result);

    return result;
  } catch (error) {
    await tracingService.endSpan(parentSpan, null, error);
    throw error;
  }
}
```

## API Endpoints

### Get Recent Traces

Get the most recent traces from in-memory cache:

```bash
GET /api/tracing/recent?limit=50
```

Response:
```json
{
  "count": 50,
  "traces": [
    {
      "traceId": "uuid",
      "spanId": "uuid",
      "operation": "ollama.generateBiography",
      "startTime": "2026-02-10T10:30:00Z",
      "endTime": "2026-02-10T10:30:05Z",
      "duration_ms": 5000,
      "status": "success",
      "metadata": {
        "model": "llama3.1",
        "inputLength": 150
      }
    }
  ]
}
```

### Query Traces

Query traces with filters:

```bash
# By operation
GET /api/tracing/query?operation=ollama.generateBiography&limit=100

# By status
GET /api/tracing/query?status=error&limit=50

# By date range
GET /api/tracing/query?startDate=2026-02-01&endDate=2026-02-10

# Combined filters
GET /api/tracing/query?operation=ollama.refineBiography&status=success&limit=20
```

### Get Statistics

Get aggregate statistics:

```bash
GET /api/tracing/statistics
```

Response:
```json
{
  "totalTraces": 1000,
  "successCount": 950,
  "errorCount": 50,
  "avgDuration": 3500,
  "operations": {
    "ollama.generateBiography": {
      "count": 500,
      "successCount": 480,
      "errorCount": 20,
      "avgDuration": 4500
    },
    "ollama.refineBiography": {
      "count": 300,
      "successCount": 290,
      "errorCount": 10,
      "avgDuration": 3000
    }
  }
}
```

### Get Trace by Span ID

Retrieve a specific trace:

```bash
GET /api/tracing/span/:spanId
```

### Health Check

Check tracing service status:

```bash
GET /api/tracing/health
```

Response:
```json
{
  "enabled": true,
  "persistToDatabase": true,
  "sampleRate": 1.0,
  "inMemoryTraceCount": 1000
}
```

## Traced Operations

All Ollama service methods are automatically traced:

| Operation | Description | Location |
|-----------|-------------|----------|
| `ollama.generateBiography` | Generate initial biography from raw input | `backend/src/services/ollama.js:10` |
| `ollama.extractKeywords` | Extract keywords from text | `backend/src/services/ollama.js:44` |
| `ollama.refineBiography` | Refine biography based on user feedback | `backend/src/services/ollama.js:83` |

## Trace Data Structure

Each trace contains:

```javascript
{
  // Identifiers
  traceId: "uuid",                    // Unique trace ID
  spanId: "uuid",                     // Span ID
  parentSpanId: "uuid" | null,        // Parent span (for nested operations)

  // Operation info
  operation: "ollama.generateBiography",
  startTime: Date,
  endTime: Date,
  duration_ms: Number,
  status: "success" | "error" | "timeout",

  // Data (sanitized)
  input: Object | null,
  output: Object | null,

  // Error info (if status is error)
  error: {
    message: String,
    code: String,
    stack: String
  },

  // Metadata
  metadata: {
    model: "llama3.1",
    inputLength: Number,
    outputLength: Number,
    tokensUsed: Number,
    environment: "development"
  },

  // Tags for filtering
  tags: ["biography", "generation"],

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

## Querying Traces Programmatically

From within your code:

```javascript
import tracingService from './services/tracing.js';

// Get recent traces
const recentTraces = tracingService.getRecentTraces(100);

// Query with filters
const traces = await tracingService.queryTraces({
  operation: 'ollama.generateBiography',
  status: 'error',
  startDate: new Date('2026-02-01'),
  endDate: new Date('2026-02-10')
}, 100);

// Get statistics
const stats = await tracingService.getStatistics({
  operation: 'ollama.generateBiography'
});
```

## Viewing Trace Files

Traces are also written to JSON files in the `backend/traces/` directory:

```bash
# View today's traces
cat backend/traces/traces-2026-02-10.json | jq .

# Search for errors
cat backend/traces/traces-2026-02-10.json | jq '.[] | select(.status == "error")'

# Find slow operations (>5 seconds)
cat backend/traces/traces-2026-02-10.json | jq '.[] | select(.duration_ms > 5000)'

# Count traces by operation
cat backend/traces/traces-2026-02-10.json | jq 'group_by(.operation) | map({operation: .[0].operation, count: length})'
```

## Performance Analysis

### Analyzing Slow Operations

```bash
# Find operations taking > 5 seconds
curl "http://localhost:3001/api/tracing/query?limit=1000" | \
  jq '.traces[] | select(.duration_ms > 5000) | {operation, duration_ms, startTime}'
```

### Error Rate Analysis

```bash
# Get error rate by operation
curl http://localhost:3001/api/tracing/statistics | \
  jq '.operations | to_entries[] | {operation: .key, errorRate: (.value.errorCount / .value.count * 100)}'
```

### Token Usage Analysis

```bash
# Analyze token usage patterns
curl "http://localhost:3001/api/tracing/query?operation=ollama.generateBiography&limit=1000" | \
  jq '.traces[].output.tokensUsed' | \
  awk '{sum+=$1; count++} END {print "Avg tokens:", sum/count}'
```

## Debugging with Traces

### Common Debugging Scenarios

**1. Biography generation is slow:**
```bash
# Check recent generation traces
curl "http://localhost:3001/api/tracing/query?operation=ollama.generateBiography&limit=20" | \
  jq '.traces[] | {duration_ms, inputLength: .metadata.inputLength, outputLength: .output.outputLength}'
```

**2. Keywords extraction is failing:**
```bash
# Find failed keyword extractions
curl "http://localhost:3001/api/tracing/query?operation=ollama.extractKeywords&status=error" | \
  jq '.traces[] | {error: .error.message, input: .input}'
```

**3. Refinement producing poor results:**
```bash
# Review refinement operations
curl "http://localhost:3001/api/tracing/query?operation=ollama.refineBiography&limit=10" | \
  jq '.traces[] | {duration_ms, conversationHistoryLength: .metadata.conversationHistoryLength}'
```

## Best Practices

1. **Always trace AI operations**: Every LLM call should be wrapped with tracing
2. **Include meaningful metadata**: Add context that helps debugging (input lengths, model names, etc.)
3. **Use appropriate sample rates**: In production, consider sampling (e.g., 0.1 for 10%) to reduce overhead
4. **Monitor trace statistics**: Set up alerts for high error rates or slow operations
5. **Clean up old traces**: The system auto-expires traces after 30 days, but you can adjust in the Trace model
6. **Sanitize sensitive data**: The tracing service automatically redacts passwords, tokens, and API keys
7. **Use structured logging**: Always use `logger` from `config/logging.js` instead of `console.log`

## Troubleshooting

### Tracing not working

```bash
# Check if tracing is enabled
curl http://localhost:3001/api/tracing/health

# Check environment variables
cat backend/.env | grep TRACE

# Check logs for errors
tail -f backend/logs/biography-error-*.log
```

### Traces not persisting to MongoDB

```bash
# Verify TRACE_PERSIST_TO_DB is true
echo $TRACE_PERSIST_TO_DB

# Check MongoDB connection
mongo mongodb://localhost:27017/biography-poc --eval "db.traces.countDocuments()"

# Check for errors in logs
tail -f backend/logs/biography-*.log | grep -i trace
```

### JSON trace files not being created

```bash
# Check directory exists and is writable
ls -la backend/traces/

# Create directory if missing
mkdir -p backend/traces

# Check trace output directory setting
echo $TRACE_OUTPUT_DIR
```

## Integration with AI Toolkit

The tracing system follows best practices from AI Toolkit:

- **Comprehensive coverage**: All LLM operations are traced
- **Performance metrics**: Duration, token usage, success rates
- **Error tracking**: Full error details including stack traces
- **Queryable data**: REST API and programmatic access
- **Time-series analysis**: Daily trace files for trend analysis

## Future Enhancements

Planned improvements:

- [ ] Distributed tracing support (OpenTelemetry integration)
- [ ] Real-time trace streaming via WebSockets
- [ ] Trace visualization dashboard
- [ ] Automated performance alerts
- [ ] Trace export to external observability platforms (Datadog, New Relic, etc.)
- [ ] Cost tracking and analysis
- [ ] A/B testing support for prompts
- [ ] Trace replay for debugging

## Related Documentation

- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [API.md](./API.md) - API documentation
- [.github/copilot-instructions.md](../.github/copilot-instructions.md) - Claude Code integration

---

**Last Updated**: 2026-02-10

For questions or issues, check the logs in `backend/logs/` or query recent traces at `/api/tracing/recent`.
