*This project has been created as part of the 42 curriculum by taung, lshein, hthant, aoo, nsan.*

# Knoverse (Knowledge Universe)

## Description

**Knoverse** is an AI-backed collaborative chat platform designed for organizations and teams to interact intelligently with their internal knowledge base.  
It enables users to ask natural-language questions about their team’s uploaded documents and receive accurate, contextual answers powered by a Retrieval-Augmented Generation (RAG) system.

The platform also provides administrators with full control over teams, users, permissions, and activity analytics, allowing organizations to understand engagement and knowledge usage across teams.

### Key Goals
- Centralize team knowledge into a searchable, conversational interface
- Enable secure, team-scoped AI document querying
- Provide administrators with visibility and control over organizational activity
- Demonstrate a full modern web stack with AI integration, containerization, and modular architecture

---

## Key Features

### Core Features
- **AI-Powered Team Chat**
  - Ask questions about uploaded team documents
  - Context-aware answers using vector via `team_id` query
  - Conversation history preserved per team and session

- **Retrieval-Augmented Generation (RAG)**
  - PDF ingestion, chunking, embedding, and indexing
  - Semantic retrieval via Pinecone
  - LLM-based response generation using Ollama (Gemma 3)

- **Team-Based Access Control**
  - Strict isolation of data by team
  - Users can only query documents belonging to their teams
  - Role-based permissions (admin / organizer / member)

- **Admin Dashboard**
  - Team and user management
  - View activity statistics (most active teams, usage patterns)
  - File management and visibility into indexed documents

### Additional Features
- Server-Side Rendering (SSR) for improved performance
- ORM-based database access using Drizzle
- File upload and management system
- Dockerized full-stack deployment (frontend, backend, AI services)
- Modular microservice-style AI backend

---

## Project Architecture

Knoverse is composed of **two main runtimes**, fully containerized and orchestrated with Docker:

### 1. knoverse-sys (Web Application)
- **Frontend:** React + Next.js
- **Backend:** Next.js API routes (Node.js)
- **Authentication & Database:** Supabase
- **ORM:** Drizzle
- **Styling:** TailwindCSS

Responsibilities:
- UI rendering
- Authentication & authorization
- Team, user, and file management
- Chat session handling
- Communication with AI service

### 2. knoverse-ai (AI Service)
- **Language:** Python
- **LLM:** Ollama (Gemma 3)
- **Vector Database:** Pinecone

Responsibilities:
- PDF processing and chunking
- Vector embedding and indexing
- Semantic retrieval
- LLM prompt construction and response generation

### High-Level Flow
1. User sends a message from the web UI
2. Backend validates user and team membership
3. Relevant document chunks are retrieved from Pinecone
4. Chat hostory is retrieved from Supabase
5. AI service generates a response using retrieved context
6. Response is stored on the Supabase
7. The chat is updated on UI via Websocket

---

## Instructions

### Prerequisites
- Docker **v24+**
- Docker Compose **v2+**
- Git

No local Node.js or Python installation is required for execution.

---

### Environment Configuration

This project requires **three environment files**:

#### 1. `knoverse-sys/.env`
```env
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
```

#### 2. `knoverse-sys/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

#### 3. `knoverse-ai/.env`

```env
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=...
OLLAMA_BASE_URL=...
```

---

### Running the Project (Fully Working, AI Included)

1. Clone the repository:

```bash
git clone https://github.com/your-repo/knoverse.git
cd knoverse
```

2. Build and start all services:

```bash
docker compose up --build
```

3. Access the application:

* Web App: `http://localhost:3000`
* AI services are internally networked via Docker

---

## Technical Stack

### Frontend

* React
* Next.js
* TypeScript
* TailwindCSS

### Backend

* Node.js (Next.js API routes)
* Supabase (Auth + PostgreSQL)
* Drizzle ORM

### AI & Data

* Python
* Ollama (Gemma 3 model)
* Pinecone Vector Database

### Infrastructure

* Docker
* Docker Compose
* Microservice-oriented architecture

**Justification:**
This stack provides strong type safety, scalability, SSR support, secure authentication, and a production-grade AI pipeline while remaining maintainable and modular.

---

## Database Schema (Overview)

* **users** – authenticated users
* **teams** – organizational units
* **team_members** – user-to-team relationships with roles
* **team_files** – uploaded documents per team
* **chat_sessions** – conversation threads
* **chat_messages** – user and AI messages

All context data access is strictly scoped by `team_id` to prevent cross-team leakage.
All data is strictly scoped by `user_role` and only `admin` can CRUD the user data.

## Storage Bucket
* **files** - stores all the files for teams

---

## Modules

### Major Modules (2 points each)

1. **Full-Stack Framework (Frontend + Backend)**

   * Next.js used for both UI and server logic

2. **Real-Time Capable Chat System**

   * Session-based messaging with persistent history

3. **Advanced Permission & Organization System**

   * Team-scoped access control and role management

4. **Complete RAG System**

   * PDF ingestion → embeddings → vector retrieval → LLM answers

5. **LLM System Interface**

   * Ollama-powered local model inference

6. **Backend as Microservices**

   * AI runtime decoupled from web backend

7. **Custom Major Module: Team-Scoped AI Knowledge Engine**

   * **Why:** Core problem of secure, contextual organizational knowledge access
   * **Challenges:** Isolation, embedding consistency, retrieval accuracy, latency
   * **Value:** Turns static documents into an interactive knowledge system
   * **Justification:** High technical complexity, deep AI integration, central to project

---

### Minor Modules (1 point each)

* ORM integration (Drizzle)
* Server-Side Rendering (SSR)
* File upload and management
* User authentication and management
* Activity analytics dashboard
* Cross-browser compatibility
* Reusable components
* Advanced search and pagination tables
* User activity analytics dashboard

---

## Individual Contributions

* **taung -  Teach Lead**

	* Designed and implemented the AI pipeline
	* Built the complete RAG system (PDF ingestion, embedding, retrieval)
	* Integrated Pinecone and Ollama into the backend workflow
	* Led technical decision-making across frontend, backend, and AI services
	* Ensured clean service separation, scalability, and code quality	

* **nsan - Project Manager**
	* Designed database schema and data relationships
	* Implemented ORM integration using Drizzle
	* Developed analytics and reporting features
	* Coordinated task distribution and milestone tracking

* **aoo - Product Owner**
	* Defined feature scope and project direction
	* Defined overall system architecture
	* Coordinated deployment workflow and runtime integration
	* Ensured alignment with evaluation requirements

* **hthant - Developer**
	* Built frontend UI and layout system
	* Implemented chat interface and admin dashboard
	* Integrated frontend with backend APIs
	* Ensured usability, responsiveness, and UX consistency

* **lshein - Developer**
	* Optimized retrieval accuracy and response quality
	* Defined overall system architecture
	* Implemented core backend logic and permission model
	* Managed Dockerization and environment configuration



**Challenges Addressed:**

* Secure AI retrieval per team
* Scaling document embeddings
* Coordinating multi-service Docker setup
* Maintaining clean separation of concerns

---

## Resources

### Technical References

* Next.js Documentation
* Supabase Documentation
* Drizzle ORM Docs
* Pinecone Vector Database Docs
* Ollama Documentation
* Docker & Docker Compose Documentation

### Docker Installation

* [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)

### AI Usage

AI was used to:

* Generate contextual answers from team documents
* Perform semantic search using vector embeddings
* Enhance user productivity through natural language interaction

---

## License

MIT License - open source.
This project is developed for educational purposes as part of the 42 curriculum.

```
