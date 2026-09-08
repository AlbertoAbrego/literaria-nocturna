# Production Readiness & Deployment Strategy

## Purpose

This document defines the target production architecture and deployment strategy for Literaria Nocturna.

The project currently uses a remote staging environment for validation. Production deployment is intentionally deferred until the MVP, automated testing, and E2E validation are complete.

The initial production deployment will reuse the existing hosting providers without introducing a separate paid production infrastructure.

---

## Environments

The project uses three logical environments:

| Environment | Purpose            | Frontend          | Backend              | Database                  |
| ----------- | ------------------ | ----------------- | -------------------- | ------------------------- |
| Development | Local development  | Local Vite server | Local Node.js server | `literaria-nocturna-dev`  |
| Staging     | Remote validation  | Vercel            | Render               | `staging`                 |
| Production  | Public application | Vercel            | Render               | `literaria-nocturna-prod` |

Development, staging, and production must remain logically isolated through their configuration and database selection.

---

## Target Architecture

The target architecture is:

```text
                              GitHub
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                 staging                     main
                    │                         │
                    ▼                         ▼
                 Vercel                    Vercel
                 Frontend                  Frontend
                    │                         │
                    ▼                         ▼
                 Render                    Render
                 Backend                   Backend
                    │                         │
                    ▼                         ▼
              MongoDB Atlas             MongoDB Atlas
                `staging`           `literaria-nocturna-prod`
```

The same hosting providers may be used for staging and production.

The distinction between environments is established through:

- Git branch
- Environment variables
- Frontend API URL
- Backend CORS configuration
- Database selection

No separate production provider or cluster is required at the current project stage.

---

## Production Database Strategy

Production will use a dedicated MongoDB database:

```text
literaria-nocturna-prod
```

Initially, this database may share the existing MongoDB Atlas cluster with development and staging.

The logical separation is:

```text
MongoDB Atlas
│
├── literaria-nocturna-dev
├── staging
└── literaria-nocturna-prod
```

Production data must never be stored in the staging database.

This approach provides logical isolation without requiring additional infrastructure costs.

If the project eventually requires stronger infrastructure isolation, the production database can later be moved to a dedicated cluster or infrastructure without changing the application architecture.

---

## Environment Variables

### Backend

The backend uses the following configuration:

| Variable               | Development             | Staging          | Production          |
| ---------------------- | ----------------------- | ---------------- | ------------------- |
| `PORT`                 | Local port              | Render port      | Render port         |
| `MONGODB_URI`          | Development database    | Staging database | Production database |
| `CORS_ORIGIN`          | `http://localhost:5173` | Staging frontend | Production frontend |
| `RATE_LIMIT_WINDOW_MS` | Default / local config  | `900000`         | `900000`            |
| `RATE_LIMIT_MAX`       | Default / local config  | `100`            | `100`               |
| `REQUEST_BODY_LIMIT`   | Default / local config  | `1mb`            | `1mb`               |

Production secrets and database credentials must be configured through the hosting provider.

They must never be committed to Git.

### Frontend

The frontend uses:

```env
VITE_API_URL
```

Development currently uses:

```env
VITE_API_URL=/api
```

The Vite development server proxies `/api` requests to the local backend.

Staging and production must use the appropriate deployed backend API URL.

Example:

```env
VITE_API_URL=https://<backend-host>/api
```

The actual production value must be configured through Vercel and must not be committed if it contains environment-specific or sensitive configuration.

---

## CORS Policy

CORS is environment-driven through:

```env
CORS_ORIGIN
```

Expected configuration:

| Environment | Allowed origin          |
| ----------- | ----------------------- |
| Development | `http://localhost:5173` |
| Staging     | Staging frontend URL    |
| Production  | Production frontend URL |

Production must allow requests only from the configured production frontend origin.

Wildcard CORS configuration such as:

```env
CORS_ORIGIN=*
```

must not be used.

Changing environments should require configuration changes only, not application code changes.

---

## Domain Strategy

The initial production deployment will use the domains provided by Vercel and Render.

A custom domain is not required for the initial production release.

Current strategy:

```text
Frontend → Vercel-provided domain
Backend  → Render-provided domain
```

A custom domain may be introduced in the future if the project becomes a real product with users, traffic, or stronger branding requirements.

A custom domain is therefore considered optional future infrastructure rather than a production prerequisite.

---

## Deployment Process

The project uses the following branch flow:

```text
feature/story-X
       │
       ▼
   Pull Request
       │
       ▼
   CI validation
       │
       ▼
    staging
       │
       ▼
Remote staging validation
       │
       ▼
   Pull Request
       │
       ▼
      main
       │
       ▼
Production deployment
```

### Staging

The `staging` branch is used as the remote validation environment.

Changes merged into `staging` are deployed to:

- Vercel frontend
- Render backend
- MongoDB Atlas staging database

Manual validation is performed against this environment before promoting changes to `main`.

### Production

Once the MVP and required validation are complete:

- `main` becomes the stable/public branch.
- Vercel deploys the frontend from `main`.
- Render deploys the backend from `main`.
- The backend connects to `literaria-nocturna-prod`.
- Production environment variables are configured independently from staging.

