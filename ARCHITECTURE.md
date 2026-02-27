# School Management System - Architecture Documentation

## System Overview

The School Management System is a scalable, enterprise-grade application designed specifically for Nigerian schools. It follows a modern client-server architecture with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (React)                         │
│  ├─ Web App (http://localhost:3001)                             │
│  └─ Mobile App (React Native/Flutter - Future)                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │ API Calls (JWT Auth)
┌───────────────────────▼─────────────────────────────────────────┐
│          API GATEWAY & REST ENDPOINTS                           │
│          (NestJS - http://localhost:3000/api/v1)                │
└───────────────────────┬─────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐  ┌────▼────┐  ┌──────▼──────┐
│   Business   │  │Database │  │   Queue &   │
│   Logic      │  │  Layer  │  │  Caching    │
│  (Services)  │  │         │  │             │
└──────────────┘  └─────────┘  └─────────────┘
        │               │             │
        │         ┌─────▼─────┐       │
        └────────▶│PostgreSQL │◀──────┘
                  │(TypeORM)  │
                  └───────────┘
                  
                  ┌─────────────┐
                  │Redis + Bull │
                  │(Queue/Cache)│
                  └─────────────┘
```

## 1. Frontend Architecture (React + TypeScript)

### 1.1 Folder Structure

```
frontend/src/
├── pages/              # Full page components (route-level)
│   ├── auth/          # Login, Register, Password Reset
│   ├── dashboard/     # Admin, Principal, Teacher dashboards
│   ├── students/      # Student list, detail, form
│   ├── staff/         # Staff management
│   ├── academics/     # Classes, subjects, grades, timetable
│   ├── finance/       # Fees, payments, reports
│   └── reports/       # Analytics, custom reports
│
├── components/        # Reusable UI components
│   ├── common/        # Button, Input, Modal, Card, etc.
│   ├── layouts/       # Sidebar, Header, Footer
│   └── forms/         # Form components (future)
│
├── hooks/             # Custom React hooks
│   ├── useAuth        # Auth management
│   ├── useApi         # API calls helper
│   └── useLocalStorage# Persistence
│
├── services/          # API integration layer
│   ├── api.ts        # Axios instance with interceptors
│   ├── auth.service  # Auth API calls
│   ├── students.service
│   └── ...
│
├── stores/            # Zustand state management
│   ├── authStore     # Auth state (user, token)
│   ├── uiStore       # UI state (modals, notifications)
│   └── ...
│
├── types/             # TypeScript interfaces
│   ├── auth.ts       # Auth-related types
│   ├── user.ts       # User types
│   ├── student.ts    # Student types
│   └── ...
│
├── utils/             # Helper functions
│   ├── validators.ts  # Form validation
│   ├── formatters.ts  # Date, currency formatting
│   └── helpers.ts     # Utility functions
│
└── assets/            # Static files
    ├── images/
    └── icons/
```

### 1.2 Data Flow

```
User Action → Component → Hook (useAuth) → API Service → Backend API
                                             ↓
                                        Zustand Store
                                             ↓
                                        Re-render
```

### 1.3 Key Patterns

**Custom Hook Example:**
```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const { user, token, setUser, setToken } = useAuthStore()
  
  const login = async (email: string, password: string) => {
    const data = await apiService.post('/auth/login', { email, password })
    setToken(data.access_token)
    setUser(data.user)
  }
  
  return { user, token, login, logout }
}
```

**Component Usage:**
```typescript
// pages/auth/LoginPage.tsx
const LoginPage = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const handleSubmit = async () => {
    await login(email, password)
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

## 2. Backend Architecture (NestJS)

### 2.1 Folder Structure

```
backend/src/
├── modules/           # Feature modules (domain-driven)
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.module.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── dtos/
│   │   │   └── auth.dto.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   └── decorators/
│   │       └── current-user.decorator.ts
│   │
│   ├── students/
│   │   ├── student.controller.ts
│   │   ├── student.service.ts
│   │   ├── student.module.ts
│   │   ├── entities/
│   │   │   └── student.entity.ts
│   │   └── dtos/
│   │       └── create-student.dto.ts
│   │
│   ├── academics/
│   ├── finance/
│   ├── staff/
│   ├── library/
│   ├── dormitory/
│   ├── communication/
│   └── reporting/
│
├── config/            # App configuration
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── redis.config.ts
│
├── database/          # Database layer
│   ├── entities/      # All TypeORM entities
│   └── migrations/    # Schema migrations
│
├── middleware/        # Express middleware
│   ├── logger.middleware.ts
│   └── tenant.middleware.ts
│
├── guards/            # Auth guards
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
│
├── filters/           # Exception filters
│   └── http-exception.filter.ts
│
├── interceptors/      # Request/response interceptors
│   └── transform.interceptor.ts
│
├── decorators/        # Custom decorators
│   ├── roles.decorator.ts
│   └── current-user.decorator.ts
│
├── common/            # Shared code
│   ├── dtos/         # Shared DTOs
│   ├── interfaces/   # Shared interfaces
│   └── constants/    # Constants
│
├── services/          # Shared services
│   ├── payment.service.ts (Paystack, Flutterwave)
│   ├── notification.service.ts (SMS, Email)
│   └── file.service.ts (File uploads)
│
├── queue/             # BullMQ job processors
│   └── processors/
│       ├── email.processor.ts
│       ├── sms.processor.ts
│       └── notification.processor.ts
│
├── utils/             # Utility functions
│   ├── validators.ts
│   ├── formatters.ts
│   └── helpers.ts
│
├── main.ts            # Application entry point
└── app.module.ts      # Root module
```

### 2.2 Module Structure (Each Module)

Every feature module follows this pattern:

```
module/
├── module.ts          # Module definition
├── controller.ts      # HTTP endpoints
├── service.ts         # Business logic
├── dtos/             # Data transfer objects
│   ├── create-*.dto.ts
│   └── update-*.dto.ts
├── entities/         # TypeORM entities
│   └── *.entity.ts
├── interfaces/       # Module-specific interfaces
└── strategies/       # Auth strategies (if needed)
```

### 2.3 Request/Response Flow

```
HTTP Request
    ↓
Controller (validates + transforms)
    ↓
Service (business logic)
    ↓
Repository (database access)
    ↓
Database
    ↓
Service (process response)
    ↓
Interceptor (transform response)
    ↓
HTTP Response
```

### 2.4 Authentication Flow

```
1. User submits credentials (email, password)
2. POST /auth/login
3. AuthController receives request
4. AuthService:
   a. Find user by email
   b. Compare password with bcrypt hash
   c. Generate JWT token
   d. Return token + user data
5. Frontend stores token in localStorage
6. Subsequent requests include: "Authorization: Bearer <token>"
7. JwtAuthGuard validates token
8. RolesGuard checks user role
```

## 3. Database Design (PostgreSQL + TypeORM)

### 3.1 Entity Relationship Diagram

```
users (main)
├── (1) ----- (N) students
├── (1) ----- (N) staff_members
├── (1) ----- (N) parents
└── (1) ----- (N) audit_logs

classes
├── (1) ----- (N) students
├── (1) ----- (N) class_subjects
└── (1) ----- (N) timetables

subjects
├── (N) ----- (M) classes (through class_subjects)
├── (1) ----- (N) class_subjects
└── (1) ----- (N) grades

students
├── (1) ---- (1) users
├── (1) ---- (N) grades
├── (1) ---- (N) attendance
└── (1) ---- (N) fees

staff_members
├── (1) ---- (1) users
├── (N) ---- (M) subjects (teaches)
└── (1) ---- (N) classes (form teacher)

fees
├── (1) ---- (N) fee_items
├── (1) ---- (N) transactions
└── (1) ---- (1) students

transactions
├── (1) ---- (1) students
└── metadata (payment gateway response)
```

### 3.2 Core Entities

```typescript
// users
id (UUID), email, password, firstName, lastName, role, tenantId, createdAt, updatedAt

// students
id (UUID), registrationNumber, userId (FK), classId (FK), dateOfBirth, gender, tenantId

// staff_members
id (UUID), staffId, userId (FK), department, position, salary, tenantId

// classes
id (UUID), name, classLevel, academicYear, formTeacherId (FK), tenantId

// subjects
id (UUID), name, code, description, tenantId

// grades
id (UUID), studentId (FK), subjectId (FK), classId (FK), score, grade, academicYear

// attendance
id (UUID), studentId (FK), classId (FK), date, isPresent, tenantId

// fees
id (UUID), studentId (FK), amount, dueDate, paidDate, paymentMethod, tenantId

// transactions
id (UUID), fee ID (FK), paymentRef, amount, paymentGateway (paystack/flutterwave), status
```

## 4. Authentication & Authorization

### 4.1 JWT Structure

```
Header:
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload:
{
  "sub": "user-id",
  "email": "user@school.com",
  "role": "teacher",
  "tenantId": "tenant-id",
  "iat": 1234567890,
  "exp": 1234571490
}

Signature:
HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

### 4.2 Role-Based Access Control (RBAC)

```
Roles:
1. admin      - Full system access
2. principal  - School management
3. teacher    - Class & student management
4. student    - Own records only
5. parent     - Child's records only
6. staff      - HR/Finance access

Permissions per route:
GET /students     - [admin, principal, teacher]
POST /students    - [admin, principal]
GET /students/:id - [admin, principal, teacher, student (self), parent (child)]
DELETE /students  - [admin, principal]
```

### 4.3 Authentication Guards

```typescript
// Guards in sequence
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'principal')
@Get('/students')
getStudents() { ... }

// Flow
1. JwtAuthGuard - Validates JWT token
2. RolesGuard   - Checks user role against @Roles decorator
3. Endpoint      - Executes if both guards pass
```

## 5. API Design

### 5.1 RESTful Endpoints

```
Resource: Students

GET    /api/v1/students             - List all students
POST   /api/v1/students             - Create student
GET    /api/v1/students/:id         - Get student detail
PUT    /api/v1/students/:id         - Update student
DELETE /api/v1/students/:id         - Delete student
GET    /api/v1/students/:id/grades  - Get student grades

Query Parameters:
/api/v1/students?page=1&limit=10&classId=uuid&search=name

Response Format (Success):
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... },
  "timestamp": "2024-01-01T12:00:00.000Z"
}

