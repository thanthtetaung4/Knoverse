# User Login Flow

## Overview

The **User Login Flow** manages user authentication and role-based redirection within the system.
It ensures that only users with valid credentials can access the platform and are routed to the correct dashboard based on their assigned role.

This flow supports **Role-Based Access Control (RBAC)** by distinguishing between **admin** and **regular users** immediately after authentication.

---

## Login Flow Description

1. The user submits the login form.
2. The system validates the provided credentials.
3. If the credentials are invalid, an error message is shown.
4. If the credentials are valid, authentication succeeds.
5. The system checks the authenticated user’s role.
6. The user is redirected based on their role:
   - **Admin** → Admin Dashboard
   - **User** → User Dashboard

---

## Login Flowchart

```mermaid
flowchart TD
    A[User submits Login Form] --> B[Validate Credentials]

    B -->|Invalid| C[Show Login Error]

    B -->|Valid| D[Authentication Successful]

    D --> E{Check User Role}

    E -->|Admin| F[Redirect to Admin Dashboard]

    E -->|User| G[Redirect to User Dashboard]