No additional deployment pipeline is required at this stage.

---

## Staging to Production Transition

The staging environment must not simply be renamed or reused with its existing database.

Instead, the infrastructure providers may remain the same while production uses independent configuration:

```text
Staging
staging branch
    ↓
Vercel
    ↓
Render
    ↓
Atlas / staging
```

Production:

```text
main branch
    ↓
Vercel
    ↓
Render
    ↓
Atlas / literaria-nocturna-prod
```

Before switching the hosted services to `main`, production configuration must be created and verified.

The production database must exist independently from staging before production traffic is enabled.

---

## Rollback Strategy

The initial rollback strategy is Git-based.

### Application rollback

If a production deployment introduces a defect:

1. Identify the problematic commit.
2. Revert the change through Git.
3. Open a Pull Request containing the rollback.
4. Allow CI to validate the rollback.
5. Merge the rollback into `main`.
6. Allow Vercel and Render to deploy the corrected version.

The project does not currently require:

- Blue/green deployments
- Canary releases
- Multiple production replicas
- Complex deployment orchestration

These strategies may be considered if the application grows significantly.

### Database rollback

Database rollback is intentionally conservative.

Destructive database changes must not be automatically reverted.

If future features require schema or data migrations, those changes must be planned separately and include an appropriate backup and recovery strategy.

---

## Security and Configuration Rules

The following rules apply to all environments:

- Production secrets must never be committed to Git.
- MongoDB credentials must be stored only in environment configuration.
- Staging and production must use different databases.
- Production must not depend on the developer's local `.env`.
- The production frontend must not depend on localhost URLs.
- Production CORS must not use wildcard origins.
- Error responses must not expose secrets, stack traces, or internal implementation details.
- Rate limiting must remain enabled in production.
- Request body limits must remain configured in production.
- HTTPS must be used for public production traffic.

---

## Current vs Target State

### Current state

```text
Development
    ↓
Local frontend + local backend
    ↓
Atlas / literaria-nocturna-dev


Staging
    ↓
staging branch
    ↓
Vercel + Render
    ↓
Atlas / staging


Production
    ↓
Not yet active
```

### Target state

```text
Development
    ↓
Local development
    ↓
Atlas / literaria-nocturna-dev


Staging
    ↓
staging branch
    ↓
Vercel + Render
    ↓
Atlas / staging


Production
    ↓
main branch
    ↓
Vercel + Render
    ↓
Atlas / literaria-nocturna-prod
```

---

## Infrastructure Cost Strategy

The initial production architecture intentionally avoids unnecessary infrastructure costs.

The project will reuse:

- Vercel
- Render
- MongoDB Atlas

A separate production cluster, paid hosting plan, custom domain, or additional deployment infrastructure is not required for the initial release.

Additional infrastructure should only be introduced when justified by actual project requirements such as:

- Real users
- Increased traffic
- Availability requirements
- Performance requirements
- Security requirements
- Operational requirements

---

## Out of Scope

The following are intentionally outside the scope of the initial production readiness work:

- Actual production deployment
- Custom domain purchase
- Production traffic
- Paid infrastructure
- Advanced deployment strategies
- Blue/green deployment
- Canary releases
- Production autoscaling
- Complex database migration infrastructure
- Personal portfolio website

These may be addressed by future stories if the project requirements justify them.

---

## Production Readiness Checklist

Before activating production:

### Architecture

- [ ] Production architecture documented.
- [ ] Production uses the same provider strategy as staging.
- [ ] Production database is logically isolated.

### Database

- [ ] `literaria-nocturna-prod` database created.
- [ ] Production MongoDB URI configured only in hosting secrets.
- [ ] Production does not use the staging database.

### Backend

- [ ] Production environment variables configured.
- [ ] Production CORS origin configured.
- [ ] Rate limiting enabled.
- [ ] Request body limit configured.
- [ ] Health endpoint verified.
- [ ] Error responses verified.

### Frontend

- [ ] Production API URL configured.
- [ ] No localhost API dependency exists in the production build.
- [ ] Direct application routes work correctly.

### Deployment

- [ ] Required changes merged into `main`.
- [ ] CI passes.
- [ ] Production deployment completes successfully.
- [ ] Frontend can communicate with the production backend.
- [ ] Production CRUD flows are manually verified.

### Security

- [ ] No production secrets committed to Git.
- [ ] CORS does not use `*`.
- [ ] HTTPS is enabled.
- [ ] Sensitive implementation details are not exposed in API errors.

---

## Future Evolution

The current architecture is intentionally simple and cost-conscious.

If Literaria Nocturna evolves from a portfolio project into a real product, the infrastructure can be expanded independently.

Potential future changes include:

- Dedicated production MongoDB cluster
- Paid Vercel/Render infrastructure
- Custom domain
- Dedicated API domain
- Automated production deployment
- Database backups and recovery procedures
- Monitoring and alerting
- More advanced rollback strategies
- Additional security controls

These changes should be driven by actual requirements rather than introduced prematurely.
