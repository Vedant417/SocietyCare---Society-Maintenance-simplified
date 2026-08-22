# 🏢 SocietyCare — Society Maintenance Management Platform

> **Society maintenance, without the chaos.**

**SocietyCare** is a full-stack residential society management platform built to simplify maintenance complaint tracking, resident communication, society operations, and administrative monitoring.

Residents can raise and track maintenance complaints with photos, view complaint history, receive notifications, check society service status, access emergency contacts, and stay updated through the notice board. Supervisors can manage complaints, priorities, overdue issues, residents, notices, notifications, weather information, and the real-time **Society Pulse** from a centralized dashboard.

---

## ✨ Highlights

- 📝 **Complaint Management** — Residents can create, view, edit, and delete their complaints.
- 📸 **Complaint Photo Attachments** — Optional image uploads for maintenance issues.
- 🕒 **Complaint History Timeline** — Every status update is recorded with timestamp, actor, and note.
- 🚦 **Priority & Status Workflow** — Low, Medium, High priorities with Open, In Progress, and Resolved statuses.
- ⏰ **Overdue Monitoring** — Complaints can be flagged when they remain unresolved beyond the configured threshold.
- 📢 **Notice Board** — Supervisors can publish notices and pin important announcements.
- 🔔 **Real-Time Notifications** — Users receive persisted and live notifications for important activity.
- 👥 **Resident Directory** — Supervisors can view and manage resident information.
- 🏠 **Family Member Management** — Residents can register household members from their profile.
- ❤️ **Society Pulse** — Live service health for Maintenance, Water Supply, Power, and Common Areas.
- 🌦️ **Weather Dashboard** — Location-based weather information on resident and supervisor dashboards.
- 🚨 **Emergency Contacts** — Quick-access emergency numbers with call/copy support.
- 👤 **Profile & Avatar System** — Preloaded avatars and persistent profile images.
- 📱 **Responsive UI** — Dedicated desktop/sidebar and mobile bottom-navigation experiences.
- 🔐 **Role-Based Authentication** — Separate resident and supervisor experiences.
- ⚡ **Socket.IO Updates** — Real-time notification delivery.

---

## 🛠️ Tech Stack

### Frontend

- **React.js**
- **Vite**
- **React Router DOM**
- **Tailwind CSS v4**
- **React Hook Form + Zod**
- **Axios**
- **Lucide React**
- **Recharts**
- **Socket.IO Client**

### Backend

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **JWT Authentication**
- **bcryptjs**
- **Helmet**
- **CORS**
- **Rate Limiting**
- **Multer** for multipart file uploads
- **Socket.IO** for real-time communication

### Services & Integrations

- **Cloudinary** for image storage when configured
- **Notification service** with development mock email output and production email-provider support
- **Custom Society Pulse API**
- **Weather service** for dashboard weather information

---

## 📁 Project Structure

```text
Society Maintenance Tracker/
│
├── client/                         # React + Vite frontend
│   ├── public/
│   │   ├── avatars/               # Preloaded avatar assets
│   │   ├── favicon.png
│   │   ├── icons.svg
│   │   └── login_illustration.png
│   │
│   ├── src/
│   │   ├── assets/                # Frontend assets
│   │   ├── components/            # Reusable UI components
│   │   │   ├── EmptyState.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── SkeletonLoader.jsx
│   │   │   └── WeatherWidget.jsx
│   │   │
│   │   ├── context/              # Global React state
│   │   │   ├── AuthContext.jsx
│   │   │   ├── NotificationContext.jsx
│   │   │   └── ToastContext.jsx
│   │   │
│   │   ├── hooks/                # Custom React hooks
│   │   │   └── useComplaintPhoto.js
│   │   │
│   │   ├── layouts/              # Shared layouts
│   │   │   ├── AuthLayout.jsx
│   │   │   └── DashboardLayout.jsx
│   │   │
│   │   ├── pages/                # Application screens
│   │   │   ├── AdminComplaintDetail.jsx
│   │   │   ├── AdminComplaints.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminNotices.jsx
│   │   │   ├── AdminResidents.jsx
│   │   │   ├── AdminSettings.jsx
│   │   │   ├── AdminSocietyPulse.jsx
│   │   │   ├── ComplaintDetail.jsx
│   │   │   ├── Emergency.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── NewComplaint.jsx
│   │   │   ├── NewNotice.jsx
│   │   │   ├── NoticeBoard.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── ResidentComplaints.jsx
│   │   │   └── ResidentDashboard.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js             # Axios API client
│   │   │
│   │   ├── validations/
│   │   │   └── schemas.js         # Zod validation schemas
│   │   │
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
├── server/                         # Node.js + Express backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── cloudinary.js
│   │   │   ├── db.js
│   │   │   └── socket.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── complaintController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── familyMemberController.js
│   │   │   ├── noticeController.js
│   │   │   ├── notificationController.js
│   │   │   ├── residentController.js
│   │   │   ├── settingsController.js
│   │   │   ├── societyPulseController.js
│   │   │   └── weatherController.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── upload.js
│   │   │   └── validate.js
│   │   │
│   │   ├── models/
│   │   │   ├── Complaint.js
│   │   │   ├── Counter.js
│   │   │   ├── FamilyMember.js
│   │   │   ├── Notice.js
│   │   │   ├── Notification.js
│   │   │   ├── SocietyPulse.js
│   │   │   ├── SystemSetting.js
│   │   │   └── User.js
│   │   │
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── complaintRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── familyMemberRoutes.js
│   │   │   ├── index.js
│   │   │   ├── noticeRoutes.js
│   │   │   ├── notificationRoutes.js
│   │   │   ├── residentRoutes.js
│   │   │   ├── settingsRoutes.js
│   │   │   ├── societyPulseRoutes.js
│   │   │   └── weatherRoutes.js
│   │   │
│   │   ├── services/
│   │   │   ├── cloudinaryService.js
│   │   │   ├── gridfsService.js
│   │   │   └── notificationService.js
│   │   │
│   │   ├── validators/
│   │   │   └── schemas.js
│   │   │
│   │   ├── app.js
│   │   └── seed.js
│   │
│   ├── package.json
│   └── package-lock.json
│
├── docs/
│   ├── API_DOCS.md
│   └── SYSTEM_DESIGN.md
│
├── scripts/
│   └── dev.js
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

> `client/dist/` is a generated production build and should normally be regenerated with `npm run build` rather than edited manually.

---

## ⚙️ Environment Configuration

Create the required environment variables in a local `.env` file.

**Never commit `.env` files or real credentials to GitHub.**

Example:

```env
# Frontend
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Backend
PORT=5000
MONGODB_URI=mongodb://localhost:27017/societycare
JWT_SECRET=change-this-in-production
CLIENT_URL=http://localhost:5173

