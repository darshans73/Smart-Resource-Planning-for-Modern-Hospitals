# 🏥 Hospital Resource Planning & Management System

A full-stack web application for managing hospital resources including beds, operation theaters, medical equipment, and staff.

---

## 🚀 Tech Stack

| Layer    | Technology                       |
| -------- | -------------------------------- |
| Frontend | React.js, React Router v6, Axios |
| Backend  | Node.js, Express.js              |
| Database | MySQL                            |
| Auth     | JWT + bcryptjs                   |

---

## 📁 Project Structure

```
myProject/
├── backend/
│   ├── config/db.js          # MySQL connection pool
│   ├── middleware/auth.js     # JWT auth + role guards
│   ├── routes/
│   │   ├── auth.js           # Login, get current user
│   │   ├── users.js          # User management (admin)
│   │   ├── resources.js      # Resource CRUD
│   │   ├── patients.js       # Patient management
│   │   ├── allocations.js    # Bed allocation
│   │   ├── surgeries.js      # OT scheduling
│   │   └── reports.js        # Analytics & reports
│   ├── server.js             # Express app
│   ├── database.sql          # MySQL schema + seed data
│   └── .env                  # Environment variables
│
└── frontend/
    └── src/
        ├── context/AuthContext.js   # Auth state management
        ├── services/api.js          # Axios API service
        ├── components/Sidebar.js    # Navigation sidebar
        ├── pages/
        │   ├── LoginPage.js         # Login with demo buttons
        │   ├── Dashboard.js         # Real-time overview
        │   ├── ResourcesPage.js     # Resource management
        │   ├── PatientsPage.js      # Patient management
        │   ├── AllocationsPage.js   # Bed allocation
        │   ├── SurgeriesPage.js     # OT scheduling
        │   ├── EquipmentPage.js     # Equipment booking
        │   ├── ReportsPage.js       # Analytics & reports
        │   └── UsersPage.js         # User management
        └── index.css               # Complete design system
```

---

## ⚙️ Setup Instructions

### 1. Database Setup

Open **MySQL Workbench** or your MySQL client and run:

```sql
source /path/to/myProject/backend/database.sql
```

Or copy-paste the contents of `backend/database.sql` into your MySQL client.

### 2. Backend Setup

```bash
cd backend

# Edit .env with your MySQL credentials
# DB_PASSWORD=your_mysql_password

npm install
npm run dev   # Starts on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start     # Starts on http://localhost:3000
```

---

## 🔑 Default Login Credentials

| Role      | Email                  | Password  |
| --------- | ---------------------- | --------- |
| Admin     | admin@hospital.com     | Admin@123 |
| Doctor    | doctor@hospital.com    | Admin@123 |
| Nurse     | nurse@hospital.com     | Admin@123 |
| Reception | reception@hospital.com | Admin@123 |

---

## 🎯 Feature Summary

### ✅ Implemented

- Secure JWT authentication with role-based access
- Resource management (ICU Beds, OT, Ventilators, MRI, Ambulances)
- Patient registration, admission, and discharge
- Bed allocation with double-booking prevention
- OT scheduling with conflict detection (room + doctor)
- Equipment booking and tracking
- Real-time availability dashboard
- Reports: Utilization, Bed Occupancy, Analytics
- Admin-only User Management
- Auto resource release on patient discharge

### 🚦 Color Coding

- 🟢 **Green** = Available
- 🔴 **Red** = In Use / Occupied
- 🟡 **Yellow** = Maintenance

---

## 🔒 Role Permissions

| Feature         |   Admin   |  Doctor   |   Nurse   | Reception |
| --------------- | :-------: | :-------: | :-------: | :-------: |
| Dashboard       |    ✅     |    ✅     |    ✅     |    ✅     |
| Resources       | ✅ (CRUD) | ✅ (view) | ✅ (view) | ✅ (view) |
| Patients        |    ✅     |    ✅     |    ✅     |    ✅     |
| Bed Allocation  |    ✅     |    ❌     |    ❌     |    ✅     |
| OT Scheduling   |    ✅     |    ✅     |    ✅     |    ❌     |
| Equipment       |    ✅     |    ✅     |    ✅     |    ❌     |
| Reports         |    ✅     |    ❌     |    ❌     |    ❌     |
| User Management |    ✅     |    ❌     |    ❌     |    ❌     |