Response Format (Error):
{
  "statusCode": 400,
  "message": "Invalid email",
  "error": "Bad Request",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 5.2 Request/Response Validation

```typescript
// DTO with validation
export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsEmail()
  classLevel: string;

  @IsDate()
  dateOfBirth: Date;
}

// Automatic validation in controller
@Post()
create(@Body() createStudentDto: CreateStudentDto) {
  // DTO is validated before reaching service
}
```

## 6. Async Job Processing (BullMQ + Redis)

### 6.1 Job Queue Architecture

```
Application
    ↓
BullMQ (Job Queue)
    ↓
Redis (Queue Broker)
    ↓
Job Processor
    ↓
    ├─ Email Service
    ├─ SMS Service
    └─ Notification Service
```

### 6.2 Job Types

```typescript
// Email Queue
emailQueue.add('send-verification', { email, token })
emailQueue.add('send-result', { studentId, grade })
emailQueue.add('send-payment-receipt', { transactionId })

// SMS Queue
smsQueue.add('attendance-alert', { studentId, absent: true })
smsQueue.add('grade-notification', { studentId, classId })
smsQueue.add('fee-reminder', { studentId, dueDate })

// Notification Queue
notificationQueue.add('general-broadcast', { title, message })
notificationQueue.add('user-specific', { userId, message })
```

### 6.3 Processor Example

```typescript
// processors/email.processor.ts
@Processor('email')
export class EmailProcessor {
  @Process('send-verification')
  async sendVerification(job: Job) {
    const { email, token } = job.data
    // Send email logic
    return { success: true }
  }

  @OnFailed()
  onFailed(job: Job, err: Error) {
    // Retry logic
  }
}
```

## 7. Security Best Practices

### 7.1 Implemented

- ✅ JWT token validation on protected routes
- ✅ Password hashing with bcrypt (salt rounds: 10)
- ✅ CORS configuration to allow frontend domain only
- ✅ Input validation with class-validator
- ✅ SQL injection prevention (TypeORM parameterized queries)
- ✅ Environment variables for secrets
- ✅ Role-based access control (RBAC)

### 7.2 To Implement

- 🔜 Rate limiting (prevent brute force)
- 🔜 Request logging/audit trail
- 🔜 Data encryption at rest
- 🔜 HTTPS/TLS enforcement
- 🔜 CSRF protection
- 🔜 XSS prevention
- 🔜 Helmet.js headers
- 🔜 Two-factor authentication (2FA)

## 8. Payment Gateway Integration

### 8.1 Paystack Integration

```
Customer pays fee
    ↓
Frontend initiates Paystack checkout
    ↓
Customer enters card details
    ↓
Paystack processes payment
    ↓
Webhook sent to backend
    ↓
Backend verifies transaction
    ↓
Database updated
    ↓
Email/SMS confirmation sent
```

### 8.2 Payment Flow

```typescript
// Frontend
const initPayment = async () => {
  const response = await apiService.post('/finance/initiate-payment', {
    studentId,
    amount,
    email
  })
  
  // Open Paystack modal with response.authorizationUrl
}

// Backend
@Post('/initiate-payment')
async initiatePayment(@Body() dto: PaymentDto) {
  // Create transaction record
  // Call Paystack API
  // Return authorization URL
}

@Post('/webhook/paystack')
async handlePaystackWebhook(@Body() body: any) {
  // Verify signature
  // Update transaction status
  // Trigger notification queue
}
```

## 9. Deployment Architecture

### 9.1 Development

```
Developer Machine
├── Frontend (npm run dev)
├── Backend (npm run start:dev)
├── PostgreSQL (docker)
└── Redis (docker)
```

### 9.2 Production

```
nginx (Reverse Proxy)
    ├── frontend/dist (static files)
    ├── api.domain.com (backend)
    │       ↓
    │   NestJS App 1
    │   NestJS App 2
    │   (Load balanced)
    │       ↓
    │   PostgreSQL (primary + replica)
    │       ↓
    │   Redis (cluster)
    │
    └── CDN (for static assets)
```

### 9.3 Docker Compose Services

```yaml
services:
  postgres      # Database
  redis         # Cache & Queue
  pgadmin       # DB Management (dev)
  redis-commander  # Queue Management (dev)
```

## 10. Monitoring & Logging

### 10.1 Logging Levels

```
DEBUG   - Detailed diagnostic information
INFO    - General informational messages
WARN    - Warning messages (recoverable issues)
ERROR   - Error messages (failures)
FATAL   - Critical failures (app crash)
```

### 10.2 Log Files

```
logs/
├── app.log        # General application logs
├── error.log      # Error-level logs
├── access.log     # HTTP request logs
└── audit.log      # User actions audit trail
```

## 11. Environment Configuration

### 11.1 Variables

```env
# Server
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=sms_user
DATABASE_PASSWORD=***
DATABASE_NAME=sms_db

# JWT
JWT_SECRET=***
JWT_EXPIRE=24h

# Payment
PAYSTACK_SECRET_KEY=***
FLUTTERWAVE_SECRET_KEY=***

# SMS
TERMII_API_KEY=***

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=***
SMTP_PASSWORD=***
```

## 12. Development Workflow

### 12.1 Feature Development

```
1. Create feature branch: git checkout -b feature/feature-name
2. Backend: Create module → DTOs → Entity → Service → Controller
3. Frontend: Create page → Components → Hook → Service call
4. Test locally
5. Commit: git commit -am 'Add feature'
6. Push: git push origin feature/feature-name
7. Create Pull Request
8. Code Review
9. Merge to develop
10. Deploy to staging
11. Merge to main
12. Deploy to production
```

## 13. Performance Optimization

### 13.1 Database

- ✅ Indexing on frequently queried columns
- ✅ Connection pooling (PgBouncer)
- ✅ Query optimization
- ✅ Pagination for large datasets

### 13.2 Caching

- ✅ Redis for session storage
- ✅ API response caching
- ✅ Database query results caching

### 13.3 Frontend

- ✅ Code splitting
- ✅ Lazy loading components
- ✅ Image optimization
- ✅ Minification & compression

## 14. Testing Strategy

### 14.1 Unit Tests

- Service methods
- Utility functions
- Helper functions

### 14.2 Integration Tests

- API endpoints
- Database operations
- Queue processing

### 14.3 E2E Tests

- User workflows
- Authentication flows
- Payment processing

---

**This architecture is designed to be scalable, maintainable, and optimized for Nigerian school operations.**

For questions or improvements, please refer to the backend and frontend README files.
