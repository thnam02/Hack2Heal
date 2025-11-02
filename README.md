# RehabMax AI+

AI-powered rehabilitation platform with real-time exercise form analysis, gamification, and clinician tools.

## Features

**Patients:**
- Live exercise sessions with real-time form analysis (MediaPipe)
- Quest system with XP, badges, and leaderboards
- 3D avatar visualization (EchoBody Scene)
- Social features (friends, messaging)
- Exercise library with progress tracking
- Mood tracking and progress analytics

**Clinicians:**
- Patient management dashboard
- Predictive analytics (dropout risk, recovery duration)
- Pain transition matrix visualization
- Performance metrics and adherence tracking

## Tech Stack

**Frontend:** React 18 + TypeScript, Vite, Three.js, MediaPipe, Socket.io
**Backend:** Node.js + Express, SQLite, Socket.io, JWT
**AI:** Python + MediaPipe (pose estimation), Scikit-learn (predictions)

## Quick Start

### Prerequisites
- Node.js >= 18
- npm

### Installation

```bash
# Backend
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Environment Variables

**Backend** (`.env`):
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
DATABASE_URL=file:./data.sqlite
```

**Frontend**: Automatically connects to production backend or use `VITE_API_BASE_URL` env var.

## Project Structure

```
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   └── socket/
│   └── Dockerfile
├── frontend/         # React + TypeScript app
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── contexts/
│   └── vite.config.ts
└── ai_engine/        # Python pose analysis
```

## API Endpoints

- `POST /v1/auth/register` - Register
- `POST /v1/auth/login` - Login
- `GET /v1/sessions/start` - Start exercise session (SSE)
- `GET /v1/stats/me` - Get user stats
- `POST /v1/friends/request` - Send friend request
- `POST /v1/messages/send` - Send message

Full API documentation available in `/backend/src/routes/v1/`

## Deployment

**Backend (Render/Docker):**
```bash
cd backend
docker build -t rehabmax-backend .
# Or deploy to Render with npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Deploy build/ folder to hosting service
```

Frontend automatically connects to `https://hack2heal-1.onrender.com/v1` in production.

## Development

```bash
# Backend
cd backend && npm run dev

# Frontend  
cd frontend && npm run dev
```

Backend: `http://localhost:3000`
Frontend: `http://localhost:3001`

## License

MIT

