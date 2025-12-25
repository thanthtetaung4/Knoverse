#!/bin/bash

# Setup script for PDF to Pinecone Indexing Pipeline

echo "======================================"
echo "PDF to Pinecone Setup Script"
echo "======================================"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed. Please install Python 3."
    exit 1
fi

echo ""
echo "✓ Python 3 found"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip setuptools wheel > /dev/null 2>&1

# Install requirements
echo "Installing dependencies..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo ""
    echo "======================================"
    echo "✓ Setup completed successfully!"
    echo "======================================"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env file with your Pinecone API key"
    echo "2. Ensure Ollama is running: ollama serve"
    echo "3. Run: source venv/bin/activate && python main.py"
    echo ""
else
    echo "Error: Failed to install dependencies"
    exit 1
fi
