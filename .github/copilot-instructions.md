# Biography Generator POC - GitHub Copilot Instructions

This is a Biography Generator POC that uses AI (via Ollama) to transform raw text into polished biographies with conversational refinement capabilities.

## Project Architecture

**Monorepo Structure** (NOT npm workspaces):
- `backend/` - Express.js API with independent `package.json`
- `frontend/` - React + Vite app with independent `package.json`
- Root `package.json` - Contains convenience scripts only, no workspaces

## Starting the Project

### Quick Start (Recommended)
```bash
npm run dev              # Runs ./start-dev.sh (starts both frontend & backend)
npm run setup            # First-time setup script
```

### Individual Services
```bash
# Backend only
cd backend && npm run dev    # Port 3001 with nodemon

# Frontend only  
cd frontend && npm run dev   # Port 5173 with Vite HMR
```

### Docker
```bash
npm run docker:up        # Start all services in containers
npm run docker:down      # Stop containers
npm run docker:logs      # View logs
```

## npm Scripts Reference

### Root Level
- `npm run dev` - Start both dev servers via shell script
- `npm run setup` - Run initial setup (MongoDB, Ollama, dependencies)
- `npm test` - Run all tests (backend + frontend)
- `npm run test:backend` - Backend tests only
- `npm run test:frontend` - Frontend tests only
- `npm run clean` - Remove node_modules and log files

### Backend (`backend/`)
- `npm run dev` - Start with nodemon (auto-reload on changes)
- `npm start` - Production server
- `npm test` - Run Jest tests

### Frontend (`frontend/`)
- `npm run dev` - Vite dev server with HMR
- `npm run build` - Production build
- `npm run preview` - Preview production build
- `npm test` - Run Vitest tests

## Key Technologies

### Backend Stack
- **Express.js** - REST API framework
- **MongoDB + Mongoose** - Database (single biography model)
- **Axios** - HTTP client for Ollama API calls
- **Ollama REST API** - Local LLM at `http://localhost:11434`
- **Nodemon** - Auto-restart on file changes

### Frontend Stack
- **React 18** - UI framework with hooks
- **Vite** - Build tool with fast HMR
- **Axios** - API client
- **Vitest** - Testing framework

## Code Conventions

### General
- **ES Modules**: Always use `import/export`, never `require()`
- **Async/Await**: Prefer over `.then()` chains
- **No TypeScript**: Pure JavaScript with JSX
- **TODO Comments**: Mark future enhancements (auth, multi-user support)

### File Locations
- API routes: `backend/src/routes/`
- Business logic: `backend/src/services/`
- MongoDB schemas: `backend/src/models/`
- React components: `frontend/src/components/`
- API client: `frontend/src/services/api.js`

### Naming Patterns
- Components: `PascalCase.jsx` (e.g., `BiographyDisplay.jsx`)
- Services: `camelCase.js` (e.g., `ollama.js`)
- Routes: `kebab-case.js` (e.g., `biography.js`)
- Models: `PascalCase.js` (e.g., `Biography.js`)

## API Structure

**Base URL**: `http://localhost:3001/api`

### Biography Routes (`backend/src/routes/biography.js`)
- `POST /api/biography/generate` - Generate from raw input
- `GET /api/biography/current` - Get current biography
- `PUT /api/biography/edit` - Manual edit
- `GET /api/biography/history` - View change history

### Chat Routes (`backend/src/routes/chat.js`)
- `POST /api/chat/refine` - Conversational refinement
- `GET /api/chat/messages` - Get chat history
- `DELETE /api/chat/clear` - Clear conversation

See [API.md](../API.md) for complete API documentation.

## Ollama Integration

### Service Location
All Ollama logic is in `backend/src/services/ollama.js`:
- `generateBiography(rawInput)` - Main biography generation
- `extractKeywords(text)` - Extract 5-10 relevant tags
- `refineBiography(currentBio, conversation, userMessage)` - Context-aware refinement

