# NESTFIX API Documentation

All API requests and responses utilize standard JSON schemas. Endpoint paths are prefixed with `/api`.

---

## 1. Authentication

### Register Resident Account
* **Endpoint**: `POST /api/auth/register`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "phone": "9876543210",
    "apartmentNumber": "101",
    "password": "Password@123",
    "confirmPassword": "Password@123"
  }
  ```
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Account created successfully!",
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "id": "u-uuid-string",
        "name": "Rahul Sharma",
        "email": "rahul@example.com",
        "phone": "9876543210",
        "apartmentNumber": "101",
        "role": "RESIDENT",
        "profilePhotoUrl": null
      }
    }
  }
  ```

### Login
* **Endpoint**: `POST /api/auth/login`
* **Access**: Public
* **Request Body**:
  ```json
  {
    "email": "rahul@example.com",
    "password": "Password@123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Logged in successfully!",
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "id": "u-uuid-string",
        "name": "Rahul Sharma",
        "email": "rahul@example.com",
        "phone": "9876543210",
        "apartmentNumber": "101",
        "role": "RESIDENT",
        "profilePhotoUrl": null
      }
    }
  }
  ```

### Get Profile Details
* **Endpoint**: `GET /api/auth/me`
* **Access**: Authenticated
* **Headers**: `Authorization: Bearer <token>`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "u-uuid-string",
        "name": "Rahul Sharma",
        "email": "rahul@example.com",
        "phone": "9876543210",
        "apartmentNumber": "101",
        "role": "RESIDENT",
        "profilePhotoUrl": null
      }
    }
  }
  ```

### Update Profile & Avatar
* **Endpoint**: `PATCH /api/auth/profile`
* **Access**: Authenticated
* **Content-Type**: `multipart/form-data`
* **Request Fields**:
  - `name`: string (Required)
  - `email`: string (Required)
  - `phone`: string (Required)
  - `photo`: file binary (Optional profile photo attachment)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Profile updated successfully!",
    "data": {
      "user": {
        "id": "u-uuid-string",
        "name": "Rahul Sharma",
        "email": "rahul-new@example.com",
        "phone": "9876543222",
        "apartmentNumber": "101",
        "role": "RESIDENT",
        "profilePhotoUrl": "https://res.cloudinary.com/..."
      }
    }
  }
  ```

---

## 2. Complaints

### Submit Complaint
* **Endpoint**: `POST /api/complaints`
* **Access**: Authenticated (Resident only)
* **Content-Type**: `multipart/form-data`
* **Request Fields**:
  - `category`: string (Required - Plumbing, Electrical, Cleaning, Security, Lift / Elevator, Parking, Water, Maintenance, Other)
  - `description`: string (Required - minimum 10 chars)
  - `priority`: string (Optional - LOW, MEDIUM, HIGH. Defaults to MEDIUM)
  - `photo`: file binary (Optional image attachment)
* **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Complaint raised successfully!",
    "data": {
      "id": "c-uuid-string",
      "complaintNumber": 1024,
      "residentId": "u-uuid-string",
      "category": "Plumbing",
      "description": "Leakage in the kitchen sink pipe.",
      "photoUrl": "https://res.cloudinary.com/...",
      "status": "OPEN",
      "priority": "HIGH",
      "createdAt": "2026-08-19T10:42:00.000Z",
      "updatedAt": "2026-08-19T10:42:00.000Z",
      "resolvedAt": null
    }
  }
  ```

### List Complaints
* **Endpoint**: `GET /api/complaints`
* **Access**: Authenticated (Residents see their own complaints; Supervisors see all)
* **Query Parameters (Filters)**:
  - `category`: string
  - `status`: string (OPEN, IN_PROGRESS, RESOLVED)
  - `priority`: string (LOW, MEDIUM, HIGH)
  - `overdue`: boolean (true/false)
  - `search`: string (Lookup ticket number, resident name, or apartment)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "c-uuid-string",
        "complaintNumber": 1024,
        "category": "Plumbing",
        "description": "Leakage in the kitchen sink pipe.",
        "photoUrl": "https://res.cloudinary.com/...",
        "status": "OPEN",
        "priority": "HIGH",
        "createdAt": "2026-08-19T10:42:00.000Z",
        "updatedAt": "2026-08-19T10:42:00.000Z",
        "resolvedAt": null,
        "isOverdue": false,
        "resident": {
          "name": "Rahul Sharma",
          "email": "rahul@example.com",
          "phone": "9876543210",
          "apartmentNumber": "101"
        }
      }
    ]
  }
  ```

### Get Complaint Details (Timeline & History)
* **Endpoint**: `GET /api/complaints/:id`
* **Access**: Authenticated (Residents can only view own)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "c-uuid-string",
      "complaintNumber": 1024,
      "category": "Plumbing",
      "description": "Leakage in the kitchen sink.",
      "photoUrl": "https://res.cloudinary.com/...",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "createdAt": "2026-08-19T10:42:00.000Z",
      "updatedAt": "2026-08-19T11:00:00.000Z",
      "resolvedAt": null,
      "isOverdue": false,
      "resident": {
        "name": "Rahul Sharma",
        "apartmentNumber": "101"
      },
      "history": [
        {
          "id": "h-uuid-1",
          "status": "OPEN",
          "note": "Complaint raised by resident.",
          "createdAt": "2026-08-19T10:42:00.000Z",
          "actor": {
            "name": "Rahul Sharma",
            "role": "RESIDENT"
          }
        },
        {
          "id": "h-uuid-2",
          "status": "IN_PROGRESS",
          "note": "Plumber assigned. Visit scheduled for tomorrow.",
          "createdAt": "2026-08-19T11:00:00.000Z",
          "actor": {
            "name": "Supervisor User",
            "role": "ADMIN"
          }
        }
      ]
    }
  }
  ```

### Update Ticket Status & Add History Log Note
* **Endpoint**: `PATCH /api/complaints/:id/status`
* **Access**: Supervisor only
* **Request Body**:
  ```json
  {
    "status": "IN_PROGRESS",
    "note": "Technician has been notified and scheduled."
  }
  ```

### Update Ticket Priority
* **Endpoint**: `PATCH /api/complaints/:id/priority`
* **Access**: Supervisor only
* **Request Body**:
  ```json
  {
    "priority": "HIGH"
  }
  ```

---

## 3. Notices

### Get Notice Board
* **Endpoint**: `GET /api/notices`
* **Access**: Authenticated

### Post Notice
* **Endpoint**: `POST /api/notices`
* **Access**: Supervisor only
* **Request Body**:
  ```json
  {
    "title": "Water Outage Warning",
    "content": "Water tanks are scheduled for cleaning tomorrow from 10 AM to 2 PM.",
    "isImportant": true
  }
  ```

---

## 4. Supervisor Dashboards

### Get Analytics Data
* **Endpoint**: `GET /api/admin/dashboard`
* **Access**: Supervisor only
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "kpis": {
        "total": 5,
        "open": 2,
        "inProgress": 2,
        "resolved": 1,
        "overdue": 2
      },
      "charts": {
        "status": [
          { "name": "Open", "value": 2, "color": "#6366f1" },
          { "name": "In Progress", "value": 2, "color": "#f59e0b" },
          { "name": "Resolved", "value": 1, "color": "#10b981" }
        ],
        "category": [
          { "category": "Plumbing", "count": 2 },
          { "category": "Electrical", "count": 1 }
        ],
        "trend": [
          { "date": "Aug 13", "Complaints": 0 },
          { "date": "Aug 19", "Complaints": 5 }
        ]
      },
      "needsAttention": []
    }
  }
  ```
