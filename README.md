# Mini HCM (Human Capital Management System)

A simple full-stack attendance and time tracking system built with:

- React (Frontend)
- Firebase Authentication
- Cloud Firestore (Database)
- Firebase Cloud Functions / Cloud Run (Backend processing)

The system supports employee time-in/time-out tracking, automatic daily summaries, and an admin dashboard for monitoring attendance and metrics.

---

## 🚀 Features

### 👤 Employee Features
- Register and login with email/password
- Punch In / Punch Out system
- View daily attendance record
- View computed work metrics:
  - Regular hours
  - Overtime
  - Night differential
  - Late
  - Undertime
- View attendance history

### 🧑‍💼 Admin Features
- Admin-protected dashboard
- View all employee attendance records
- View employee names and emails (not just IDs)
- Access full attendance history across users

---

## 🧱 Tech Stack

- React (Vite)
- Firebase Authentication
- Firebase Firestore
- Firebase Functions / Cloud Run (attendance processing)
- JavaScript (ES6+)

---

## 📦 Project Structure

client/
src/
components/
context/
pages/
Login.jsx
Register.jsx
Dashboard.jsx
Admin.jsx
firebase.js
App.jsx
main.jsx

---

## ⚙️ Setup Instructions

### 1. Clone the repository
```
git clone https://github.com/your-username/mini-hcm.git
cd mini-hcm
```

### 2. Install dependencies
```
npm install
```

### 3. Configure Firebase
Create a Firebase project and enable:

Authentication (Email/Password)
Firestore Database

Then update your Firebase config in:
```src/firebase.js```

```
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

### 4. Run the project
```
npm run dev
```

## 🔐 Admin Access
To access the admin dashboard:
  1. Create a user in the app
  2. In Firestore, update the user document:
    ```role: "admin"```
  Then visit:
    ```/admin```

## 🧠 Key Design Notes
  - Firebase Auth is used as the single source of authentication
  - Firestore stores both user profiles and attendance data
  - Attendance calculations are handled server-side via backend function
  - Admin access is role-based using Firestore user document

## ⚠️ Known Limitations
  - No pagination on admin tables (yet)
  - No real-time updates (manual refresh required in some views)
  - Basic UI styling (functional over visual design)
  - No mobile optimization

## 📌 Future Improvements
  - Real-time attendance updates
  - Better admin filters (date range, employee search)
  - Export reports (CSV / PDF)
  - Improved UI/UX styling
  - Role-based route protection middleware
  - Audit logs for admin edits

## Author's Notes
Built as a learning project for full-stack development using React + Firebase.
