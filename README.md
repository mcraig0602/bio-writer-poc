# Biography Generator POC

A proof-of-concept application that uses AI to generate polished biographies from raw text input, with conversational refinement capabilities.

## Features

- **AI-Powered Biography Generation**: Transform raw descriptions into polished, professional biographies
- **Keyword Extraction**: Automatically extract relevant keywords/tags from the input
- **Conversational Refinement**: Chat-based interface to iteratively refine the biography
- **Manual Editing**: Edit the generated biography directly
- **Change History**: Track all modifications with timestamps and sources
- **Modern UI**: Clean, responsive interface built with React

## Tech Stack

- **Frontend**: React, Vite, Vitest
- **Backend**: Express.js, Node.js
- **Database**: MongoDB
- **AI**: Ollama (local LLM)
- **Infrastructure**: Docker, Docker Compose

## Prerequisites

1. **Docker & Docker Compose** installed
2. **Ollama** installed and running locally
   ```bash
   # Install Ollama (macOS/Linux)
   curl -fsSL https://ollama.com/install.sh | sh

   # Start Ollama
   ollama serve

   # Pull the model
   ollama pull llama3.1
   ```

## Quick Start

### Using Docker Compose

1. Clone the repository:
   ```bash
   cd ~/biography-poc
   ```

2. Build and start all services:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Local Development

#### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Usage

1. **Generate Initial Biography**
   - Enter your raw text description in the input field
   - Click "Generate Biography"
   - Wait for the AI to process and return a polished biography with keywords

2. **Manual Editing**
   - Click the "Edit" button on the biography
   - Modify the text as needed
   - Click "Save" to update

3. **Conversational Refinement**
   - Use the chat panel on the right to refine the biography
   - Examples:
     - "Make it more formal"
     - "Add emphasis on leadership experience"
     - "Shorten to 3 sentences"
   - The AI maintains full conversation context

4. **View History**
   - Click "Show Change History" to see all previous versions
   - Each entry shows the source (initial/chat/manual) and timestamp

## API Endpoints

### Biography Routes
- `POST /api/biography/generate` - Generate initial biography and tags
- `GET /api/biography/current` - Get current biography
- `PUT /api/biography/edit` - Edit biography manually
- `GET /api/biography/history` - Get change history

### Chat Routes
- `POST /api/chat/refine` - Refine biography via chat
- `GET /api/chat/messages` - Get chat history
- `DELETE /api/chat/clear` - Clear chat history

## Environment Variables

### Backend (.env)
```env
PORT=3001
MONGODB_URI=mongodb://mongodb:27017/biography-poc

# Preferred (OpenAI-style, provider-agnostic)
# These override OLLAMA_* when set.
AI_BASE_URL=http://host.docker.internal:11434
AI_MODEL=llama3.1

# Backwards-compatible (still supported)
OLLAMA_URL=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.1

# Optional OpenAI-like knobs (if unset, Ollama defaults apply)
# AI_TEMPERATURE=0.7
# AI_MAX_TOKENS=512
# AI_TIMEOUT_MS=60000
# AI_MAX_RETRIES=2
```

### Frontend
```env
VITE_API_URL=http://localhost:3001/api
```

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Architecture

### Project Structure
```
biography-poc/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── models/
│   │   │   ├── Biography.js
│   │   │   └── ChatMessage.js
│   │   ├── routes/
│   │   │   ├── biography.js
│   │   │   └── chat.js
│   │   ├── services/
│   │   │   ├── ollama.js
│   │   │   └── keywords.js
│   │   └── server.js
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── InputForm.jsx
│   │   │   ├── BiographyDisplay.jsx
│   │   │   ├── TagsDisplay.jsx
│   │   │   ├── ChatPanel.jsx
│   │   │   └── HistoryLog.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## Future Enhancements (TODOs)

- [ ] Add Authorization header support for multi-user authentication
- [ ] Switch to external AI provider (OpenAI/Anthropic)
- [ ] Implement Hugging Face Transformers for keyword extraction
- [ ] Support multiple biography projects per user
- [ ] Real-time chat updates with WebSockets
- [ ] Export biography to various formats (PDF, HTML)

## Troubleshooting

### Ollama Connection Issues
- Ensure Ollama is running: `ollama serve`
- Check if the model is pulled: `ollama list`
- Verify `AI_BASE_URL` (preferred) or `OLLAMA_URL` in environment variables

### MongoDB Connection Issues
- Ensure MongoDB container is running: `docker ps`
- Check MongoDB logs: `docker logs biography-mongodb`

### Port Conflicts
- Frontend (5173), Backend (3001), MongoDB (27017)
- Change ports in docker-compose.yml if needed

## License

MIT
