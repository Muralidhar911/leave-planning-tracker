# Workspace

## Overview

Leave Planning Tracker — a full-stack team leave management web app.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Frontend**: React + Vite, Tailwind CSS, Framer Motion, shadcn/ui
- **Auth**: Express session (cookie-based)
- **Password hashing**: bcryptjs

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/        # Express API (auth, users, leaves, stats)
│   └── leave-tracker/     # React + Vite frontend
├── lib/
│   ├── api-spec/          # OpenAPI spec + Orval codegen config
│   ├── api-client-react/  # Generated React Query hooks
│   ├── api-zod/           # Generated Zod schemas
│   └── db/                # Drizzle ORM schema + DB connection
└── scripts/               # Utility scripts
```

## Database Schema

### users table
- id (uuid, PK)
- name (text)
- email (text, unique)
- password_hash (text)
- role (text: 'admin' | 'user')
- must_change_password (boolean, default true)
- created_at (timestamptz)

### leaves table
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- start_date (date)
- end_date (date)
- reason (text)
- created_at (timestamptz)

## Default Admin Account

- Email: admin@company.com
- Password: Admin@123
- Role: admin

## API Routes

All routes are under `/api`:

### Auth
- POST /auth/login
- POST /auth/logout
- GET /auth/me
- POST /auth/change-password
- PATCH /auth/update-profile

### Users (admin only)
- GET /users
- POST /users
- DELETE /users/:id

### Leaves
- GET /leaves (own for users, all for admin)
- GET /leaves/all (all team leaves for calendar)
- POST /leaves
- PATCH /leaves/:id
- DELETE /leaves/:id

### Stats
- GET /stats (dashboard metrics)

## User Roles

- **Admin**: Can manage team members, view all leaves, add/remove users
- **User**: Can plan leaves, view team calendar, manage own profile

## Features

- Cinematic dark UI with indigo/purple/cyan gradient theme
- Framer Motion animations on dashboard cards and page transitions
- Team calendar with color-coded leaves per user
- Dashboard stats: Total Members, Leaves Today, Upcoming, Monthly
- Profile page with password change (mustChangePassword flow)
- Session-based auth with cookie persistence

## Running Locally

- Frontend: `pnpm --filter @workspace/leave-tracker run dev`
- API Server: `pnpm --filter @workspace/api-server run dev`
- DB push: `pnpm --filter @workspace/db run push`
- Codegen: `pnpm --filter @workspace/api-spec run codegen`
