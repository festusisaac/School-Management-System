# School Management System (SMS)

A complete, scalable School Management System built for Nigerian schools with a modern tech stack: React + TypeScript (frontend), Node.js + NestJS (backend), PostgreSQL (database), and Redis (queue & caching).

## 📚 Project Overview

This is an enterprise-grade school management solution designed to handle:
- Student enrollment & records
- Staff & HR management
- Academic management (grades, attendance, timetable)
- Financial management (billing, payments, accounting)
- Library management
- Dormitory management
- Communication (SMS, Email, Notifications)
- Reporting & Analytics

## 🏗️ Project Structure

```
SMS/
├── backend/                 # NestJS API backend
│   ├── src/
│   │   ├── modules/        # Feature modules
│   │   ├── config/         # Configuration
│   │   ├── database/       # Database & migrations
│   │   ├── common/         # Shared code
│   │   └── ...
│   ├── package.json
│   ├── docker-compose.yml
│   └── README.md
│
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── stores/         # State management
│   │   └── ...
│   ├── package.json
│   └── README.md
│
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ (tested with v24.x)
- **npm** v9+ (tested with v11+)
- **Docker Desktop** (for PostgreSQL, Redis, PgAdmin, Redis Commander)

### Quick Start (Development)

1. **Install Dependencies:**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

2. **Configure Environment:**
   ```bash
   # Backend (defaults provided; review if needed)
   cd backend
   cat .env  # Already configured with DATABASE_SYNC=false
   
   # Frontend
   cd ../frontend
   cat .env  # Already configured with VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```

3. **Start Docker Services (PostgreSQL, Redis, PgAdmin, Redis Commander):**
   ```bash
   cd backend
   docker compose up -d
   ```

   Verify services:
   ```bash
   docker compose ps
   ```

   **Service URLs:**
   - **PgAdmin**: http://localhost:5050 (admin@sms.local / admin)
   - **Redis Commander**: http://localhost:8081

4. **Run Database Migrations:**
   ```bash
   cd backend
   npm run db:migrate
   ```

5. **Start Backend API:**
   ```bash
   cd backend
   npm run start:dev
   ```
   Backend runs on http://localhost:3000 with API prefix `/api/v1`

6. **Start Frontend (in another terminal):**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs on http://localhost:3001

7. **Access Application:**
   - **Frontend**: http://localhost:3001
   - **API**: http://localhost:3000/api/v1
   - **Register/Login Page**: http://localhost:3001/register

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, NestJS, TypeScript |
| **Database** | PostgreSQL 15, TypeORM |
| **Cache/Queue** | Redis, BullMQ |
| **Auth** | JWT, Passport.js, RBAC |
| **Notifications** | BullMQ, Redis (for async processing) |
| **Deployment** | Docker, Docker Compose |

## 📋 Features & Modules

### ✅ Implemented
- User authentication (JWT + RBAC)
- User registration & login
- Basic app structure & scaffolding
- Project folder organization

### 🔄 In Progress
- Student management module
- Staff management module
- Academic management module
- Financial management module
- Notification queue system

### 📝 Planned
- Library management
- Dormitory management
- Advanced reporting
- Mobile app (React Native/Flutter)
- Multi-school support
- AI/ML features

## 🔑 Key Features

### Authentication & Security
- JWT-based authentication
- Role-Based Access Control (RBAC)
- 6 user roles: Admin, Principal, Teacher, Student, Parent, Staff
- Secure password hashing (bcrypt)

### Database Design
- PostgreSQL with TypeORM
- Normalized schema for optimal performance
- Migration system for version control
- Audit logging support

### Scalability
- Microservices-ready architecture
- Queue-based processing with BullMQ
- Redis caching layer
- Multi-tenant support (ready)

### Nigeria-Specific Features
- ✅ Paystack & Flutterwave integration (payment)
- ✅ SMS support via Termii/Twilio/Vonage
- ✅ WAEC/JAMB compliance
- ✅ Nigerian naira currency support
- ✅ Multi-language support (English, Yoruba, Igbo)
- ✅ Tax compliance (FIRS, VAT, PAYE)

## 📦 Dependencies

