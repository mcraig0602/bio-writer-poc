# Biography POC - Quick Reference

## 🚀 Quick Start

### First Time Setup
```bash
cd ~/biography-poc
./setup.sh           # Install dependencies and setup environment
./start-dev.sh       # Start all services
```

Access at: **http://localhost:5173**

---

## 📁 Project Structure

```
biography-poc/
├── 📄 README.md              # Main documentation
├── 📄 API.md                 # API documentation
├── 📄 DEVELOPMENT.md         # Development guide
├── 📄 TROUBLESHOOTING.md     # Common issues
├── 🔧 setup.sh               # Setup script
├── 🔧 start-dev.sh           # Start dev servers
├── 🔧 test-api.sh            # Test all endpoints
├── 🐳 docker-compose.yml     # Docker orchestration
│
├── backend/                  # Express.js API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Ollama integration
│   │   ├── models/          # MongoDB schemas
│   │   └── server.js        # Entry point
│   ├── .env                 # Environment config
│   └── Dockerfile
│
└── frontend/                 # React UI
    ├── src/
    │   ├── components/      # UI components
    │   ├── services/        # API client
    │   └── App.jsx          # Main app
    ├── .env                 # Frontend config
    └── Dockerfile
```

---

## 🛠️ Common Commands

### Development
```bash
npm run dev              # Start both servers (from root)
./start-dev.sh          # Alternative start script
./test-api.sh           # Test all API endpoints
```

### Docker
```bash
npm run docker:build    # Build containers
npm run docker:up       # Start containers
npm run docker:down     # Stop containers
npm run docker:logs     # View logs
```

### Testing
```bash
npm test                # Run all tests
npm run test:backend    # Backend tests only
npm run test:frontend   # Frontend tests only
```

### Cleanup
```bash
npm run clean           # Remove node_modules
docker-compose down -v  # Remove Docker volumes
```

---

## 🌐 Service URLs

| Service  | URL                              | Description           |
|----------|----------------------------------|-----------------------|
| Frontend | http://localhost:5173            | React UI              |
| Backend  | http://localhost:3001            | Express API           |
| Health   | http://localhost:3001/health     | Health check          |
| MongoDB  | mongodb://localhost:27017        | Database              |
| Ollama   | http://localhost:11434           | AI service            |

---

## 🔌 API Endpoints

### Biography
- `POST /api/biography/generate` - Generate from raw input
- `GET /api/biography/current` - Get current biography
- `PUT /api/biography/edit` - Edit manually
- `GET /api/biography/history` - View change history

### Chat
- `POST /api/chat/refine` - Refine via conversation
- `GET /api/chat/messages` - Get chat history
- `DELETE /api/chat/clear` - Clear chat

See [API.md](./API.md) for detailed documentation.

---

## 🎯 Key Features

1. **AI Biography Generation** - Transform raw text to polished bio
2. **Keyword Extraction** - Auto-extract relevant tags
3. **Chat Refinement** - Conversational editing with context
4. **Manual Editing** - Direct text modifications
5. **Change History** - Track all modifications
6. **Modern UI** - Clean, responsive React interface

---

## 🔧 Configuration

### Backend (.env)
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/biography-poc

# Preferred (OpenAI-style)
AI_BASE_URL=http://localhost:11434
AI_MODEL=llama3.1

# Backwards-compatible
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

---

## 🐛 Troubleshooting

### Ollama not responding?
```bash
ollama serve              # Start Ollama
ollama pull llama3.1      # Pull model
```

### MongoDB issues?
```bash
docker start biography-mongodb    # Start MongoDB
docker logs biography-mongodb     # Check logs
```

### Port conflicts?
```bash
lsof -i :3001            # Check backend port
lsof -i :5173            # Check frontend port
kill -9 <PID>            # Kill process
```

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for more solutions.

---

## 📝 Development Workflow

1. **Make changes** to code
2. **Auto-reload** (nodemon/Vite handles this)
3. **Test** in browser at localhost:5173
4. **Check logs**: `tail -f backend.log frontend.log`
5. **Test API**: `./test-api.sh`

---

## 🧪 Testing Flow

1. Enter raw text description
2. Click "Generate Biography"
3. View generated biography + keywords
4. Option A: Edit manually
5. Option B: Refine via chat (e.g., "Make it more formal")
6. View change history

---

## 📚 Documentation

- [README.md](./README.md) - Overview and setup
- [API.md](./API.md) - Complete API reference
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guide
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Common issues

---

## 🚧 Future TODOs

- [ ] Add user authentication (Authorization header)
- [ ] Support external AI providers (OpenAI/Claude)
- [ ] Implement Hugging Face for keywords
- [ ] Multiple biography projects
- [ ] WebSocket real-time updates
- [ ] Export to PDF/HTML

---

## 💡 Tips

- **Fast model**: Use `mistral` for quicker responses
- **Debugging**: Check browser console and backend.log
- **Clean state**: Delete MongoDB volume to start fresh
- **Test API**: Use `./test-api.sh` for quick validation

---

## 🆘 Quick Help

```bash
# Full reset
docker-compose down -v
rm -rf node_modules backend.log frontend.log
./setup.sh

# Check everything is running
curl http://localhost:11434/api/tags     # Ollama
curl http://localhost:3001/health        # Backend
curl http://localhost:5173               # Frontend

# View all logs at once
tail -f backend.log frontend.log
```

---

**Project Location**: `~/biography-poc/`

**Created**: 2026-02-10

**Tech Stack**: React + Vite + Express + MongoDB + Ollama + Docker
