# Literaria Nocturna — Frontend

React + TypeScript application for the Literaria Nocturna book club.

## Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10
- **Backend** running on `http://localhost:3000` (see [backend README](../backend/README.md))

## Installation

```bash
cd frontend
npm install
```

## Environment Variables

The frontend works out-of-the-box with the default configuration. To customize:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api` | Base URL of the backend API |

### How the API URL Works

The default value `/api` is a **relative path**. In development, Vite's dev server proxies all `/api/*` requests to `http://localhost:3000`:

```
Browser → http://localhost:5173/api/books
       → Vite proxy → http://localhost:3000/api/books
```

For production, set the full backend URL:

```
VITE_API_URL=https://api.example.com/api
```

## Running

### Development

```bash
npm run dev
```

Starts the Vite dev server on `http://localhost:5173` with HMR.

The dev server automatically proxies `/api` requests to the backend at `http://localhost:3000`.

### Build

```bash
npm run build
```

Output goes to `dist/`. Serve with any static file server.

### Preview

```bash
npm run preview
```

Serves the production build locally for testing.

## Testing

```bash
npm run test          # watch mode
npm run test:run      # single run
npm run test:ui       # Vitest UI dashboard
npm run test:coverage # coverage report
```

Tests use Vitest + React Testing Library + MSW (Mock Service Worker). All API calls are mocked — no backend required.

## Linting & Formatting

```bash
npm run lint
npm run format
```

## Tech Stack

- React 19
- TypeScript (strict mode)
- Vite 8
- Tailwind CSS v4
- TanStack Query
- Axios
- React Router 7
- Vitest + React Testing Library + MSW