### Backend
- @nestjs/* - NestJS framework
- typeorm - Database ORM
- passport & jwt - Authentication
- bull - Job queue
- redis - Caching & queue broker
- class-validator - DTO validation
- bcryptjs - Password hashing

### Frontend
- react & react-dom - UI library
- react-router-dom - Routing
- zustand - State management
- axios - HTTP client
- tailwindcss - Styling
- typescript - Type safety

## 🚢 Deployment

### Docker Deployment

1. **Build images:**
   ```bash
   docker build -t sms-backend:latest ./backend
   docker build -t sms-frontend:latest ./frontend
   ```

2. **Run with compose:**
   ```bash
   docker-compose up -d
   ```

3. **Services:**
   - Backend API: http://localhost:3000
   - Frontend: http://localhost:3001
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

## 📊 Database Schema

### Initial Schema (from InitialSchema migration)

**Users Table** - All system users (multi-role)
- `id` (UUID, PK)
- `email` (VARCHAR, UNIQUE)
- `password` (VARCHAR, hashed with bcrypt)
- `firstName`, `lastName` (VARCHAR)
- `role` (ENUM: admin, principal, teacher, student, parent, staff)
- `tenantId` (UUID, nullable — for multi-tenant support)
- `isActive` (BOOLEAN, default: true)
- `createdAt`, `updatedAt` (TIMESTAMP, auto-set)

**Students Table** - Student records
- `id` (UUID, PK)
- `userId` (UUID, FK to users)
- `registrationNumber` (VARCHAR)
- `firstName`, `lastName`, `dateOfBirth`, `gender` (VARCHAR/DATE)
- `classLevel` (VARCHAR)
- `tenantId` (UUID)
- `isActive`, `createdAt`, `updatedAt` (TIMESTAMP)

**Staff Members Table** - Staff/HR information
- `id` (UUID, PK)
- `userId` (UUID, FK to users)
- `staffId` (VARCHAR)
- `department`, `position` (VARCHAR)
- `salary` (NUMERIC)
- `tenantId` (UUID)
- `isActive`, `createdAt`, `updatedAt` (TIMESTAMP)

### Migrations Workflow

**Generate Migration After Schema Changes:**
```bash
cd backend
npm run db:generate        # Auto-detects entity changes & creates migration
npm run db:migrate         # Apply all pending migrations
```

**View Migration History:**
```bash
docker compose exec postgres psql -U sms_user -d sms_db -c "SELECT * FROM migrations;"
```

**Revert Last Migration:**
```bash
cd backend
npm run db:revert
```

## 🔗 API Endpoints (v1)

### Authentication Endpoints
```
POST   /api/v1/auth/register   - Register new user
POST   /api/v1/auth/login      - Login & get JWT token
```

### Example Requests

**Register User:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@sms.local",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  }'
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@sms.local",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "isActive": true,
    "createdAt": "2025-12-12T02:30:00Z",
    "updatedAt": "2025-12-12T02:30:00Z"
  }
}
```

**Login User:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@sms.local",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@sms.local",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student",
    "isActive": true
  }
}
```

### Frontend Login/Register

Visit the application:
- **Register**: http://localhost:3001/register
- **Login**: http://localhost:3001/login

## 🔐 Authentication & Security

- **Strategy**: JWT (JSON Web Tokens)
- **Secret**: `JWT_SECRET` in backend `.env`
- **Expiry**: `JWT_EXPIRE=24h` (configurable in `.env`)
- **RBAC**: 6 roles (admin, principal, teacher, student, parent, staff)
- **Password**: Hashed with bcrypt (salt rounds: 10)

**Protected API Endpoints** (when implemented):
```bash
# Use Authorization header with Bearer token
curl -X GET http://localhost:3000/api/v1/me \
  -H "Authorization: Bearer <access_token>"
```

## 🧪 Testing

Run tests:
```bash
# Backend
cd backend
npm run test
npm run test:cov

# Frontend
cd frontend
npm run test
```

## 🔧 Common Commands

### Backend

```bash
# Install & Build
npm install
npm run build

# Development
npm run start:dev      # Watch mode
npm run start:debug    # Debug mode
npm start              # Production

# Linting
npm run lint

# Database Migrations
npm run db:migrate     # Run pending migrations
npm run db:generate    # Auto-generate migration from entity changes
npm run db:revert      # Revert last migration

# Testing
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

### Frontend

```bash
# Install & Build
npm install
npm run build          # Production build
npm run preview        # Preview production build

# Development
npm run dev            # Start dev server
npm run type-check     # TypeScript check
npm run lint:fix       # Lint & fix
npm run format         # Format with Prettier
```

### Docker & Services

```bash
cd backend

# Start all services
docker compose up -d

# Stop all services
docker compose down

# Reset (remove volumes)
docker compose down -v

# View logs
docker compose logs -f postgres
docker compose logs -f redis

# Access PostgreSQL shell
docker compose exec postgres psql -U sms_user -d sms_db
```

## 📚 Documentation

- [Backend README](./backend/README.md) - Backend setup & documentation
- [Frontend README](./frontend/README.md) - Frontend setup & documentation
- [Architecture Plan](./ARCHITECTURE.md) - System design & architecture
- [API Documentation](./docs/API.md) - API endpoint reference

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## 📝 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow ESLint rules
- Format code with Prettier
- Write meaningful commit messages

### Branching Strategy
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <PID> /F

# Kill process (Mac/Linux)
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Database Connection Error
```bash
# Verify PostgreSQL is running
docker compose ps postgres

# Check logs
docker compose logs postgres

# Restart services
docker compose down && docker compose up -d
```

### Migration Failed
```bash
# Check migration status
npm run db:migrate

# View database migrations table
docker compose exec postgres psql -U sms_user -d sms_db -c "SELECT * FROM migrations;"

# Revert last migration
npm run db:revert

# Reset everything (destructive)
docker compose down -v
docker compose up -d
npm run db:migrate
```

### Frontend Cannot Reach Backend
```bash
# 1. Check backend is running
curl http://localhost:3000/api/v1/auth/login

# 2. Verify VITE_API_BASE_URL in frontend/.env
cat frontend/.env

# 3. Check CORS in backend/.env
grep CORS_ORIGIN backend/.env

# 4. Restart frontend dev server
cd frontend && npm run dev
```

### Port Already in Use
```bash
# Frontend (3001)
netstat -ano | findstr :3001

# PgAdmin (5050)
netstat -ano | findstr :5050

# Kill with: taskkill /PID <PID> /F
```

### Docker Issues
```bash
# Remove all containers and images
docker system prune -a

# Rebuild images
docker compose build --no-cache

# Start fresh
docker compose down -v && docker compose up -d
```

## 📞 Support & Contact

- 📧 Email: support@schoolmanagementsystem.ng
- 💬 Discord: [Community Server]
- 🐛 Issues: GitHub Issues
- 📖 Wiki: GitHub Wiki

## 📄 License

MIT License - See LICENSE file for details

## 🎓 Acknowledgments

- Built for Nigerian schools
- Designed for scalability
- Inspired by modern education tech solutions
- Powered by the Open Source community

---

## 🚀 Next Steps

### Immediate (Priority)
- [ ] **Login Integration** - Test JWT token flow and refresh tokens
- [ ] **Dashboard Page** - Create protected dashboard with user info
- [ ] **Students Module** - Implement CRUD endpoints and UI
- [ ] **Swagger/OpenAPI** - Add @nestjs/swagger for auto-generated API docs
- [ ] **Error Handling** - Standardize error responses and logging

### Short-term
- [ ] Email notifications (SMTP, SendGrid, or similar)
- [ ] SMS notifications (Termii, Twilio, Vonage)
- [ ] File upload (AWS S3, Cloudinary, or similar)
- [ ] Unit and E2E tests
- [ ] Role-based endpoint guards

### Medium-term
- [ ] Multi-tenancy support (isolation per school)
- [ ] Payment gateway integration (Paystack, Flutterwave)
- [ ] Advanced analytics and reporting
- [ ] Bulk import (students, staff, grades)
- [ ] Mobile-friendly UI enhancements

### Long-term
- [ ] Mobile app (React Native or Flutter)
- [ ] AI-powered features (grade prediction, resource optimization)
- [ ] Advanced scheduling (auto-generate timetables)
- [ ] LMS integration (online learning)
- [ ] Deployment guides (AWS, Heroku, DigitalOcean, Vercel)

---

**Made with ❤️ for Nigerian Schools | Scalable | Secure | Modern**

Last Updated: December 11, 2025
