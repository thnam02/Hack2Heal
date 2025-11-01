# Hack2Heal Frontend

React + TypeScript frontend application for Hack2Heal.

## Features

- ✅ React 18 with TypeScript
- ✅ Vite for fast development and building
- ✅ React Router for navigation
- ✅ Axios for API calls with interceptors
- ✅ Authentication (Login/Register) integrated with backend
- ✅ Protected routes
- ✅ Token management with automatic refresh

## Getting Started

### Installation

```bash
npm install
```

### Environment Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the `.env` file with your backend API URL:
```
VITE_API_BASE_URL=http://localhost:3000/v1
```

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3001`

### Build

Build for production:

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable components
├── contexts/         # React contexts (AuthContext)
├── pages/           # Page components (Login, Register, Dashboard)
├── services/        # API services (api.ts, auth.service.ts)
├── config/          # Configuration constants
├── App.tsx          # Main app component with routing
├── main.tsx         # Entry point
└── index.css        # Global styles
```

## Backend Integration

The frontend is configured to work with the backend API at:
- Base URL: `http://localhost:3000/v1`
- Authentication endpoints:
  - POST `/auth/login`
  - POST `/auth/register`
  - POST `/auth/logout`
  - POST `/auth/refresh-tokens`

## Features Implemented

- User registration with validation
- User login
- Protected routes
- Automatic token refresh
- Logout functionality
- User dashboard

