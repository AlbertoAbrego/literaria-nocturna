### **Objective**

Establish the testing infrastructure for the backend to support integration testing for all current and future API endpoints.

### **Scope**

- Configure Jest with TypeScript support.
- Configure Supertest for API integration testing.
- Set up a dedicated test database (preferably MongoDB Memory Server).
- Create global test setup and teardown.
- Create reusable test helpers and utilities.
- Add npm scripts for running tests.
- Document the testing strategy.

### **Acceptance Criteria**

- Jest is configured and runs successfully.
- Supertest can perform HTTP requests against the application.
- Tests run in isolation.
- Test database is created and cleaned automatically.
- Initial integration tests are added for Stories 1–5.
- Documentation is available in docs/testing.md.

### **Initial integration tests for stories 1-5**

- TC-H1-001 – GET /api/health returns 200 OK.
- TC-H2-001 – Create a valid book (201 Created).
- TC-H2-008 – Duplicate book (same title and author) returns 409 Conflict.
- TC-H2-002 – Missing title returns 400 Bad Request.
- TC-H4-001 – Retrieve all books (200 OK).
- TC-H4-002 – Return an empty array when no books exist.
- TC-H5-001 – Retrieve an existing book by ID (200 OK).
- TC-H5-003 – Valid ObjectId that does not exist returns 404 Not Found.

### **Test Cases**

**Framework**

- TC-H55-001 – Jest executes successfully.
- TC-H55-002 – Supertest can perform HTTP requests against the app.

**Database**

- TC-H55-003 – Test database is created before execution.
- TC-H55-004 – Test database is cleaned between tests.
- TC-H55-005 – Test database is disconnected after execution.

**Isolation**

- TC-H55-006 – Tests do not share data.
- TC-H55-007 – Test order does not affect results.

**Tooling**

- TC-H55-008 – npm test executes successfully.
- TC-H55-009 – Test coverage can be generated.
