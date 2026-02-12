#!/bin/bash

# Biography POC - Local Development Setup Script

echo "🚀 Setting up Biography Generator POC..."

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi
echo "✅ Node.js $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi
echo "✅ npm $(npm --version)"

# Check Ollama
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama is not installed. Please install from https://ollama.com"
    echo "   Run: curl -fsSL https://ollama.com/install.sh | sh"
    exit 1
fi
echo "✅ Ollama installed"

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama is not running. Starting Ollama..."
    echo "   Please run 'ollama serve' in another terminal"
    exit 1
fi
echo "✅ Ollama is running"

# Check MongoDB
echo ""
echo "📦 Checking MongoDB..."
if ! docker ps | grep -q mongodb; then
    echo "📦 Starting MongoDB container..."
    docker run -d -p 27017:27017 --name biography-mongodb mongo:7
    echo "✅ MongoDB started"
else
    echo "✅ MongoDB already running"
fi

# Pull Ollama model
echo ""
echo "🤖 Checking Ollama model..."
if ! ollama list | grep -q llama3.1; then
    echo "📥 Pulling llama3.1 model (this may take a while)..."
    ollama pull llama3.1
fi
echo "✅ llama3.1 model ready"

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..
echo "✅ Backend dependencies installed"

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..
echo "✅ Frontend dependencies installed"

# Create environment files if they don't exist
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "To start the application:"
echo "  1. Make sure Ollama is running: ollama serve"
echo "  2. Run the start script: ./start-dev.sh"
echo ""