### API Endpoint
Ollama runs locally at `http://localhost:11434`:
- Uses `/api/generate` endpoint
- Model: `llama3.1` (configurable via `OLLAMA_MODEL` env var)
- Non-streaming responses for simplicity

### Prompt Engineering
All prompts are in `backend/src/services/ollama.js`. Modify these to improve results:
- Biography generation prompt emphasizes professionalism
- Keyword extraction returns comma-separated list
- Refinement includes full conversation context

## Database Schema

### Biography Model (`backend/src/models/Biography.js`)
**Single document** stores current biography:
```javascript
{
  rawInput: String,
  currentBiography: String,
  tags: [String],
  history: [{
    biography: String,
    tags: [String],
    timestamp: Date,
    source: 'initial' | 'chat' | 'manual'
  }],
  createdAt: Date,
  updatedAt: Date  // Auto-updated
}
```

### ChatMessage Model (`backend/src/models/ChatMessage.js`)
One document per message:
```javascript
{
  biographyId: ObjectId,
  role: 'user' | 'assistant',
  content: String,
  timestamp: Date
}
```

### Important Notes
- **Single user model**: Database stores ONE biography (no user authentication yet)
- **History tracking**: All changes (initial/chat/manual) are stored in `history` array
- **Conversation context**: Chat refinements use full message history

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/biography-poc
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3001/api
```

## Testing

### Running Tests
```bash
npm test                    # All tests
npm run test:backend        # Backend only
npm run test:frontend       # Frontend only
```

### Backend Tests (`backend/__tests__/`)
- Jest framework
- Tests for Ollama service integration
- Mock Axios for HTTP calls

### Frontend Tests (`frontend/__tests__/`)
- Vitest framework
- React component tests
- Example: `TagsDisplay.test.jsx`

## Development Workflow

### Making Changes
1. **Backend changes**:
   - Edit files in `backend/src/`
   - Nodemon auto-reloads server
   - Check logs: `tail -f backend.log`

2. **Frontend changes**:
   - Edit files in `frontend/src/`
   - Vite HMR updates browser instantly
   - Check logs: `tail -f frontend.log`

### Testing the API
```bash
./test-api.sh              # Test all endpoints
curl http://localhost:3001/health    # Health check
```

## Common Issues & Solutions

See [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) for detailed solutions. Quick fixes:

### Ollama Not Responding
```bash
ollama serve               # Start Ollama
ollama pull llama3.1       # Pull model
curl http://localhost:11434/api/tags  # Verify
```

### MongoDB Connection Failed
```bash
docker start biography-mongodb    # Start container
docker logs biography-mongodb     # Check logs
```

### Port Already in Use
```bash
lsof -i :3001             # Backend
lsof -i :5173             # Frontend
kill -9 <PID>             # Kill process
```

### Module Not Found
```bash
cd backend && npm install
cd frontend && npm install
```

## Service URLs

| Service  | URL                              |
|----------|----------------------------------|
| Frontend | http://localhost:5173            |
| Backend  | http://localhost:3001            |
| Health   | http://localhost:3001/health     |
| MongoDB  | mongodb://localhost:27017        |
| Ollama   | http://localhost:11434           |

## Future Enhancements (TODOs in code)

- **Authentication**: Add `Authorization` header for multi-user support
- **External AI**: Support OpenAI/Anthropic APIs
- **Multiple Projects**: Allow users to manage multiple biographies
- **Hugging Face**: Use Transformers for keyword extraction
- **WebSockets**: Real-time updates
- **Export Features**: PDF/HTML output

## Helper Scripts

### Setup (`setup.sh`)
- Checks prerequisites (Node, Docker, Ollama)
- Starts MongoDB container
- Pulls Ollama model
- Installs all dependencies

### Start Dev (`start-dev.sh`)
- Starts both frontend and backend in background
- Logs to `backend.log` and `frontend.log`
- URLs printed to console

### Test API (`test-api.sh`)
- Runs curl commands against all endpoints
- Validates API responses

## Documentation Files

- [README.md](../README.md) - Overview and quick start
- [API.md](../API.md) - Complete API reference
- [DEVELOPMENT.md](../DEVELOPMENT.md) - Development guide
- [QUICKSTART.md](../QUICKSTART.md) - Quick reference
- [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) - Common issues

## Project Constraints

⚠️ **Important**:
- **NO npm workspaces**: Keep backend/frontend separate with independent package.json files
- **Single biography**: No multi-user support yet
- **Local Ollama only**: Not using external AI APIs
- **No TypeScript**: Plain JavaScript throughout
- **Manual log rotation**: Logs append to `backend.log` and `frontend.log`

## Tips for Development

1. **Fast iteration**: Vite HMR + nodemon = instant updates
2. **Model swapping**: Change `OLLAMA_MODEL` to `mistral` for faster responses
3. **Debugging**: Check browser console + `backend.log`
4. **Clean state**: `docker-compose down -v` removes MongoDB data
5. **Parallel work**: Run backend tests while frontend runs

---

## Claude Code Integration

This project is optimized for development with Claude Code (Anthropic's AI coding assistant). Claude Code has access to AI Toolkit MCP tools for enhanced AI development.

### AI Toolkit MCP Tools Available

When working on AI-related features, Claude Code can access these tools:

1. **aitk-get_agent_code_gen_best_practices** - Get best practices for AI Agent development
   - Use when: Designing new agent features, refactoring agent architecture
   - Example: "Show me best practices for implementing conversation context management"

2. **aitk-get_tracing_code_gen_best_practices** - Get tracing best practices
   - Use when: Adding new trace points, debugging LLM calls, analyzing performance
   - Example: "What should I trace in my LLM refinement function?"

3. **aitk-get_ai_model_guidance** - Get AI model usage guidance
   - Use when: Choosing models, optimizing prompts, handling errors
   - Example: "Best practices for error handling with Ollama"

4. **aitk-evaluation_planner** - Plan evaluation metrics and test datasets
   - Use when: Adding new metrics, designing test cases
   - Example: "Help me design test cases for biography coherence"

5. **aitk-get_evaluation_code_gen_best_practices** - Get evaluation code best practices
   - Use when: Implementing new metrics, building evaluation harness
   - Example: "How should I structure evaluation metrics for text generation?"

6. **aitk-evaluation_agent_runner_best_practices** - Get agent runner best practices
   - Use when: Running evaluation suites, comparing agent versions
   - Example: "How to compare evaluation results across prompt versions?"

### When to Use AI Toolkit Tools

- **Before implementing new AI features**: Check best practices first
- **When debugging AI behavior**: Use tracing patterns from toolkit
- **Before committing changes**: Run evaluation suite
- **When performance degrades**: Review tracing data for bottlenecks

### Tracing System

This project now includes comprehensive tracing for all LLM operations. All traces are:
- Saved to MongoDB (Trace model)
- Written to daily JSON files in `backend/traces/`
- Kept in-memory for quick access
- Queryable via REST API at `/api/tracing/`

**Key tracing files:**
- `backend/src/services/tracing.js` - Core tracing service
- `backend/src/config/tracing.js` - Configuration
- `backend/src/models/Trace.js` - MongoDB schema
- `backend/src/routes/tracing.js` - Query API

**Tracing API endpoints:**
- `GET /api/tracing/recent?limit=50` - Get recent traces from memory
- `GET /api/tracing/query?operation=ollama.generateBiography&status=success` - Query traces
- `GET /api/tracing/statistics` - Get performance statistics
- `GET /api/tracing/span/:spanId` - Get specific trace by ID
- `GET /api/tracing/health` - Check tracing service status

**All Ollama operations are automatically traced:**
- `ollama.generateBiography` - Biography generation
- `ollama.extractKeywords` - Keyword extraction
- `ollama.refineBiography` - Conversational refinement

Each trace captures:
- Operation name and timing (duration_ms)
- Input/output data (sanitized)
- Success/error status
- Model name and metadata
- Token usage (when available)

### Tracing Guidelines

All LLM operations should be traced. Follow this pattern:

```javascript
import tracingService from '../services/tracing.js';

