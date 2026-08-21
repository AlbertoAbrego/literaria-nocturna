# Literaria Nocturna — Backend

REST API for managing a book club. Built with Express, TypeScript, and MongoDB.

## Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- **MongoDB** — local instance or [Atlas](https://www.mongodb.com/atlas) cluster

## Installation

```bash
cd backend
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Port the server listens on |
| `MONGODB_URI` | Yes | — | MongoDB connection string |

### Local MongoDB

```
MONGODB_URI=mongodb://localhost:27017/literaria-nocturna
```

### MongoDB Atlas

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
```

## Running

### Development

```bash
npm run dev
```

Starts the server with hot-reload on `http://localhost:3000`.

### Production

```bash
npm run build
npm start
```

### Seed Books

Populates the database with sample books. Safe to run multiple times — duplicates are skipped.

```bash
npm run seed:books
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/books` | Create a book |
| `GET` | `/api/books` | List books (filters + pagination) |
| `GET` | `/api/books/:id` | Get book by ID |
| `PATCH` | `/api/books/:id` | Update a book |
| `DELETE` | `/api/books/:id` | Delete a book |
| `GET` | `/api/docs` | Swagger UI |

### Query Parameters

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `title` | string | — | Case-insensitive partial match |
| `author` | string | — | Case-insensitive partial match |
| `genre` | enum | — | Exact match (Fantasy, Horror, Science Fiction, Thriller, Romance) |
| `page` | number | `1` | Page number (≥ 1) |
| `limit` | number | `10` | Items per page (1–100) |

## Testing

```bash
npm test              # watch mode
npm run test:run      # single run
npm run test:ci       # CI mode (coverage + maxWorkers=2)
npm run test:coverage # coverage report
```

Tests use Jest with an in-memory MongoDB — no external services required.

## Linting & Formatting

```bash
npm run lint
npm run format
```

## Tech Stack

- Express 5
- TypeScript (strict mode)
- Mongoose 9
- Jest 29 + Supertest
- ESLint + Prettier
