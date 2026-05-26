# Team Task Manager

A full-stack collaborative task management app. Think of it as a lightweight Trello — users can create projects, invite team members, assign tasks, and track progress across a kanban board.

Built as a coding assignment to demonstrate full-stack skills: auth, RBAC, REST APIs, and React.

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js + Express.js |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT + bcryptjs |
| Frontend | React 18 + Vite |
| Styling | Plain CSS (no UI frameworks) |
| Deployment | Railway |

## Features

- User signup / login with JWT authentication
- Create projects (creator becomes Admin automatically)
- Admin can add and remove project members
- Create tasks with title, description, due date, priority, and assignee
- Kanban board with To Do / In Progress / Done columns
- Role-based access: admins manage everything, members update only their own task status
- Dashboard with task stats, overdue task list, and tasks-per-user breakdown
- Docker + docker-compose for local development

## Local Setup

### With Docker (easiest)

```bash
git clone <repo>
cd team-task-manager
docker-compose up --build
```

Frontend will be at http://localhost:5173  
Backend API at http://localhost:5000

### Without Docker

**Backend:**
```bash
cd backend
cp .env.example .env
# fill in DATABASE_URL and JWT_SECRET in .env
npm install
npx prisma migrate dev --name init
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/taskmanager` |
| `JWT_SECRET` | Secret for signing JWTs | `somesecretstring` |
| `PORT` | Port to run backend on | `5000` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (e.g. `https://your-backend.railway.app/api`) |

## Deployment (Railway)

Live URL: *(add your Railway frontend URL here after deploying)*

Follow the `DEPLOYMENT_GUIDE.md` for step-by-step Railway deployment instructions.

## API Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | Login, returns JWT | No |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/projects` | List user's projects | Yes |
| POST | `/api/projects` | Create project | Yes |
| GET | `/api/projects/:id` | Get project details + tasks | Yes |
| POST | `/api/projects/:id/members` | Add member by email | Yes (admin) |
| DELETE | `/api/projects/:id/members/:memberId` | Remove member | Yes (admin) |
| POST | `/api/tasks/project/:projectId` | Create task | Yes (admin) |
| PUT | `/api/tasks/:taskId` | Update task | Yes |
| DELETE | `/api/tasks/:taskId` | Delete task | Yes (admin) |
| GET | `/api/dashboard` | Get dashboard stats | Yes |