async function myAIFunction(input) {
  const span = tracingService.startSpan('myAIFunction', {
    inputLength: input.length
  });

  try {
    const result = await performAIOperation(input);
    await tracingService.endSpan(span, { result });
    return result;
  } catch (error) {
    await tracingService.endSpan(span, null, error);
    throw error;
  }
}
```

**Always trace:**
- LLM API calls (generateBiography, extractKeywords, refineBiography)
- Prompt construction
- Context management operations
- Validation steps
- Retry attempts

### Evaluation Guidelines

The evaluation framework is designed for measuring biography generation quality.

**Before committing changes to AI features:**
1. Run the evaluation suite: `npm run evaluate` (from backend/)
2. Check pass rate (should be ≥ 90%)
3. Review failing test cases
4. Compare metrics with baseline
5. Update test cases if introducing new capabilities

**Adding new test cases:**
- Add to `backend/src/evaluation/test-cases.json`
- Include diverse scenarios (technical, creative, brief, detailed)
- Set realistic criteria based on baseline runs
- Document expected behavior

### Agent Development Patterns

This project follows AI Agent best practices:

1. **Separation of Concerns**:
   - Prompts: `backend/src/agents/prompts/` (when created)
   - Validation: `backend/src/agents/validators/` (when created)
   - Orchestration: `backend/src/agents/BiographyAgent.js` (when created)

2. **Error Handling**:
   - Always implement retry logic with exponential backoff
   - Validate LLM outputs before saving
   - Provide fallback strategies

3. **Context Management**:
   - Limit conversation history to 20 messages
   - Summarize older context when needed
   - Track token usage explicitly

4. **Prompt Engineering**:
   - Version all prompts (use Git)
   - Include few-shot examples
   - Specify output format clearly
   - Test prompts in evaluation suite

### Code Generation Preferences for Claude

When generating code for this project:

1. **Always use ES Modules**: `import/export`, never `require()`
2. **No TypeScript**: Pure JavaScript with JSDoc comments
3. **Async/Await**: Prefer over `.then()` chains
4. **Error Handling**: Always wrap in try/catch with logging
5. **Logging**: Use `logger` from `backend/src/config/logging.js`, not `console.log`
6. **Validation**: Validate inputs at boundaries
7. **Testing**: Write tests for all new functions
8. **Tracing**: Add trace points to all AI operations
9. **Documentation**: Update relevant .md files

### Development Workflow with Claude

1. **Understanding a feature request**:
   - Ask Claude to review relevant files
   - Use AI Toolkit to get best practices
   - Design the solution before coding

2. **Implementing the feature**:
   - Follow existing patterns in codebase
   - Add tracing to new AI operations
   - Write tests alongside implementation

3. **Testing and validation**:
   - Run evaluation suite (when available)
   - Check trace logs for errors via `/api/tracing/recent`
   - Manual testing via API

4. **Committing changes**:
   - Update documentation
   - Add evaluation test cases if needed
   - Run full test suite

### Common Tasks with Claude

**Adding a new AI operation:**
```
1. Add function to ollama.js or create new service file
2. Wrap with tracing using tracingService.startSpan/endSpan
3. Use logger for error messages (not console.error)
4. Add test case to evaluation suite (when created)
5. Update API documentation
```

**Debugging poor LLM outputs:**
```
1. Check trace logs: GET /api/tracing/query?operation=ollama.generateBiography
2. Review input/output in traces
3. Analyze duration and token usage
4. Use AI Toolkit to improve prompt
5. Test with evaluation suite
6. Compare metrics before/after
```

**Improving performance:**
```
1. Analyze traces for bottlenecks: GET /api/tracing/statistics
2. Check token usage patterns
3. Consider prompt length reduction
4. Implement caching if applicable
5. Run load tests
```

**Viewing trace data:**
```bash
# Get recent traces
curl http://localhost:3001/api/tracing/recent?limit=10

