"""
Utility script to verify Ollama and Pinecone connectivity
Run this to diagnose connection issues before running main.py
"""

import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "nomic-embed-text")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

def check_ollama():
    """Check if Ollama is running and model is available."""
    print("\n🔍 Checking Ollama...")
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get("models", [])
            model_names = [m["name"] for m in models]
            print(f"✓ Ollama is running at {OLLAMA_BASE_URL}")
            print(f"  Available models: {len(models)}")
            
            if OLLAMA_MODEL in model_names or any(OLLAMA_MODEL in m for m in model_names):
                print(f"✓ Model '{OLLAMA_MODEL}' is available")
                return True
            else:
                print(f"✗ Model '{OLLAMA_MODEL}' not found")
                print(f"  Available: {', '.join(model_names[:5])}")
                return False
        else:
            print(f"✗ Ollama returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"✗ Cannot connect to Ollama at {OLLAMA_BASE_URL}")
        print("  Make sure Ollama is running: ollama serve")
        return False
    except Exception as e:
        print(f"✗ Error checking Ollama: {str(e)}")
        return False

def check_pinecone():
    """Check if Pinecone API key is configured."""
    print("\n🔍 Checking Pinecone...")
    if not PINECONE_API_KEY:
        print("✗ PINECONE_API_KEY not set in .env")
        return False
    
    print("✓ PINECONE_API_KEY is configured")
    
    # Try to import and initialize Pinecone
    try:
        from pinecone import Pinecone
        pc = Pinecone(api_key=PINECONE_API_KEY)
        indexes = pc.list_indexes()
        print(f"✓ Successfully connected to Pinecone")
        print(f"  Current indexes: {len(indexes.indexes) if indexes.indexes else 0}")
        return True
    except Exception as e:
        print(f"✗ Error connecting to Pinecone: {str(e)}")
        return False

def check_pdf():
    """Check if sample PDF exists."""
    print("\n🔍 Checking PDF...")
    pdf_path = "pdf/sample-terms-conditions-agreement.pdf"
    if os.path.exists(pdf_path):
        size_mb = os.path.getsize(pdf_path) / (1024 * 1024)
        print(f"✓ PDF found: {pdf_path}")
        print(f"  Size: {size_mb:.2f} MB")
        return True
    else:
        print(f"✗ PDF not found: {pdf_path}")
        return False

def main():
    """Run all checks."""
    print("=" * 50)
    print("Environment & Dependency Verification")
    print("=" * 50)
    
    checks = {
        "PDF": check_pdf(),
        "Ollama": check_ollama(),
        "Pinecone": check_pinecone()
    }
    
    print("\n" + "=" * 50)
    print("Summary")
    print("=" * 50)
    
    passed = sum(1 for v in checks.values() if v)
    total = len(checks)
    
    for check, result in checks.items():
        status = "✓" if result else "✗"
        print(f"{status} {check}")
    
    print(f"\nPassed: {passed}/{total}")
    
    if passed == total:
        print("\n✓ All checks passed! Ready to run main.py")
        return 0
    else:
        print("\n✗ Some checks failed. Fix the issues above before running main.py")
        return 1

if __name__ == "__main__":
    sys.exit(main())
