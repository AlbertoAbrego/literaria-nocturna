# Story 29 — Staging Deployment Infrastructure

## Objective

Deploy the Literaria Nocturna application to a remote staging environment so the frontend, backend, and database can be tested together outside the local development environment.

## Target Architecture

```text
                    GitHub
                      │
                 CI / Deploy
                      │
          ┌───────────┴───────────┐
          │                       │
     Frontend                 Backend API
          │                       │
          └───────────┬───────────┘
                      │
                Staging Database
```

## Scope

Establish a functional staging environment containing:

- Frontend application
- Backend API
- MongoDB database
- Environment variables
- HTTPS
- Publicly accessible endpoints
- Frontend → Backend communication

## Tasks

### Provider Selection

Evaluate suitable hosting providers for:

- Frontend
- Backend
- MongoDB
- Custom domain/subdomain support
- Free or low-cost tiers

The selected solution should prioritize simplicity, reliability, and suitability for a portfolio project.

### Frontend

- Deploy the frontend application.
- Configure staging API URL.
- Configure environment variables.
- Verify production build works remotely.

### Backend

- Deploy the backend API.
- Configure staging environment variables.
- Configure database connection.
- Verify API endpoints are publicly accessible.

### Database

- Create an independent staging database.
- Configure secure credentials.
- Populate initial test/seed data.

### Networking

- Configure HTTPS.
- Configure CORS for the staging frontend.
- Verify frontend can communicate with the staging API.

## Testing

### Smoke Tests

- Frontend loads successfully.
- Backend health endpoint responds.
- Frontend can retrieve books.
- Frontend can create a book.
- Frontend can update a book.
- Frontend can delete a book.
- Database persists changes.

## Acceptance Criteria

- Frontend is accessible remotely.
- Backend API is accessible remotely.
- Staging database is independent from local development.
- Frontend communicates successfully with staging backend.
- HTTPS is enabled.
- Secrets are not committed to Git.
- CORS allows only the intended staging frontend.
- Seed data is available.
- Basic CRUD functionality works remotely.

## Out of Scope

- Production deployment.
- Playwright E2E tests.
- Automated deployment pipelines unless already supported by the selected provider.
- Production domain configuration.

## Definition of Done

- Frontend deployed.
- Backend deployed.
- Staging database configured.
- Environment variables configured.
- HTTPS enabled.
- CORS configured.
- Seed data available.
- Frontend/backend communication verified.
- Basic CRUD smoke testing completed.
- Deployment documented.
