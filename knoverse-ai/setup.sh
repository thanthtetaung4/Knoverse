#!/bin/bash

# Setup script for PDF to Pinecone Indexing Pipeline

echo "======================================"
echo "PDF to Pinecone Setup Script"
echo "======================================"

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "Error: uv is not installed. See https://docs.astral.sh/uv/getting-started/installation/"
    exit 1
fi

echo ""
echo "✓ uv found"

# Create .venv (with the pinned Python) and install locked dependencies
echo "Installing dependencies..."
uv sync

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "✓ Setup completed successfully!"
    echo "======================================"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env file with your Pinecone API key"
    echo "2. Ensure Ollama is running: ollama serve"
    echo "3. Run: uv run uvicorn app:app --reload --port 8000"
    echo ""
else
    echo "Error: Failed to install dependencies"
    exit 1
fi
