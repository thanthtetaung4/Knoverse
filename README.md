*This project has been created as part of the 42 curriculum by taung, lshein, hthant, nsan, aoo.*

# Knoverse: Team-Based Chat over Uploaded Documents

## Description

**Project Name:** Knoverse  

Knoverse is a collaborative platform that allows teams to chat and interact over uploaded documents. It combines a web interface for team collaboration with an AI-powered document retrieval and Q&A system.  

**Key Features:**
- Team management: create, edit, and manage multiple teams and their members.
- Document upload: PDFs and other files can be uploaded per team.
- Chat interface: team members can discuss topics and ask questions within a chat interface.
- AI-powered retrieval: uploaded documents are indexed and queried using a vector database to answer questions contextually.
- Role-based access control: team membership governs access to messages and documents.

The system is implemented in two integrated runtimes:
1. **knoverse-sys (TypeScript / Next.js)** – Handles UI, team management, chat, and API endpoints.
2. **knoverse-ai (Python)** – Handles PDF indexing, retrieval, and generation of AI-assisted responses using a RAG (Retrieval-Augmented Generation) pipeline.

## Instructions

### Prerequisites
- Node.js v20+  
- pnpm or npm  
- Python 3.11+  
- Supabase account (for authentication and database)  
- Pinecone account (for vector database storage)  
- .env file with configuration:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
  SUPABASE_SERVICE_KEY=<your-service-key>
  PINECONE_API_KEY=<your-pinecone-key>
  PINECONE_ENV=<pinecone-environment>

### Web App Setup (knoverse-sys)

1. Install dependencies:

   ```bash
   pnpm install
   ```
2. Start the development server:

   ```bash
   pnpm dev
   ```
3. Access the app at [http://localhost:3000](http://localhost:3000)

### AI Tools Setup (knoverse-ai)

1. Create and activate a Python virtual environment:

   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
2. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```
3. Index documents into Pinecone:

   ```bash
   python index_pdfs.py
   ```
4. Test query pipeline:

   ```bash
   python ask_pdf.py
   ```

---

## Resources

* [Next.js Documentation](https://nextjs.org/docs) – Frontend framework reference.
* [Supabase Docs](https://supabase.com/docs) – Authentication and database management.
* [Drizzle ORM](https://orm.drizzle.team/) – Database schema and migrations.
* [Pinecone Docs](https://docs.pinecone.io/) – Vector database for embeddings.
* AI Usage:

  * PDF chunking, embedding, and storage in Pinecone.
  * Querying and generating contextual responses in team chat.

---

## Team Information

| Member   | Role                      | Responsibilities                                      |
| -------- | ------------------------- | ----------------------------------------------------- |
| <login1> | Product Owner / Tech Lead | Project vision, backend architecture, AI integration. |
| <login2> | Developer                 | Frontend UI pages, chat flow, API endpoints.          |
| <login3> | Developer                 | PDF indexing, Pinecone integration, RAG pipeline.     |

---

## Project Management

* Task distribution: Trello board with categorized cards (Frontend, Backend, AI, QA).
* Meetings: Twice weekly Zoom syncs, ad-hoc via Discord.
* Communication channels: Discord server for daily updates, Slack for urgent issues.
* Version control: GitHub repository with feature branches and pull requests.

---

## Technical Stack

* **Frontend:** Next.js 14, TypeScript, React 18, TailwindCSS
* **Backend:** Next.js API routes, TypeScript, Supabase auth/session
* **Database:** Supabase/PostgreSQL with Drizzle ORM
* **AI/ML:** Python 3.11, OpenAI LLM, Pinecone vector DB, LangChain-style RAG pipeline
* **Justification:**

  * Next.js provides full-stack capabilities, server-side rendering, and app routing.
  * Supabase simplifies authentication, database access, and real-time features.
  * Pinecone enables scalable vector search for document retrieval.

---

## Database Schema

**Key Tables (Drizzle ORM):**

* `teams` – id, name, description
* `team_members` – user_id, team_id, role
* `team_files` – id, team_id, filename, metadata
* `chat_sessions` – id, team_id, session_id
* `chat_messages` – id, session_id, user_id, message, created_at

**Relationships:**

* One team → many members
* One team → many files
* One session → many messages

*All operations are scoped by `teamId` to ensure isolation between teams.*

---

## Features List

| Feature                  | Implemented By     | Description                                                    |
| ------------------------ | ------------------ | -------------------------------------------------------------- |
| Team selection           | <login1>, <login2> | UI page to view and select teams.                              |
| Team chat                | <login2>           | Chat interface with real-time messaging and AI answers.        |
| File upload & management | <login3>           | Admin pages to upload PDFs and manage team files.              |
| PDF indexing             | <login3>           | Splits PDF into chunks, embeds into Pinecone with metadata.    |
| AI Q&A                   | <login3>           | Retrieves relevant chunks and prompts LLM to generate answers. |
| Authentication           | <login1>           | Supabase auth integration for sessions and permissions.        |

---

## Modules

| Module          | Type  | Points | Description                                                  |
| --------------- | ----- | ------ | ------------------------------------------------------------ |
| Chat API        | Major | 2      | Endpoint for sending/receiving messages with AI integration. |
| PDF Indexing    | Major | 2      | Converts PDFs to embeddings and stores them in Pinecone.     |
| Team Management | Minor | 1      | Admin pages for managing teams, members, and files.          |
| Frontend UI     | Major | 2      | Next.js pages and chat interface.                            |

---

## Individual Contributions

* **<login1>**: System architecture, backend API, authentication flow, team permissions
* **<login2>**: Frontend pages (chat UI, team selection, admin UI), integration with chat API
* **<login3>**: AI pipeline, PDF indexing, Pinecone vector DB integration, query scripts

**Challenges faced:**

* Ensuring team-based isolation for AI retrieval.
* Handling large PDF indexing efficiently.
* Synchronizing chat UI with backend and AI responses in real-time.

---

## Usage Examples

**Sending a chat message:**

```bash
POST /api/chat/sendMessage
{
  "teamId": "123",
  "sessionId": "abc",
  "message": "Explain the key points of the uploaded PDF."
}
```

**Admin file upload:**

* Navigate to `/admin/team/[teamId]/files` → Upload PDF → Automatically indexed in AI pipeline.

---
