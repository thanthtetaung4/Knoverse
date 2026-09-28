import os
import sys
from pathlib import Path

# Must be set before `config` is imported by the app.
os.environ["AI_SERVICE_TOKEN"] = "test-token"
os.environ.setdefault("SUPABASE_URL", "http://supabase.invalid")
os.environ.setdefault("SUPABASE_KEY", "test-key")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
