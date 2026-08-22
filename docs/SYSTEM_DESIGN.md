# NESTFIX System Design Write-Up

This document details the system architecture and design decisions for NESTFIX, the Society Maintenance Tracker application.

---

## 1. Overall Architecture

NESTFIX is built using a modern decoupled client-server architecture:

```
[React SPA client] <--- HTTP REST API (JSON) ---> [Node/Express Server] <---> [PostgreSQL + Prisma]
     (Vite)                                              |
                                                         +-----> [Cloudinary Image Storage]
                                                         +-----> [Resend Email Notification]
```

* **Frontend**: React.js application compiled via Vite. Styled with Tailwind CSS v4 for utility-first responsive layout styling.
* **Backend**: Node.js and Express.js REST API. Uses Helmet for HTTP headers security, CORS configuration, and express-rate-limit middleware on auth routes to prevent brute-force attacks.
* **Database**: PostgreSQL relational database. Handled through Prisma ORM for type safety, schemas, migrations, and transactions.

---

## 2. Complaint History Model

Auditability is critical for tracking repair tickets. Rather than storing only a status string on the complaint itself, the system uses a double-write transaction log pattern.
* Every status transition (`OPEN` -> `IN_PROGRESS` -> `RESOLVED`) creates a new record in the `ComplaintHistory` table.
* The history record stores the new status, the ID of the actor (resident or supervisor) making the change, an optional text note explaining the change, and the timestamp.
* The database schema enforces a relationship where deleting a complaint cascades and cleans up its history logs.
* In the frontend, the history list is rendered as a chronological vertical timeline of progress.

---

## 3. Dynamic Overdue Detection

Rather than running heavy cron-jobs that mutate a boolean flag in the database (which can easily become out of sync or stale), NESTFIX computes the overdue state dynamically:
* The system retrieves the overdue threshold from the `SystemSetting` key-value table (defaults to `3` days if not set).
* Overdue definition: `status !== 'RESOLVED' && createdAt < (now - overdueThreshold)`.
* In API routes, filters map this query to single SQL requests using relative datetimes.
* The response appends a virtual `isOverdue` boolean to the JSON object.
* The client sorts `isOverdue = true` tickets at the very top of lists, displaying a red blinking "Overdue" indicator.

---

## 4. Ephemeral File Upload Handling

Deploying Express onto servers like Render means local file systems are ephemeral (erased on restarts). Storing files locally will cause images to disappear.
* **Stream Upload**: Backend endpoints use `multer` with in-memory storage (`multer.memoryStorage()`) to buffer photo files into RAM.
* **Cloud Storage**: The buffered buffer stream is uploaded directly to Cloudinary via `cloudinary.uploader.upload_stream`.
* **Database Mapping**: Cloudinary returns a secure web URL, which is saved in the PostgreSQL `Complaint.photoUrl` column. No binary files touch the local server disk.
* **Graceful Fallbacks**: If Cloudinary environment variables are missing, the server falls back to high-quality placeholder URLs and logs a warning, enabling offline development.

---

## 5. Background Notification Flow

When a supervisor updates a complaint's status or publishes an important notice, emails are triggered.
* **Abstraction**: The notification logic is abstracted under `server/src/services/notificationService.js`.
* **Transactional Mail**: The handler sends HTML emails containing custom templates (NESTFIX colors, links to view notice boards/timelines). In production, it sends HTTP requests to the Resend API.
* **Async Fail-safe**: Email transmissions are executed in separate promise scopes. If the email API throws a network failure or authentication issue, it is caught and logged, but it *does not abort* the primary database transaction. The user's status change or notice posting is successfully recorded regardless.

---

## 6. Authentication and Authorization

* **Passwords**: Hashed securely using `bcryptjs` before write operations.
* **Session JWTs**: Generated on successful logins and registrations. Signed using a HS256 secret key.
* **Route Protection**: The backend verifies tokens from the `Authorization` header. Decoded payload appends user scopes onto `req.user`.
* **RBAC**: Middleware checks `req.user.role === 'ADMIN'` to restrict supervisor control endpoints. The client layout hides supervisor links and routes residents to `/dashboard` if they attempt to load `/admin`.

---

## 7. Deployment Architecture

* **Frontend (Vercel)**: Configured as a Single Page Application (SPA) utilizing Vite builds and assets.
* **Backend (Render)**: Set up with standard environment files and CORS whitelists.
* **Database (PostgreSQL)**: Connected via connection pooling URLs.
