# Environment Configuration

## Overview

Literaria Nocturna uses separate configuration and data environments for development, staging, and automated testing.

The current environment strategy is:

- **Development** — local application development.
- **Staging** — remote environment used for integration and manual validation.
- **Test** — isolated environment used by automated tests.
- **Production** — planned for a future stage of the project.

Environment-specific configuration is kept outside the application code whenever possible.

---

## Environment Architecture

```text
                         MongoDB Atlas
                              │
                    ┌─────────┴─────────┐
                    │                   │
          literaria-nocturna-dev       staging
                    │                   │
              Development             Staging
                    │                   │
              Local backend          Render
                    │                   │
              Local frontend          Vercel
```

Automated tests are isolated from these persistent databases:

```text
Automated Tests
       │
       ▼
MongoDB Memory Server
```

---

## Development Environment

The Development environment runs locally on the developer's machine.

### Frontend

The frontend runs using Vite.

The local frontend uses:

```env
VITE_API_URL=/api
```

Vite's development proxy forwards `/api` requests to the local backend.

The local frontend therefore follows this flow:

```text
Browser
   │
   ▼
Vite
   │
   │ /api
   ▼
Local Backend
```

### Backend

The backend runs locally using Node.js and TypeScript.

Development-specific configuration is stored in:

```text
backend/.env
```

The local backend currently defines:

```text
PORT
MONGODB_URI
```

Other configuration values use the defaults defined by the application.

The local backend connects to the `literaria-nocturna-dev` database in MongoDB Atlas.

### Database

Development uses the following MongoDB Atlas database:

```text
literaria-nocturna-dev
```

This database is intended for local development and experimentation.

Development data must not be considered production data.

---

## Staging Environment

The Staging environment is deployed remotely and is used for integration, manual testing, and validation before production.

### Hosting

The current staging infrastructure is:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

The `staging` Git branch is used as the deployment source for the staging environment.

### Frontend

The staging frontend uses `VITE_API_URL` configured through the Vercel environment variables.

Unlike local development, staging does not use the Vite development proxy.

The staging request flow is:

```text
Browser
   │
   ▼
Vercel
   │
   │ API requests
   ▼
Render Backend
   │
   ▼
MongoDB Atlas
```

### Backend

The staging backend receives its runtime configuration from Render environment variables.

The following variables are currently configured in Render:

```text
CORS_ORIGIN
MONGODB_URI
PORT
RATE_LIMIT_WINDOW_MS
RATE_LIMIT_MAX
REQUEST_BODY_LIMIT
```

The staging backend does not depend on the developer's local `.env` file.

### Database

Staging uses the following MongoDB Atlas database:

```text
staging
```

The staging database is separate from the Development database.

The Development and Staging environments currently use the same MongoDB Atlas cluster, while maintaining separate databases.

```text
MongoDB Atlas Cluster
├── literaria-nocturna-dev
└── staging
```

This approach keeps the project within the current free infrastructure constraints while providing database-level environment separation.

---

## Test Environment

Automated backend integration tests use MongoDB Memory Server.

Tests do not use the persistent Development or Staging databases.

Each test environment uses an isolated MongoDB instance that can be created and reset independently.

```text
Automated Tests
      │
      ▼
MongoDB Memory Server
```

This prevents automated tests from modifying persistent development or staging data.

---

## Environment Variables

### Backend Variables

| Variable               | Development         | Staging | Description                                           |
| ---------------------- | ------------------- | ------- | ----------------------------------------------------- |
| `PORT`                 | Local `.env`        | Render  | Port used by the backend                              |
| `MONGODB_URI`          | Local `.env`        | Render  | MongoDB connection string                             |
| `CORS_ORIGIN`          | Application default | Render  | Allowed CORS origin(s)                                |
| `RATE_LIMIT_WINDOW_MS` | Application default | Render  | Rate limiting time window                             |
| `RATE_LIMIT_MAX`       | Application default | Render  | Maximum requests allowed within the rate limit window |
| `REQUEST_BODY_LIMIT`   | Application default | Render  | Maximum accepted request body size                    |

The available backend variables and their example values are documented in:

```text
backend/.env.example
```

### Frontend Variables

| Variable       | Development | Staging                     | Description                                                   |
| -------------- | ----------- | --------------------------- | ------------------------------------------------------------- |
| `VITE_API_URL` | `/api`      | Vercel environment variable | Base URL used by the frontend to communicate with the backend |

The available frontend variables are documented in:

```text
frontend/.env.example
```

---

## Secrets and Sensitive Configuration

Secrets must never be committed to the repository.

This includes:

- MongoDB credentials.
- MongoDB connection strings containing credentials.
- API keys.
- Authentication secrets.
- Other sensitive runtime configuration.

Local secrets are stored in `.env` files, which must remain excluded from version control.

Staging secrets and runtime configuration are stored directly in the hosting provider's environment variable configuration.

Example environment files such as `.env.example` must contain only safe example values and must not contain real credentials.

---

## Environment Separation

The following separation rules apply:

### Development

```text
Local Frontend
      │
      ▼
Local Backend
      │
      ▼
literaria-nocturna-dev
```

### Staging

```text
Vercel Frontend
      │
      ▼
Render Backend
      │
      ▼
staging
```

### Test

```text
Test Suite
    │
    ▼
MongoDB Memory Server
```

Development and Staging use separate MongoDB databases.

Automated tests use an isolated in-memory MongoDB instance.

The local frontend uses `/api` and therefore does not directly point to the staging backend.

The staging frontend uses the remote staging backend URL and does not depend on the local development environment.

---

## CORS Configuration

CORS is configured through the `CORS_ORIGIN` environment variable.

The Staging backend allows requests from the Staging frontend origin.

Unrelated origins must not be allowed.

Development remains functional through its local frontend origin.

CORS configuration should be updated through environment variables rather than hardcoding environment-specific origins in application code.

---

## Runtime Configuration

Environment-specific configuration should be provided through environment variables rather than hardcoded values.

The application may provide default values for non-sensitive configuration options.

Staging explicitly configures its rate limiting and request body limits through Render environment variables.

This makes the runtime configuration explicit and independently configurable from the developer's local environment.

---

## Production

Production is not currently deployed.

When Production is introduced, it should have:

- Its own frontend deployment.
- Its own backend deployment.
- Its own environment variables.
- Its own database.
- Its own secrets.
- Production-specific CORS configuration.
- Appropriate security and operational configuration.

The planned database naming convention is:

```text
literaria-nocturna-dev
literaria-nocturna-staging
literaria-nocturna-prod
```

Production configuration should be introduced without reusing Development or Staging secrets.

---

## Configuration Rules

1. Never commit `.env` files or secrets to Git.
2. Keep `.env.example` files updated when new environment variables are introduced.
3. Do not point the local frontend to the Staging backend unless explicitly required for testing.
4. Do not use the Staging database for automated tests.
5. Do not use the Development database for automated tests.
6. Store Staging runtime configuration in Render and Vercel.
7. Keep environment-specific values outside application source code when practical.
8. Keep CORS restricted to trusted application origins.
9. Do not expose secrets through frontend environment variables.
10. Review environment configuration whenever a new deployment environment is introduced.

---

## Related Documentation

- `backend/.env.example` — Backend environment variable reference.
- `frontend/.env.example` — Frontend environment variable reference.
- `docs/ci-cd.md` — Continuous integration and validation.
- `docs/stories/story-30-staging-configuration-environment-validation.md` — Story scope and acceptance criteria.
