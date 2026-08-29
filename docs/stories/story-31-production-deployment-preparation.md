# Story 31 — Production Deployment Preparation

## Objective

Prepare the project for a future production deployment without making production deployment a prerequisite for E2E development.

## Scope

Define the production architecture and deployment process while keeping staging as the primary testing environment.

## Target Flow

```text
Feature Branch
      ↓
Pull Request
      ↓
CI
      ↓
main
      ↓
Staging
      ↓
Validation
      ↓
Production
```

## Tasks

- Define production frontend architecture.
- Define production backend architecture.
- Define production database.
- Define production environment variables.
- Define production CORS policy.
- Define domain strategy.
- Define deployment process.
- Define rollback strategy.
- Document differences between staging and production.

## Environment Matrix

Document configuration for:

| Configuration | Development | Staging | Production |
| --- | --- | --- | --- |
| Frontend API | Local API | Staging API | Production API |
| Database | Local/Dev | Staging DB | Production DB |
| CORS | Localhost | Staging domain | Production domain |
| Secrets | Local `.env` | Hosting secrets | Hosting secrets |
| HTTPS | Optional | Required | Required |

## Acceptance Criteria

- Production architecture is documented.
- Production environment variables are defined.
- Production database strategy is defined.
- Domain strategy is defined.
- Deployment process is documented.
- Rollback strategy is documented.
- Staging remains independent from production.
- No production secrets are committed to Git.

## Out of Scope

- Actual production deployment.
- Production domain purchase.
- Production traffic.
- Playwright E2E tests.

## Definition of Done

- Production architecture documented.
- Environment matrix documented.
- Deployment procedure documented.
- Rollback strategy documented.
- Production configuration identified.
- Staging/production separation verified.
