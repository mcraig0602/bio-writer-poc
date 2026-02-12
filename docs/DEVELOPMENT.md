# Development Guide

## Project Overview

This is a Biography Generator POC that uses AI (via Ollama) to transform raw text into polished biographies with conversational refinement capabilities.

## Development Environment Setup

### Prerequisites
- Node.js 18+ and npm
- Docker (for MongoDB)
- Ollama (for AI processing)

### Initial Setup

1. **Run the setup script**:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

   This will:
   - Check all prerequisites
   - Start MongoDB in Docker
   - Pull the Ollama model (llama3.1)
   - Install all dependencies

2. **Start development servers**:
   ```bash
   chmod +x start-dev.sh
   ./start-dev.sh
   ```

### Manual Setup (Alternative)

If you prefer manual control:

**Terminal 1 - MongoDB**:
```bash
docker run -d -p 27017:27017 --name biography-mongodb mongo:7
```

**Terminal 2 - Ollama**:
```bash
ollama serve
ollama pull llama3.1
```

**Terminal 3 - Backend**:
```bash
cd backend
npm install
npm run dev
```

**Terminal 4 - Frontend**:
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
biography-poc/
├── backend/                 # Express.js backend
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic (Ollama integration)
│   │   └── server.js       # Express app entry point
│   ├── __tests__/          # Backend tests
│   ├── .env                # Environment variables (local)
│   ├── .env.example        # Environment template
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API client
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── __tests__/          # Frontend tests
│   └── package.json
└── docker-compose.yml      # Docker orchestration
```

## Key Technologies

### Backend
- **Express.js**: Web framework
- **MongoDB + Mongoose**: Database and ODM
- **Axios**: HTTP client for Ollama API
- **Ollama**: Local LLM for AI processing

### Frontend
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Axios**: HTTP client for API calls
- **Vitest**: Testing framework

## Development Workflow

### Making Changes

1. **Backend changes**:
   - Modify files in `backend/src/`
   - Server auto-reloads with nodemon
   - Check logs: `tail -f backend.log`

2. **Frontend changes**:
   - Modify files in `frontend/src/`
   - Vite hot-reloads automatically
   - Check logs: `tail -f frontend.log`

### API Development

All API endpoints are in `backend/src/routes/`:
- `biography.js` - Biography CRUD operations
- `chat.js` - Chat and refinement endpoints

See [API.md](./API.md) for detailed API documentation.

### Testing

**Backend tests**:
```bash
cd backend
npm test
```

**Frontend tests**:
```bash
cd frontend
npm test
```

**Watch mode**:
```bash
npm test -- --watch
```

## Ollama Integration

### How it works

The application uses Ollama's REST API at `http://localhost:11434`:

1. **Biography Generation** (`/api/generate`):
   - Sends a prompt with the raw input
   - Receives a polished biography

2. **Keyword Extraction** (`/api/generate`):
   - Extracts 5-10 relevant keywords
   - Prompts request JSON output; parser remains backward-compatible with comma-separated output

3. **Refinement** (`/api/generate`):
   - Includes conversation context
   - Applies user's refinement instruction

### System prompts, data separation, and structured outputs

LLM prompts are assembled from consistent blocks to keep "persona" (system) and "data" separate:
- **SYSTEM**: a short persona/role description (sent via Ollama request-body `system` when enabled)
- **TASK**: what to do
- **DATA**: the provided inputs/context
- **OUTPUT**: output constraints (plain text vs JSON)

See backend prompt utilities:
- Prompt assembly: `backend/src/prompts/promptBuilder.js`
- Personas: `backend/src/prompts/personas.js`

### Optional Ollama features (env flags)

These are opt-in to preserve compatibility with older Ollama versions:

```env
# When true, send persona via the Ollama request-body `system` field.
AI_USE_OLLAMA_SYSTEM=true

# When true, send `format: "json"` for JSON-only operations (keywords + structured field updates).
AI_USE_OLLAMA_JSON_FORMAT=true
```

Defaults are `false` if unset.

### Changing Models

Edit `backend/.env`:
```env
# Preferred (OpenAI-style)
AI_MODEL=llama3.1  # or mistral, llama2, etc.

# Backwards-compatible
OLLAMA_MODEL=llama3.1
```

Then restart the backend.

### Prompt Engineering

Prompt templates live in `backend/src/prompts/` and are called by the LLM service in `backend/src/services/ollama.js`.

See [LLM_PROMPTS.md](./LLM_PROMPTS.md) for a full prompt catalog and an architecture diagram.

## Database

### MongoDB Schema

Two main collections:

**biographies**:
- Single document for the current biography
- Includes change history array
- Auto-updates `updatedAt` timestamp

**chatmessages**:
- One document per message
- Linked to biography via `biographyId`
- Maintains conversation order

### Inspecting Data

```bash
# Connect to MongoDB
docker exec -it biography-mongodb mongosh

# Switch to database
use biography-poc

# View biography
db.biographies.findOne()

# View chat messages
db.chatmessages.find().sort({timestamp: 1})
```

## Common Issues

### Ollama not responding
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve

# Check if model is available
ollama list
```

### MongoDB connection failed
```bash
# Check if container is running
docker ps | grep mongodb

# Start it if stopped
docker start biography-mongodb

# View logs
docker logs biography-mongodb
```

### Port already in use
```bash
# Find process using port 3001 (backend)
lsof -i :3001

# Find process using port 5173 (frontend)
lsof -i :5173

# Kill if needed
kill -9 <PID>
```

## Docker Development

### Using Docker Compose

```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Accessing Services in Docker

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- MongoDB: mongodb://localhost:27017

**Note**: Ollama must run on host machine (not containerized) and is accessed via `host.docker.internal` from containers.

## Future Development (TODOs)

Priority improvements marked with TODO comments:

1. **Authentication**:
   - Add JWT or session-based auth
   - Implement Authorization header middleware
   - Multi-user support

2. **AI Provider Flexibility**:
   - Abstract AI provider interface
   - Add OpenAI/Anthropic support
   - Environment-based provider selection

3. **Advanced Keyword Extraction**:
   - Integrate Hugging Face Transformers
   - Better NLP processing

4. **Multiple Projects**:
   - Users can manage multiple biographies
   - Project switching UI

5. **Real-time Features**:
   - WebSocket support for chat
   - Live typing indicators

## Code Style

- Use ES modules (`import/export`)
- Async/await for asynchronous code
- Descriptive variable names
- Comments for complex logic
- Keep components small and focused

## Git Workflow

```bash
# Initialize repo
git init
git add .
git commit -m "Initial commit: Biography Generator POC"

# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: your feature description"

# Push to remote
git push origin feature/your-feature
```

## Debugging

### Backend Debugging

Add breakpoints or console.logs in:
- `backend/src/routes/` - API endpoint handlers
- `backend/src/services/ollama.js` - AI integration

### Frontend Debugging

Use React DevTools and browser console:
```javascript
console.log('Biography state:', biography);
```

### Network Debugging

Check API calls in browser DevTools Network tab or:
```bash
# Watch backend logs
tail -f backend.log

# Test endpoints directly
curl http://localhost:3001/api/biography/current
```

## Performance Optimization

Current bottlenecks:
1. **Ollama response time** (2-10 seconds depending on model)
2. **Keyword extraction** (runs after biography generation)

Possible improvements:
- Stream responses from Ollama
- Cache frequently used prompts
- Use smaller models for keywords
- Add request queuing for concurrent requests

## Resources

- [Ollama Documentation](https://ollama.ai/docs)
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Manual](https://docs.mongodb.com)
- [Vite Guide](https://vitejs.dev)
