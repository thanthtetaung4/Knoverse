# Admin User Management

## Overview

The **Admin User Management** feature allows authorized administrators to securely **create, modify, and delete users**, as well as **assign users to teams**.
All sensitive operations are handled exclusively through backend APIs with strict authentication and authorization checks to prevent abuse, request tampering, or privilege escalation.

This module follows **enterprise-grade security practices** and integrates with **Supabase Auth and Database**.

---

## Features

- Create new users with role and team assignment
- Modify existing users and update team membership
- Delete single or multiple users
- Backend-enforced role-based access control (RBAC)
- Secure API calls protected by JWT verification
- Scalable user–team relationship design

---

## Architecture Overview

```
	Admin Dashboard (Frontend)
	|
	| Authenticated API Request (JWT)
	v
	Backend API (Next.js Server)
	|
	| Service Role Access
	v
	Supabase (Auth + Database)
```

- **Frontend**: UI only, no direct access to Supabase
- **Backend**: Security gatekeeper and business logic
- **Supabase**: Authentication, data storage, and RLS enforcement

---

## Authentication & Authorization

### Authentication

- Users authenticate via **Supabase Auth**
- Each request includes a valid **JWT access token**
- Backend verifies token authenticity on every request

### Authorization

- Backend fetches the user’s role from the database
- Only users with the `admin` role can access user management APIs
- Client-provided role or permission data is ignored

---

## User Management Flows

### Create User

**Description:**
Allows an admin to create a new user and assign them to a team.

**Flow:**
1. Admin fills in user details (name, email, role, team)
2. Frontend sends request to backend API
3. Backend verifies JWT and admin role
4. Backend creates:
   - Supabase Auth user
   - User profile record
   - Team assignment
5. Success response returned to frontend

---

### Modify User (Assign Team)

**Description:**
Allows an admin to update a user’s team assignment.

**Flow:**
1. Admin selects a user
2. Admin selects a team (fetched from backend)
3. Frontend sends user ID and team ID
4. Backend validates admin privileges
5. Backend updates the user–team mapping
6. Dashboard UI updates with the new team

---

### Delete User

**Description:**
Allows an admin to delete one or multiple users.

**Flow:**
1. Admin selects user(s) and confirms deletion
2. Frontend sends user ID(s) to backend
3. Backend verifies authentication and admin role
4. Backend deletes:
   - Auth user
   - User profile
   - Associated team relations
5. Dashboard updates after success

---

## API Endpoints (Example)

```http
POST   /api/admin/users          → Create user
PATCH  /api/admin/users/:id/team → Update user team
DELETE /api/admin/users          → Delete user(s)
