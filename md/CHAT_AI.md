# AI Chat Flow Documentation

## Overview

The AI Chat feature enables users to interact with an AI assistant that answers questions **strictly based on organization-specific documents**.
The system is designed with **security, explainability, and real-time interaction** in mind.

This flow is a core part of the **RAG-based AI Knowledge System** described in the project proposal.

---

## Key Objectives

- Ensure AI responses are **context-aware** (team & organization scoped)
- Prevent hallucinations using **Retrieval-Augmented Generation (RAG)**
- Persist all conversations for **auditability and analytics**
- Deliver responses in **real time** using WebSocket-based updates
- Maintain strict **access control and data isolation**

---

## High-Level Flow Summary

1. User opens a new AI chat
2. User selects a team to scope AI knowledge
3. User sends a message
4. Backend validates authentication and authorization
5. User message is stored in the database
6. Relevant documents are retrieved based on team context
7. AI generates a response using RAG
8. AI response is stored in the database
9. Frontend receives updates via real-time subscription
10. Conversation is rendered to the user

---

## Detailed Flow Description

### 1. Chat Session Initialization

- When a user opens the AI chat interface:
  - The system creates or loads a `chat_session`
  - The session is associated with:
    - `user_id`
    - `organization_id`
    - `team_id`

This ensures each chat is **isolated and traceable**.

---

### 2. Team Context Selection

- The user selects a team before sending messages
- The selected team determines:
  - Which documents can be retrieved
  - Which vector index / namespace is queried

This prevents **cross-team knowledge leakage**.

---

### 3. User Message Submission

- The user submits a message through the chat UI
- The backend performs:
  - Authentication validation
  - Authorization check (user belongs to selected team)

If validation fails, the request is rejected.

---

### 4. Persisting User Message

- Upon successful validation:
  - The user message is stored in the database

Example fields:
- `chat_id`
- `user_id`
- `role = "user"`
- `content`
- `created_at`

This guarantees:
- Full conversation history
- Auditability
- Analytics readiness

---

### 5. Retrieval-Augmented Generation (RAG)

After storing the user message, the backend:

1. Retrieves recent chat history for context
2. Retrieves relevant document chunks scoped by:
   - Organization
   - Team
3. Sends the combined context to the AI model

The AI **never answers without retrieved documents**, ensuring explainable responses.

---

### 6. AI Response Generation

- The AI generates a response based only on:
  - User message
  - Retrieved document chunks
  - Conversation history

Optional metadata can include:
- Source document references (citations)
- Confidence score
- Generation latency

---

### 7. Persisting AI Message

- The AI response is stored in the database with:
  - `role = "assistant"`
  - Response content
  - Citation metadata

This enables:
- Admin analytics
- Detection of low-confidence responses
- Transparency and trust

---

### 8. Real-Time Message Delivery

- Once the AI message is stored:
  - A real-time event is emitted via Supabase Realtime
  - The frontend is subscribed to message updates

This removes the need for polling and ensures instant UI updates.

---

### 9. Frontend Rendering

- The frontend receives the new message via WebSocket
- The chat UI updates automatically
- The user sees the AI response in real time

---

## Data Ownership & Privacy

- All messages are associated with a `user_id`
- All data is scoped by organization
- Users can:
  - View their chat history
  - Request deletion of their data

This supports **GDPR-style data control**.

---

## Why This Design Works

- Prevents AI hallucinations
- Supports real-time interaction
- Secure by default
- Scalable to multiple teams and organizations
- Strong alignment with real-world enterprise AI systems
- Fully justifiable as **Major AI + Major Web module**

---

## Related Diagrams

- AI Chat Flowchart (Mermaid)
- RAG Pipeline Architecture
- Database Schema (Chats & Messages)