# Cloudinary (optional for development)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email / Notifications
EMAIL_SERVICE_PROVIDER=MOCK
EMAIL_API_KEY=your_email_api_key
EMAIL_FROM=SocietyCare <noreply@example.com>

# Society policies
OVERDUE_DAYS=3
```

Use `.env.example` for safe configuration templates and keep real secrets only in your local or hosting environment.

---

## 💻 Prerequisites

Make sure the following are installed:

- **Node.js 18+**
- **npm**
- **Git**
- **MongoDB** — local instance or MongoDB Atlas

Optional integrations:

- Cloudinary account for production image storage
- Email provider for real email delivery

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/society-maintenance-tracker.git
cd "Society Maintenance Tracker"
```

### 2. Install dependencies

From the root directory:

```bash
npm install
```

Then install frontend and backend dependencies if required by the root scripts:

```bash
cd client
npm install

cd ../server
npm install

cd ..
```

### 3. Configure environment variables

Create your local `.env` file and add your MongoDB connection string, JWT secret, client URL, and optional service credentials.

### 4. Start the application

From the project root:

```bash
npm run dev
```

The development setup runs:

```text
Frontend → http://localhost:5173
Backend  → http://localhost:5000
API      → http://localhost:5000/api
```

If port `5000` is already in use, stop the existing backend process before starting the project again.

---

## 🌱 Database Seeding

The backend includes a seed script for initial development configuration.

Run:

```bash
cd server
node src/seed.js
```

The seed process initializes the database connection, complaint counter, default system settings, and the development supervisor account defined by the seed script.

> Always verify the current `server/src/seed.js` before relying on development credentials because seed data can change as the project evolves.

---

## 🔐 Authentication & Roles

SocietyCare uses **JWT-based authentication**.

### Resident

Residents can:

- Register and log in
- Raise complaints
- Upload complaint photos
- Edit and delete their complaints
- Track complaint status history
- View notices
- View emergency contacts
- Manage their profile and avatars
- Add family members
- View Society Pulse
- View dashboard weather
- Receive notifications

### Supervisor / Admin

Supervisors can:

- View all complaints
- Filter and manage complaints
- Update priority and status
- Add status notes
- Monitor overdue complaints
- Manage notices
- View resident directory
- Manage Society Pulse
- View dashboard statistics
- Receive operational notifications

---

## 🔄 Complaint Lifecycle

```text
Resident creates complaint
        │
        ▼
      OPEN
        │
        ▼
   IN_PROGRESS
        │
        ▼
     RESOLVED
        │
        ▼
      CLOSED
```

Every status update is recorded in the complaint history with relevant timestamps and notes.

Priority levels:

```text
LOW → MEDIUM → HIGH
```

The system can also identify complaints that remain unresolved beyond the configured overdue threshold.

---

## 🏠 Society Pulse

The **Society Pulse** gives residents a quick overview of essential society services:

```text
Maintenance     Good / Normal / Warning / Critical
Water Supply    Good / Normal / Warning / Critical
Power           Good / Normal / Warning / Critical
Common Areas    Good / Normal / Warning / Critical
```

