# Literaria Nocturna

A digital archive of forbidden literature — a REST API and React frontend for managing a book club with a curated catalog of mysterious and cosmic horror volumes.

![Backend CI](https://github.com/usuario/repositorio/actions/workflows/backend-ci.yml/badge.svg)
![Frontend CI](https://github.com/usuario/repositorio/actions/workflows/frontend-ci.yml/badge.svg)

## Features

- **Book Management** — Full CRUD operations for books with title, author, genre, synopsis, and cover image
- **Search & Filtering** — Case-insensitive partial matching on title/author, exact genre filtering, with URL-synchronized state
- **Pagination** — Configurable page size (1–100) with metadata (total, totalPages, current page)
- **Swagger Documentation** — Interactive API docs at `/api/docs` and raw OpenAPI spec at `/api/docs/swagger.json`
- **Contract-Driven Testing** — MSW handlers synchronized with the backend OpenAPI contract via automated extraction and verification
- **Design System** — Dark academia aesthetic with Tailwind CSS v4 tokens (Cormorant Garamond + Inter typography)

## Architecture

```
literaria-nocturna/
├── backend/                  # Express + TypeScript + MongoDB
│   └── src/
│       ├── routes/           # Route definitions
│       ├── controllers/      # HTTP layer (validation, response)
│       ├── services/         # Business logic
│       ├── models/           # Mongoose schemas
│       ├── dto/              # Data Transfer Objects
│       ├── errors/           # Custom AppError class
│       ├── middleware/       # Global error handler
│       └── test/             # Integration tests (supertest + mongodb-memory-server)
├── frontend/                 # React + TypeScript + Vite
│   └── src/
│       ├── app/              # Providers (QueryClient)
│       ├── pages/            # Route-level components
│       ├── routes/           # React Router config
│       ├── features/         # Feature modules (books/)
│       │   └── books/
│       │       ├── api/      # Axios client + API functions
│       │       ├── components/ # BookTable, BookForm, SearchBar, etc.
│       │       ├── hooks/    # useBooks, useCreateBook, etc.
│       │       ├── types/    # Book, CreateBookInput, etc.
│       │       └── utils/    # searchFilters, etc.
│       ├── shared/           # Shared infrastructure
│       │   ├── api/          # http.ts (Axios instance)
│       │       ├── components/ # ui/, layout/
│       │       ├── hooks/    # useDebounce, etc.
│       │       ├── types/    # ApiError, etc.
│       │       └── utils/    # Common utilities
│       └── test/             # Test infrastructure
│           ├── contract/     # OpenAPI types, validators, MSW contract tests
│           ├── handlers/     # MSW handlers (books, errors)
│           ├── utils/        # renderWithProviders, createTestQueryClient
│           └── examples/     # Reference test implementations
└── docs/                     # Architecture, stories, planning
```

**Data Flow (Frontend):**

```
Component → Feature Hook → Feature API → Axios Client → Backend
```

## Prerequisites

- **Node.js** ≥ 22
- **npm** ≥ 10
- **MongoDB** — local instance or [Atlas](https://www.mongodb.com/atlas) cluster

## Installation

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

## Environment Configuration

### Backend

| Variable      | Required | Default | Description                |
| ------------- | -------- | ------- | -------------------------- |
| `PORT`        | No       | `3000`  | Port the server listens on |
| `MONGODB_URI` | Yes      | —       | MongoDB connection string  |

```bash
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/literaria-nocturna

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
```

### Frontend

| Variable       | Default | Description                 |
| -------------- | ------- | --------------------------- |
| `VITE_API_URL` | `/api`  | Base URL of the backend API |

In development, Vite proxies `/api` requests to `http://localhost:3000`. For production, set the full backend URL (e.g., `https://api.example.com/api`).

## Running

### Start the Backend

```bash
cd backend
npm run dev
```

Server runs on `http://localhost:3000`.

### Seed the Database (optional)

```bash
cd backend
npm run seed:books
```

Populates the database with sample books. Safe to run multiple times — duplicates are skipped.

### Start the Frontend

```bash
cd frontend
npm run dev
```

App runs on `http://localhost:5173`. The frontend proxies API calls to the backend automatically.

## Ports

| Service  | Port   | Description               |
| -------- | ------ | ------------------------- |
| Backend  | `3000` | REST API server           |
| Frontend | `5173` | Vite dev server (default) |

## Commands

### Backend

| Command                 | Description                         |
| ----------------------- | ----------------------------------- |
| `npm run dev`           | Start dev server with hot-reload    |
| `npm run build`         | Compile TypeScript to `dist/`       |
| `npm start`             | Run production build                |
| `npm run seed:books`    | Populate database with sample books |
| `npm test`              | Run tests in watch mode             |
| `npm run test:run`      | Run tests once                      |
| `npm run test:coverage` | Run tests with coverage report      |
| `npm run test:ci`       | CI mode (coverage + maxWorkers=2)   |
| `npm run lint`          | ESLint check                        |
| `npm run format`        | Prettier format                     |

### Frontend

| Command                    | Description                                   |
| -------------------------- | --------------------------------------------- |
| `npm run dev`              | Start Vite dev server with HMR                |
| `npm run build`            | Build for production (`tsc -b && vite build`) |
| `npm run preview`          | Preview production build locally              |
| `npm test`                 | Run Vitest in watch mode                      |
| `npm run test:run`         | Run tests once                                |
| `npm run test:ui`          | Open Vitest UI dashboard                      |
| `npm run test:coverage`    | Run tests with coverage                       |
| `npm run contract:extract` | Generate contract types from OpenAPI spec     |
| `npm run contract:verify`  | Verify MSW handlers match OpenAPI spec        |
| `npm run contract:check`   | Extract + verify contract                     |
| `npm run lint`             | ESLint check                                  |
| `npm run format`           | Prettier format                               |

## Testing

### Backend

Integration tests using Jest, Supertest, and an in-memory MongoDB. Full Route → Controller → Service → Model contract coverage.

```bash
cd backend
npm test                # watch mode
npm run test:run        # single run
npm run test:ci         # CI mode
npm run test:coverage   # coverage report
```

### Frontend

Component, hook, and integration tests using Vitest, React Testing Library, and MSW (Mock Service Worker). Contract-driven MSW handlers synchronized with the backend OpenAPI spec.

```bash
cd frontend
npm run test            # watch mode
npm run test:run        # single run
npm run test:ui         # Vitest UI dashboard
npm run test:coverage   # coverage report
npm run contract:check  # verify MSW ↔ OpenAPI contract
```

Tests use MSW to mock API calls — no backend required. All API interactions are covered by handlers in `src/test/handlers/`.

## CI/CD

Both pipelines use GitHub Actions with Node.js 22, npm caching, and path filtering. See [CI/CD Documentation](docs/ci-cd.md) for full details.

**Backend CI** (`.github/workflows/backend-ci.yml`):

- Triggers on push/PR to `main` (changes in `backend/`)
- Pipeline: checkout → Node.js 22 → install → lint → build → integration tests
- Uses mongodb-memory-server (no external services required)

**Frontend CI** (`.github/workflows/frontend-ci.yml`):

- Triggers on push/PR to `main` (changes in `frontend/`)
- Pipeline: checkout → Node.js 22 → install → lint → contract check → build → tests
- Uses MSW for API mocking (no external services required)

Both pipelines support manual triggering via `workflow_dispatch`.

## API Documentation

- **Swagger UI**: `http://localhost:3000/api/docs`
- **OpenAPI Spec**: `http://localhost:3000/api/docs/swagger.json`

## API Endpoints

| Method   | Endpoint         | Description                       |
| -------- | ---------------- | --------------------------------- |
| `GET`    | `/api/health`    | Health check                      |
| `POST`   | `/api/books`     | Create a book                     |
| `GET`    | `/api/books`     | List books (filters + pagination) |
| `GET`    | `/api/books/:id` | Get book by ID                    |
| `PATCH`  | `/api/books/:id` | Update a book                     |
| `DELETE` | `/api/books/:id` | Delete a book                     |

## Documentation

- [Backend README](backend/README.md) — API endpoints, env vars, testing
- [Frontend README](frontend/README.md) — Architecture, commands, testing
- [Project Context](docs/project-context.md) — Architecture decisions, conventions
- [Frontend Context](docs/frontend-context.md) — Frontend architecture, patterns
- [Design System](docs/design/design-system.md) — Colors, typography, spacing, tokens
- [UI Components](docs/design/ui-components.md) — Component specs and variants
- [Testing Guide](docs/testing.md) — Backend and frontend testing strategy
- [Frontend Testing](docs/frontend-testing.md) — Frontend testing setup and patterns
- [Test Cases](docs/tests.md) — Test case index
- [CI/CD](docs/ci-cd.md) — GitHub Actions pipelines, triggers, troubleshooting
- [Roadmap](docs/roadmap.md) — Project progress and upcoming stories
- [Stories](docs/stories/) — Feature requirements

## Tech Stack

| Layer    | Technology                                                                  |
| -------- | --------------------------------------------------------------------------- |
| Backend  | Express 5, TypeScript, Mongoose 9, Swagger (OpenAPI 3.0)                    |
| Frontend | React 19, Vite 8, Tailwind CSS v4, TanStack Query v5, Axios, React Router 7 |
| Testing  | Jest 30 (backend), Vitest 4 (frontend), MSW 2, React Testing Library        |
| Database | MongoDB                                                                     |
| CI/CD    | GitHub Actions, Node.js 22                                                  |
