# School Management System — Mobile App

A cross-role, offline-capable Android app built with **Expo (React Native)** and **WatermelonDB**.

---

## 📱 Portals

| Role | Portal | Offline Sync |
|------|--------|-------------|
| Admin | Full school management | ✅ Yes |
| Principal | School overview & management | ✅ Yes |
| Accountant | Fee collection & finance | ✅ Yes |
| Teacher | Classes, attendance, scores | ❌ Online only |
| Student | Results, fees, timetable | ❌ Online only |
| Parent | Child records, fees | ❌ Online only |

All users log in through a **single app**. The portal shown is determined by the role assigned on the web system.

---

## ⚙️ Setup

### 1. Configure the Backend URL
Open [app.json](./app.json) and replace `YOUR_SERVER_IP` with your actual server IP address:

```json
"extra": {
  "apiUrl": "http://192.168.X.X:3000/api/v1"
}
```

> **Important:** Use your server's **local network IP**, not `localhost`, so Android devices on the same WiFi can reach your NestJS backend.

### 2. Install Dependencies
```bash
cd mobile-app
npm install
```

### 3. Run on Android
```bash
npm run android
```
> Requires Android Studio with a running emulator, or a physical Android 8.0+ device with USB debugging enabled.

### 4. Build APK for Distribution
```bash
npx expo build:android
# or using EAS Build (recommended):
npx eas build --platform android
```

---

## 🔄 Offline Sync Architecture

```
Device goes offline
       ↓
Staff enter data (fees, students, attendance)
       ↓
WatermelonDB saves everything locally to SQLite
       ↓
Device reconnects to internet
       ↓
NetworkListener detects connection
       ↓
syncData() runs in background
       ↓
Changes pushed to NestJS /sync/push
       ↓
Server changes pulled from /sync/pull
       ↓
Local DB updated — all in sync
```

**Conflict resolution:** Last-Write-Wins (LWW) based on `updatedAt` timestamp.

---

## 📁 Project Structure

```
mobile-app/
├── src/
│   ├── components/
│   │   └── NetworkListener.tsx    # Online/Offline/Syncing status bar
│   ├── db/
│   │   ├── index.ts               # WatermelonDB instance
│   │   ├── schema.ts              # Local database schema
│   │   ├── sync.ts                # Sync logic (pull + push)
│   │   └── models/
│   │       ├── Student.ts         # Student model
│   │       └── Transaction.ts     # Transaction model
│   ├── navigation/
│   │   └── RootNavigator.tsx      # Role-based routing
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── admin/AdminDashboard.tsx
│   │   ├── accounting/AccountingDashboard.tsx
│   │   ├── teacher/TeacherDashboard.tsx
│   │   ├── student/StudentDashboard.tsx
│   │   ├── parent/ParentDashboard.tsx
│   │   └── principal/PrincipalDashboard.tsx
│   ├── services/
│   │   └── api.ts                 # Centralised API service
│   └── store/
│       └── authStore.ts           # Zustand auth state + AsyncStorage
├── App.tsx                        # Entry point
├── app.json                       # Expo configuration
├── babel.config.js                # Decorator support for WatermelonDB
└── tsconfig.json
```

---

## 🔐 Security Notes
- JWT tokens are stored in **AsyncStorage** and sent in the `Authorization` header on every sync request.
- Sync endpoints on the backend are protected and scoped by `tenantId`.
- Students and Parents **never trigger** the offline database sync — only Admin, Principal, and Accountant roles do.