The overall society status is calculated from the individual service statuses and is displayed on resident and supervisor dashboards.

Updates are persisted through the backend and refreshed for residents in near real time.

---

## 🔔 Notifications

SocietyCare supports both persisted notifications and real-time delivery through Socket.IO.

Examples include:

- Complaint status changes
- Complaint updates
- New important notices
- Resident feedback / satisfaction updates
- Other society operational events

Unread counts are maintained for the logged-in user and notifications can be marked as read or deleted.

---

## 📸 Image & Photo Handling

Complaint images and profile images are handled through the backend upload layer.

Depending on the configured environment, image storage can use:

- **Cloudinary** for hosted object storage
- **GridFS / MongoDB-backed storage** where configured by the application

The frontend displays uploaded images through the returned image reference or URL.

---

## 🌦️ Weather

The dashboards include a location-based weather widget for residents and supervisors.

Users can select a location and view current weather information such as:

- Temperature
- Conditions
- Rain probability
- Wind
- Humidity
- Hourly trend

Weather data is exposed through the application's backend weather route rather than being hard-coded in the frontend.

---

## 📢 Notice Board

Supervisors can create society notices and optionally mark them as **Important**.

Important notices are visually highlighted and surfaced to residents through the dashboard and notification system.

---

## 🚨 Emergency Contacts

The resident application includes quick access to important emergency numbers, including:

| Service | Number |
|---|---:|
| National Emergency | 112 |
| Police | 100 / 112 |
| Fire Brigade | 101 / 112 |
| Ambulance | 102 / 108 |
| Disaster Management | 108 / 1070 |
| Women Helpline | 1091 / 181 |
| Child Helpline | 1098 |
| Senior Citizen Helpline | 14567 |
| Cyber Crime Helpline | 1930 |
| LPG Leak | 1906 |

The interface supports quick calling and copying of numbers on supported devices.

---

## 📚 API Documentation

Detailed endpoint documentation is maintained in:

```text
/docs/API_DOCS.md
```

The backend API is organized around resources such as:

```text
/api/auth
/api/complaints
/api/dashboard
/api/family-members
/api/notices
/api/notifications
/api/residents
/api/settings
/api/society-pulse
/api/weather
```

Check `server/src/routes/` for the currently implemented route definitions.

---

## 🧩 System Design

The architecture and important design decisions are documented in:

```text
/docs/SYSTEM_DESIGN.md
```

Topics include complaint history, image handling, overdue detection, notifications, and application flow.

---

## 📱 Responsive Design

SocietyCare is designed for:

- 📱 Mobile phones
- 📲 Tablets
- 💻 Laptops
- 🖥️ Desktop PCs

The dashboard layout adapts between:

```text
Desktop → Sidebar navigation
Mobile  → Header + Bottom navigation
```

Dialogs, forms, tables, cards, notifications, calendars, and dashboard widgets are designed to remain usable across screen sizes.

---

## 🧪 Development Notes

For local development, the application can run with mock notification/email behavior and optional Cloudinary integration.

Typical development workflow:

```bash
npm run dev
```

Useful individual commands can also be run from the corresponding `client/` or `server/` directory, depending on the package scripts currently configured in the repository.

---

## 🐛 Troubleshooting

### Port 5000 already in use

Windows PowerShell:

```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

Then restart:

```bash
npm run dev
```

### MongoDB connection error

Check:

- `MONGODB_URI`
- MongoDB Atlas network access / IP allowlist
- Database user credentials
- Internet connection for Atlas

### Images are not displaying

Check:

- `CLOUDINARY_*` variables when Cloudinary is used
- upload route configuration
- returned image URL / storage reference
- frontend API base URL

### Frontend cannot reach backend

Check:

```env
VITE_API_URL=http://localhost:5000/api
```

and ensure the backend is running on port `5000`.

### Blank React page

Open browser developer tools and check the Console for runtime errors. Common causes are missing imports, invalid component hooks, or incorrect environment variables.

---

## 🔒 Security Notes

- Never commit `.env` files.
- Never commit database passwords, JWT secrets, API keys, or Cloudinary credentials.
- Use strong production secrets.
- Configure production CORS origins explicitly.
- Use a production email provider instead of mock email output.
- Restrict MongoDB Atlas network access appropriately.

---

## 🚢 Deployment

The application can be deployed as separate frontend and backend services.

### Frontend

Recommended platforms include:

- Vercel
- Netlify
- Cloudflare Pages

Typical build command:

```bash
npm run build
```

Output:

```text
client/dist
```

### Backend

Possible platforms include:

- Render
- Railway
- Fly.io
- Any Node.js-compatible hosting platform

Configure the production environment variables in the hosting provider instead of committing them to Git.

### MongoDB

Use **MongoDB Atlas** or another managed MongoDB deployment for production.

---

## 📄 License

This project is intended for educational, portfolio, and society-management application development purposes.

---

## 👨‍💻 Author

**Vedant Vyas**

SocietyCare — Full-Stack Residential Society Management Platform
