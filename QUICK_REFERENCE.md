# School Management System - Quick Reference Guide

## 🚀 Getting Started (5 Minutes)

### Terminal 1 - Backend
```bash
cd backend
npm install
docker-compose up -d
npm run start:dev
```
✅ Backend runs at: `http://localhost:3000/api/v1`

### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
```
✅ Frontend runs at: `http://localhost:3001`

---

## 📁 Project Paths Quick Reference

```
SMS/
├── backend/                    # NestJS Backend
│   ├── src/main.ts            # Entry point
│   ├── src/app.module.ts       # Root module
│   ├── src/modules/           # Feature modules
│   ├── docker-compose.yml      # DB & Redis
│   ├── .env.example            # Config template
│   └── package.json
│
├── frontend/                   # React Frontend
│   ├── src/main.tsx            # Entry point
│   ├── src/App.tsx             # Routes
│   ├── src/hooks/useAuth.ts    # Auth hook
│   ├── src/services/api.ts     # API client
│   ├── vite.config.ts          # Build config
│   ├── .env.example            # Config template
│   └── package.json
│
├── README.md                   # Project overview
├── ARCHITECTURE.md             # System design
└── SETUP_SUMMARY.md           # Setup guide
```

---

## 🔑 Key Commands

### Backend Commands
```bash
npm run start:dev      # Start with watch mode
npm run start:prod     # Production server
npm run build          # Build TypeScript
npm run lint           # Check code style
npm run test           # Run tests
npm run db:migrate     # Run migrations
npm run db:generate    # Create migration
npm run db:revert      # Rollback migration
```

### Frontend Commands
```bash
npm run dev            # Start dev server
npm run build          # Build for production
npm run preview        # Preview build
npm run lint           # Check code style
npm run lint:fix       # Auto-fix issues
npm run type-check     # Check TypeScript
npm run format         # Format code
```

### Docker Commands
```bash
docker-compose up -d      # Start services
docker-compose down       # Stop services
docker-compose logs -f    # View logs
docker ps                 # List running containers
```

---

## 📍 Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3001 | - |
| Backend API | http://localhost:3000/api/v1 | - |
| Health Check | http://localhost:3000/api/v1/health | - |
| PostgreSQL | localhost:5432 | sms_user / sms_password |
| Redis | localhost:6379 | - |
| PgAdmin | http://localhost:5050 | admin@sms.local / admin |
| Redis Commander | http://localhost:8081 | - |

---

## 🔐 Authentication Flow

### Login (Sample)
```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "user@school.com",
  "password": "password123"
}

Response:
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@school.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "teacher"
    }
  }
}
```

### Register (Sample)
```bash
POST http://localhost:3000/api/v1/auth/register
Content-Type: application/json

{
  "email": "newuser@school.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "teacher"
}
```

### Using Token
```bash
GET http://localhost:3000/api/v1/students
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 📦 Frontend Structure Quick Map

```
src/
├── pages/              Routes -> Components shown at full page
├── components/         Reusable UI pieces
├── hooks/             Custom React logic (useAuth, useApi)
├── services/          api.ts talks to backend
├── stores/            Zustand stores (authStore)
├── types/             TypeScript interfaces
└── utils/             Helper functions
```

### Component Example
```typescript
// pages/students/StudentList.tsx
import { useAuth } from '@hooks/useAuth'
import apiService from '@services/api'

export const StudentList = () => {
  const { user } = useAuth()  // Get logged-in user
  const [students, setStudents] = useState([])

  useEffect(() => {
    // Fetch students from API
    apiService.get('/students').then(setStudents)
  }, [])

  return (
    <div>
      <h1>Students</h1>
      {students.map(s => <div key={s.id}>{s.firstName}</div>)}
    </div>
  )
}
```

---

## 🔌 Backend Module Structure Quick Map

```
modules/auth/
├── auth.controller.ts    # HTTP endpoints
├── auth.service.ts       # Business logic
├── auth.module.ts        # Module definition
├── entities/user.entity.ts
├── dtos/auth.dto.ts
└── strategies/jwt.strategy.ts

modules/students/
├── students.controller.ts
├── students.service.ts
├── students.module.ts
├── entities/student.entity.ts
└── dtos/create-student.dto.ts
```

### Create a Module (6 Steps)
1. Create folder: `src/modules/newmodule/`
2. Create `newmodule.module.ts`
3. Create `newmodule.controller.ts`
4. Create `newmodule.service.ts`
5. Create entity: `entities/newmodule.entity.ts`
6. Import in `app.module.ts`

---

## 🗄️ Database Quick Reference

### Core Tables
```sql
-- Users with roles
SELECT * FROM users WHERE role = 'teacher';

-- Students
SELECT * FROM students WHERE classLevel = 'SS2';

-- Attendance
SELECT * FROM attendance WHERE "isPresent" = true;

-- Fees & Transactions
SELECT * FROM fees WHERE status = 'pending';
SELECT * FROM transactions WHERE paymentGateway = 'paystack';
```

### Add a New Table
1. Create entity in `src/database/entities/`
2. Add TypeORM decorators
3. Generate migration: `npm run db:generate`
4. Run migration: `npm run db:migrate`

---

## 🔒 Role-Based Access Examples

```typescript
// Only admins can access
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Delete('/students/:id')
deleteStudent(@Param('id') id: string) { ... }

