# School Management System - Frontend

A modern, responsive React + TypeScript frontend for the School Management System with Tailwind CSS.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Common components (Button, Input, etc.)
│   │   └── layouts/        # Layout components (Header, Sidebar, etc.)
│   ├── pages/              # Page components
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Dashboard pages
│   │   ├── students/       # Student management pages
│   │   ├── staff/          # Staff management pages
│   │   ├── academics/      # Academic pages
│   │   ├── finance/        # Finance pages
│   │   └── reports/        # Reporting pages
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API service layer
│   ├── stores/             # State management (Zustand)
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── assets/             # Images, icons, static files
│   │   ├── images/
│   │   └── icons/
│   ├── styles/             # Global styles & CSS
│   ├── main.tsx            # Application entry point
│   └── App.tsx             # Root component
├── public/                 # Static files
├── index.html             # HTML entry point
├── package.json           # Dependencies
├── tsconfig.json         # TypeScript configuration
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── postcss.config.js     # PostCSS configuration
├── .env.example          # Environment variables template
└── Dockerfile            # Docker image
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API endpoint
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3001`

## 📝 Available Scripts

```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
npm run lint        # Run ESLint
npm run lint:fix    # Fix linting issues
npm run type-check  # Check TypeScript types
npm run format      # Format code with Prettier
```

## 🎨 UI Framework & Styling

- **React 18** - UI library
- **Vite** - Build tool (fast development & optimized builds)
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management

## 🏗️ Key Architecture Patterns

### State Management (Zustand)
```typescript
// stores/authStore.ts
import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
```

### Custom Hooks
```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const { user, setUser } = useAuthStore()
  // Custom auth logic
  return { user, setUser, ... }
}
```

### API Service
```typescript
// services/api.ts
- Centralized API calls
- Automatic JWT token injection
- Error handling & interceptors
- Request/response transformation
```

## 🔐 Authentication

- JWT token stored in localStorage
- Automatic token injection in API headers
- Redirect to login on 401 responses
- User session persistence across page refreshes

## 📱 Responsive Design

Built with Tailwind CSS breakpoints:
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

## 🎯 Component Structure

### Example Page Component
```typescript
import React from 'react'
import { useAuth } from '@hooks/useAuth'

const DashboardPage: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-100">
      <h1>Welcome, {user?.firstName}</h1>
    </div>
  )
}

export default DashboardPage
```

## 🔌 API Integration

### Using the API Service
```typescript
import apiService from '@services/api'

// GET request
const data = await apiService.get('/students')

// POST request
const result = await apiService.post('/students', { name: '...' })

// PUT request
await apiService.put('/students/1', { name: '...' })

// DELETE request
await apiService.delete('/students/1')
```

## 🚢 Docker Deployment

### Build image:
```bash
docker build -t sms-frontend:latest .
```

### Run container:
```bash
docker run -p 3001:3001 sms-frontend:latest
```

## 📊 Project Features

### Implemented
- ✅ Login page with form validation
- ✅ Dashboard with KPI cards
- ✅ Responsive layout with Tailwind CSS
- ✅ Authentication hook (useAuth)
- ✅ API service with interceptors
- ✅ Zustand state management
- ✅ TypeScript type safety

### To Be Implemented
- Student management pages
- Staff management pages
- Academic/grading pages
- Financial management pages
- Reporting & analytics pages
- Mobile responsiveness optimization
- Advanced filtering & search
- Data tables with pagination
- Form components (validation, error handling)

## 🛠️ Development Tips

### Path Aliases
Use these aliases in imports:
```typescript
import { useAuth } from '@hooks/useAuth'
import { api } from '@services/api'
import { LoginPage } from '@pages/auth/LoginPage'
```

### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_VERSION=v1
VITE_APP_NAME=School Management System
```

### Styling Approach
- Use Tailwind utility classes for styling
- Create reusable components in `components/`
- Keep components simple and focused
- Use CSS modules for complex styling only

## 🧪 Testing

Ready for integration with testing frameworks:
- Jest for unit tests
- React Testing Library for component tests
- Cypress/Playwright for E2E tests

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and test locally
3. Format code: `npm run format`
4. Commit: `git commit -am 'Add feature'`
5. Push: `git push origin feature/feature-name`
6. Create pull request

## 📞 Support

For issues:
1. Check console for error messages
2. Verify API connection (check API base URL)
3. Check network tab in DevTools
4. Create GitHub issue with details

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for Nigerian Schools**
