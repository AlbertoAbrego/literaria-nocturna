# Story 20 — Local Development & Environment Standardization

## Objective

Establish a single, reproducible contract for running the backend and frontend from a clean repository clone.

## Scope

### Backend

- Create `backend/.env.example`.
- Document:
  - `PORT`
  - `MONGODB_URI`
- Establish the canonical backend port.
- Improve the error shown when `MONGODB_URI` is not defined.

### Frontend

- Correct the default `VITE_API_URL`.
- Establish a single frontend → backend communication strategy.
- Evaluate and configure the Vite proxy if appropriate.
- Remove contradictory defaults.

### Seed

- Remove hardcoded API URLs.
- Use the established API URL configuration.
- Ensure the seed can be executed correctly from a clean clone.
- Avoid failing unnecessarily when executed a second time because the books already exist.

### Documentation

Document:

- ports;
- environment variables;
- installation;
- backend execution;
- frontend execution;
- seed execution;
- required dependencies.

## Acceptance Criteria

- A clean clone can be configured by following only the project documentation.
- Backend and frontend use consistent ports.
- Frontend can communicate with the backend without implicit configuration.
- `backend/.env.example` exists.
- Seed executes correctly.
- No contradictory hardcoded localhost URLs remain.

## Testing

- Backend test suite.
- Frontend test suite.
- Manual verification from a clean configuration.
- Seed execution verification.
- Frontend → backend communication verification.

## Related Audit Findings

- C-02
- H-07
- M-09
