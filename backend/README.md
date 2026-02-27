# School Management System - Backend API

A scalable, enterprise-grade School Management System backend built with NestJS, TypeScript, PostgreSQL, and Redis.

## 📁 Project Structure

```
backend/
├── src/
│   ├── modules/              # Feature modules
│   │   ├── auth/            # Authentication & Authorization
│   │   ├── students/        # Student management
│   │   ├── staff/           # Staff/HR management
│   │   ├── academics/       # Academics & Grading
│   │   ├── finance/         # Financial management
│   │   ├── library/         # Library management
│   │   ├── dormitory/       # Dormitory management
│   │   ├── communication/   # SMS, Email, Notifications
│   │   └── reporting/       # Analytics & Reports
│   ├── config/              # Configuration files
│   ├── database/            # Database migrations & connections
│   ├── middleware/          # Custom middleware
│   ├── guards/              # Auth guards (JWT, RBAC)
│   ├── filters/             # Exception filters
│   ├── interceptors/        # Request/Response interceptors
│   ├── decorators/          # Custom decorators
│   ├── services/            # Shared services
│   ├── queue/               # BullMQ job queues
│   ├── common/              # Shared DTOs, interfaces, types
│   ├── utils/               # Utility functions
│   ├── main.ts              # Application entry point
│   └── app.module.ts        # Root module
├── test/                    # Test files
├── package.json             # Dependencies
├── tsconfig.json           # TypeScript configuration
├── docker-compose.yml       # Docker services
├── Dockerfile              # Docker image
└── .env.example            # Environment variables template
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- npm or yarn

### Installation

1. **Clone and navigate to backend:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Docker services (PostgreSQL & Redis):**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

6. **Start development server:**
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3000/api/v1`

## 🔑 Key Features

### Authentication & Authorization
- JWT-based authentication
- Role-Based Access Control (RBAC)
- Supported roles: Admin, Principal, Teacher, Student, Parent, Staff
- Refresh token strategy

### Core Modules
- **Auth Module**: User registration, login, JWT token management
- **Students Module**: Student enrollment, profiles, records
- **Staff Module**: Employee records, HR management, payroll
- **Academics Module**: Grading, timetable, attendance, curriculum
- **Finance Module**: Billing, invoicing, payment tracking, accounting
- **Library Module**: Book cataloging, circulation, inventory
- **Dormitory Module**: Room allocation, visitor management, check-in/out
- **Communication Module**: SMS alerts, email notifications, in-app messaging
- **Reporting Module**: Analytics, custom reports, dashboards

### Queue & Notifications
- Built-in job queues with BullMQ + Redis
- Async processing for emails, SMS, notifications
- Configurable processors for different job types

## 📝 Available Scripts

```bash
npm run build        # Build for production
npm run start        # Start production server
npm run start:dev    # Start dev server with watch
npm run start:debug  # Start with debugging
npm run lint         # Run ESLint
npm run test         # Run unit tests
npm run test:cov     # Generate coverage report
npm run db:migrate   # Run migrations
npm run db:generate  # Generate new migration
npm run db:revert    # Revert last migration
```

## 🗄️ Database

PostgreSQL is the primary database with the following main entities:
- `users` - User accounts with roles
- `students` - Student records
- `staff_members` - Staff information
- `classes` - Class/level information
- `subjects` - Subject information
- `grades` - Student grades
- `fees` - Billing and fees
- `transactions` - Payment transactions

## 🔒 Security

- JWT tokens with configurable expiration
- Password hashing with bcrypt
- CORS configuration
- Request validation with class-validator
- SQL injection prevention (TypeORM)
- Rate limiting support (ready to integrate)

## 🚢 Docker Deployment

### Build image:
```bash
docker build -t sms-backend:latest .
```

### Run with docker-compose:
```bash
docker-compose up
```

Services:
- **Backend**: Port 3000
- **PostgreSQL**: Port 5432
- **Redis**: Port 6379
- **PgAdmin**: Port 5050 (optional)
- **Redis Commander**: Port 8081 (optional)

## 🔗 API Documentation

### Authentication Endpoints
```
POST /api/v1/auth/register  - Register new user
POST /api/v1/auth/login     - Login user
```

### Health Check
```
GET /api/v1/health          - API health status
```

## 🛠️ Development Tips

### Module Structure
Each module follows this pattern:
```
module/
├── controllers/     # Request handlers
├── services/       # Business logic
├── entities/       # TypeORM entities
├── dtos/           # Data transfer objects
└── module.ts       # Module definition
```

### Adding a New Module
1. Create folder in `src/modules/newmodule`
2. Create `newmodule.module.ts` with Module decorator
3. Create controller, service, entities as needed
4. Import in `app.module.ts`

### Environment Variables
Copy `.env.example` to `.env` and configure:
- Database credentials
- JWT secrets
- Payment gateway keys
- SMS provider tokens
- Email configuration

## 📊 Testing

Run tests with:
```bash
npm run test                # Run all tests
npm run test:watch         # Watch mode
npm run test:cov           # Generate coverage
npm run test:e2e           # End-to-end tests
```

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/feature-name`
4. Submit pull request

## 📞 Support

For issues or questions:
1. Check existing GitHub issues
2. Create detailed issue with reproduction steps
3. Include environment details and logs

## 📄 License

MIT License - See LICENSE file for details

## 🎓 Nigeria-Specific Features

- ✅ Paystack & Flutterwave integration for payments
- ✅ Termii/Twilio integration for SMS notifications
- ✅ WAEC/JAMB portal compatibility
- ✅ Nigerian naira (₦) currency support
- ✅ Support for multiple Nigerian languages (Yoruba, Igbo, etc.)
- ✅ Compliance with FIRS tax requirements
- ✅ Multi-school tenancy support

---

**Built with ❤️ for Nigerian Schools**
