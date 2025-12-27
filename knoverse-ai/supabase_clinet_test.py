import os

from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_KEY")

print(url, key)
supabase: Client = create_client(url, key)


response = supabase.table("teams").select("*").execute()

print(response)

try:
	response = supabase.storage.from_("files").download("sample-terms-conditions-agreement.pdf")
except Exception as e:
	print(e)
print(response)