# Query specific operation
curl "http://localhost:3001/api/tracing/query?operation=ollama.generateBiography&limit=50"

# Get statistics
curl http://localhost:3001/api/tracing/statistics

# Check tracing service health
curl http://localhost:3001/api/tracing/health
```

### File Modification Impact

Understanding which files to modify for common tasks:

| Task | Files to Modify |
|------|----------------|
| Change biography generation prompt | `backend/src/services/ollama.js` (lines 17-21) |
| Add new trace point | Relevant service file, wrap with `tracingService.startSpan/endSpan` |
| Add new metric | `backend/src/evaluation/metrics.js` (when created) |
| Add new test case | `backend/src/evaluation/test-cases.json` (when created) |
| Configure tracing | `backend/.env` (TRACING_* variables) |
| Add new API endpoint | Create route in `backend/src/routes/`, register in `server.js` |
| Query traces programmatically | Use `tracingService.queryTraces()` or REST API |

### Environment Configuration

**Tracing Configuration (`backend/.env`):**
```env
TRACING_ENABLED=true                      # Enable/disable tracing
TRACE_OUTPUT_DIR=./traces                 # Where to write JSON trace files
TRACE_PERSIST_TO_DB=true                  # Save to MongoDB
TRACE_INCLUDE_PAYLOADS=true               # Include input/output in traces
TRACE_SAMPLE_RATE=1.0                     # Sample rate (0-1, 1=trace everything)
```

**Logging Configuration:**
```env
LOG_LEVEL=info                            # debug, info, warn, error
LOG_DIR=./logs                            # Where to write log files
LOG_MAX_FILES=7d                          # Keep logs for 7 days
LOG_MAX_SIZE=20m                          # Max size per log file
```

**Evaluation Configuration (for future use):**
```env
EVALUATION_ENABLED=true
EVALUATION_BASELINE_DIR=./evaluation/baselines
EVALUATION_TEST_CASES=./src/evaluation/test-cases.json
```

### Key Differences from GitHub Copilot

While working with Claude Code:

1. **More comprehensive analysis**: Claude can read entire files and understand context deeply
2. **AI Toolkit access**: Claude can query best practices during development
3. **Evaluation-first**: Claude can help design evaluation before implementation
4. **Architectural guidance**: Claude can provide system-level design advice
5. **Context awareness**: Claude maintains full conversation history

### Best Practices from AI Toolkit

These patterns are derived from AI Toolkit MCP tools:

1. **Always trace LLM calls** with input, output, latency, and error information ✓ (implemented)
2. **Validate all LLM outputs** before persisting to database
3. **Implement retry logic** with exponential backoff and jitter
4. **Version prompts** using Git and semantic versioning
5. **Test prompts** with diverse inputs in evaluation suite
6. **Manage context** explicitly - don't let it grow unbounded
7. **Monitor token usage** and costs (even with local models)
8. **Use structured outputs** where possible (JSON, markdown tables)

---

**AI Development Checklist**

Before committing changes to AI features:
- [ ] Added tracing to all new LLM operations
- [ ] Used `logger` instead of `console.log/error`
- [ ] Added validation for LLM outputs
- [ ] Wrote tests for new functions
- [ ] Added evaluation test cases for new capabilities (when evaluation framework exists)
- [ ] Checked trace logs for errors via `/api/tracing/recent`
- [ ] Updated relevant documentation
- [ ] Reviewed with AI Toolkit best practices

---

**Project Location**: `/Users/mikecraig/biography-poc/`

**Created**: 2026-02-10

**Tech Stack**: React + Vite + Express + MongoDB + Ollama + Docker