// Admins and principals
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'principal')
@Get('/students')
getStudents() { ... }

// Anyone logged in
@UseGuards(JwtAuthGuard)
@Get('/profile')
getProfile(@CurrentUser() user) { ... }
```

### Roles Reference
- `admin` - Full system access
- `principal` - School management
- `teacher` - Class management
- `student` - Own records only
- `parent` - Child's records only
- `staff` - HR/Finance access

---

## 🚨 Troubleshooting Quick Fixes

### Backend won't start
```bash
# Check if port 3000 is free
lsof -i :3000

# Kill existing process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Database connection error
```bash
# Check Docker containers
docker-compose ps

# Start Docker services
docker-compose up -d

# Check logs
docker-compose logs postgres
```

### Frontend won't load
```bash
# Clear browser cache
Ctrl+Shift+Delete  # Chrome

# Check console for errors
F12  # Open DevTools

# Verify API URL in .env
VITE_API_BASE_URL=http://localhost:3000/api
```

### CORS errors
```bash
# Ensure backend has correct CORS origin
CORS_ORIGIN=http://localhost:3001

# Restart backend
npm run start:dev
```

---

## 📊 API Response Format

### Success Response
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { /* actual data */ },
  "timestamp": "2024-01-01T12:00:00Z",
  "path": "/api/v1/students",
  "method": "GET"
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Invalid email format",
  "error": "Bad Request",
  "timestamp": "2024-01-01T12:00:00Z",
  "path": "/api/v1/auth/register",
  "method": "POST"
}
```

---

## 🔄 Common Workflows

### Add New API Endpoint

**Backend:**
```typescript
// 1. In controller
@Get('/students/by-class/:classId')
getByClass(@Param('classId') classId: string) {
  return this.studentService.findByClass(classId)
}

// 2. In service
findByClass(classId: string) {
  return this.studentRepo.find({ where: { classId } })
}
```

**Frontend:**
```typescript
// 1. Call from hook/component
const [students, setStudents] = useState([])

useEffect(() => {
  apiService.get(`/students/by-class/${classId}`)
    .then(setStudents)
    .catch(error => console.error(error))
}, [classId])
```

### Add New Page

1. Create file: `frontend/src/pages/newpage/NewPage.tsx`
2. Add route in `src/App.tsx`
3. Create components as needed
4. Use hooks for API calls
5. Style with Tailwind classes

### Add Job Queue

1. Define queue in module
2. Create processor in `src/queue/processors/`
3. Add job in service
4. Processor handles async work

---

## 📱 Path Aliases Reference

```typescript
// Instead of: import from '../../../services/api'
// Use:
import api from '@services/api'
import { useAuth } from '@hooks/useAuth'
import { LoginPage } from '@pages/auth/LoginPage'
import { User } from '@types/user'
import { AuthStore } from '@stores/authStore'
```

**Available aliases:**
```
Frontend:
@      = src/
@components = src/components
@pages = src/pages
@hooks = src/hooks
@services = src/services
@stores = src/stores
@utils = src/utils
@types = src/types
@assets = src/assets

Backend:
@modules = src/modules
@config = src/config
@database = src/database
@guards = src/guards
@filters = src/filters
@decorators = src/decorators
@common = src/common
@queue = src/queue
@services = src/services
@utils = src/utils
```

---

## 🎯 Development Checklist

- [ ] Both npm installs complete
- [ ] Docker containers running
- [ ] Backend starts without errors
- [ ] Frontend loads without errors
- [ ] Can see health check: `http://localhost:3000/api/v1/health`
- [ ] Can access PgAdmin: `http://localhost:5050`
- [ ] Can see Redis Commander: `http://localhost:8081`
- [ ] Login page loads
- [ ] Can view project structure

---

## 💾 Essential Files to Remember

| File | Purpose | Edit When |
|------|---------|-----------|
| `.env` | Configuration | Setting up services |
| `tsconfig.json` | TS settings | Adding path aliases |
| `package.json` | Dependencies | Adding packages |
| `app.module.ts` | Register modules | Adding features |
| `vite.config.ts` | Build config | Changing paths |
| `docker-compose.yml` | Services | Changing DB/Redis |

---

## 🤖 Next Feature Template

When building new features, follow this template:

**Backend:**
```typescript
// 1. Entity (database model)
// 2. DTO (input validation)
// 3. Service (business logic)
// 4. Controller (HTTP endpoints)
// 5. Module (wiring it together)
// 6. Migration (schema changes)
```

**Frontend:**
```typescript
// 1. Type definitions
// 2. Service methods (api calls)
// 3. Custom hook (data + logic)
// 4. Components (UI)
// 5. Pages (route-level)
// 6. Styling (Tailwind classes)
```

---

**Keep this guide handy! Happy building! 🎓**

For more details, see: README.md, ARCHITECTURE.md, SETUP_SUMMARY.md
