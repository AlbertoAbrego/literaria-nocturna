# Literaria Nocturna

A book club management application with a REST API backend and React frontend.

![Backend CI](https://github.com/usuario/repositorio/actions/workflows/backend-ci.yml/badge.svg)

## Quick Start

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- MongoDB (local or Atlas)

### 1. Clone & Install

```bash
git clone <repo-url>
cd literaria-nocturna

# Backend
cd backend
npm install
cp .env.example .env   # configure MONGODB_URI
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### 2. Start the Backend

```bash
cd backend
npm run dev
```

Server runs on `http://localhost:3000`.

### 3. Seed the Database (optional)

```bash
cd backend
npm run seed:books
```

### 4. Start the Frontend

```bash
cd frontend
npm run dev
```

App runs on `http://localhost:5173`.

### 5. Open

Navigate to `http://localhost:5173`. The frontend proxies API calls to the backend automatically.

## Project Structure

```
literaria-nocturna/
├── backend/          # Express + TypeScript + MongoDB
├── frontend/         # React + TypeScript + Vite
├── docs/             # Architecture, stories, planning
└── README.md
```

## Ports

| Service | Port | Description |
|---------|------|-------------|
| Backend | `3000` | REST API server |
| Frontend | `5173` | Vite dev server (default) |

## Documentation

- [Backend README](backend/README.md) — API endpoints, env vars, testing
- [Frontend README](frontend/README.md) — Dev server, proxy, testing
- [Project Context](docs/project-context.md) — Architecture decisions
- [Frontend Context](docs/frontend-context.md) — Frontend architecture
- [Stories](docs/stories/) — Feature requirements

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Express 5, TypeScript, Mongoose 9 |
| Frontend | React 19, Vite 8, Tailwind CSS v4, TanStack Query |
| Testing | Jest (backend), Vitest + MSW (frontend) |
| Database | MongoDB |
