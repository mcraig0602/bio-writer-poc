# Troubleshooting Guide

## Common Issues and Solutions

### 1. Ollama Connection Errors

**Symptom**: Frontend shows "Failed to generate biography. Make sure Ollama is running."

**Solutions**:

a. Check if Ollama is running:
```bash
curl http://localhost:11434/api/tags
```

b. Start Ollama if not running:
```bash
ollama serve
```

c. Check if model is pulled:
```bash
ollama list
```

d. Pull the model if missing:
```bash
ollama pull llama3.1
```

e. Verify environment variable in `backend/.env`:
```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1
```

---

### 2. MongoDB Connection Failed

**Symptom**: Backend logs show "MongoDB connection error"

**Solutions**:

a. Check if MongoDB container is running:
```bash
docker ps | grep mongodb
```

b. Start MongoDB if stopped:
```bash
docker start biography-mongodb
```

c. If container doesn't exist, create it:
```bash
docker run -d -p 27017:27017 --name biography-mongodb mongo:7
```

d. Check MongoDB logs:
```bash
docker logs biography-mongodb
```

e. Verify connection string in `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/biography-poc
```

---

### 3. Port Already in Use

**Symptom**: "Error: listen EADDRINUSE: address already in use :::3001"

**Solutions**:

a. Find what's using the port:
```bash
# Backend port (3001)
lsof -i :3001

# Frontend port (5173)
lsof -i :5173

# MongoDB port (27017)
lsof -i :27017
```

b. Kill the process:
```bash
kill -9 <PID>
```

c. Or change the port in environment variables

---

### 4. Module Not Found Errors

**Symptom**: "Cannot find module 'express'" or similar

**Solutions**:

a. Install dependencies:
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

b. Clear node_modules and reinstall:
```bash
rm -rf backend/node_modules frontend/node_modules
cd backend && npm install
cd ../frontend && npm install
```

c. Check Node.js version (need 18+):
```bash
node --version
```

---

### 5. Vite Build Errors

**Symptom**: "Failed to resolve import" or Vite errors

**Solutions**:

a. Clear Vite cache:
```bash
cd frontend
rm -rf node_modules/.vite
```

b. Reinstall dependencies:
```bash
npm install
```

c. Check for syntax errors in JSX files

---

### 6. Docker Compose Issues

**Symptom**: Services fail to start in Docker

**Solutions**:

a. Rebuild containers:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up
```

b. Check logs for specific service:
```bash
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb
```

c. Verify host.docker.internal works (for Ollama):
```bash
docker run --rm curlimages/curl curl http://host.docker.internal:11434/api/tags
```

d. On Linux, you may need to add to docker-compose.yml:
```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

---

### 7. Chat Not Working

**Symptom**: Chat messages send but biography doesn't update

**Solutions**:

a. Check backend logs for Ollama errors:
```bash
tail -f backend.log
```

b. Verify biography exists:
```bash
curl http://localhost:3001/api/biography/current
```

c. Check chat messages are being saved:
```bash
curl http://localhost:3001/api/chat/messages
```

d. Test Ollama directly:
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1",
  "prompt": "Hello",
  "stream": false
}'
```

---

### 8. Biography Not Saving Edits

**Symptom**: Manual edits don't persist

**Solutions**:

a. Check browser console for errors

b. Verify API endpoint:
```bash
curl -X PUT http://localhost:3001/api/biography/edit \
  -H "Content-Type: application/json" \
  -d '{"biography": "Test biography"}'
```

c. Check MongoDB connection

d. Verify biography exists in database:
```bash
docker exec -it biography-mongodb mongosh biography-poc --eval "db.biographies.findOne()"
```

---

### 9. Slow AI Responses

**Symptom**: Biography generation takes too long

**Solutions**:

a. Use a smaller/faster model:
```bash
ollama pull mistral
```

Then update `backend/.env`:
```env
OLLAMA_MODEL=mistral
```

b. Increase Ollama resources:
```bash
# Set environment variables before starting Ollama
export OLLAMA_MAX_LOADED_MODELS=1
export OLLAMA_NUM_PARALLEL=1
ollama serve
```

c. Consider GPU acceleration if available

---

### 10. CORS Errors in Browser

**Symptom**: "Access to XMLHttpRequest blocked by CORS policy"

**Solutions**:

a. Verify backend CORS is enabled in `backend/src/server.js`

b. Check frontend is using correct API URL:
```bash
# In frontend/.env
VITE_API_URL=http://localhost:3001/api
```

c. Restart backend after changes

---

### 11. Environment Variables Not Loading

**Symptom**: Application uses default values instead of .env

**Solutions**:

a. Verify .env file exists:
```bash
ls -la backend/.env
ls -la frontend/.env
```

b. Copy from example if missing:
```bash
cp backend/.env.example backend/.env
```

c. Restart the application completely

d. In frontend, ensure variables start with `VITE_`:
```env
VITE_API_URL=http://localhost:3001/api
```

---

### 12. History Not Showing

**Symptom**: History log is empty

**Solutions**:

a. Verify biography has history entries:
```bash
curl http://localhost:3001/api/biography/history
```

b. Make some changes to trigger history:
- Generate a new biography
- Edit manually
- Refine via chat

c. Check browser console for errors

---

## Getting Help

If you're still stuck:

1. **Check logs**:
   ```bash
   tail -f backend.log
   tail -f frontend.log
   ```

2. **Test API directly**:
   ```bash
   ./test-api.sh
   ```

3. **Verify all services**:
   ```bash
   # Ollama
   curl http://localhost:11434/api/tags

   # Backend
   curl http://localhost:3001/health

   # MongoDB
   docker exec -it biography-mongodb mongosh --eval "db.version()"
   ```

4. **Clean restart**:
   ```bash
   # Stop everything
   docker stop biography-mongodb
   pkill -f "node.*backend"
   pkill -f "vite"

   # Clear logs
   rm -f backend.log frontend.log

   # Start fresh
   ./setup.sh
   ./start-dev.sh
   ```

5. **Check system resources**:
   - Ollama can be memory-intensive (4GB+ recommended)
   - Ensure Docker has adequate resources allocated
