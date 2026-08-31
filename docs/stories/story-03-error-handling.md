### **Objective**

Standarize errors handling of the API

### **Acceptance criteria:**

- Global errors middleware
- Consistent responses
- 409 Conflict for cuplicated books
- 400 Bad Request for validating errors
- 500 unexpected errors handler
- AppError integration

### **Test Cases**

**Error Responses**

- TC-H3-001 – Validation errors return a consistent response structure.
- TC-H3-002 – Business rule violations return the correct HTTP status code.
- TC-H3-003 – Unexpected errors return 500 Internal Server Error.

**Security**

- TC-H3-004 – Internal error messages are not exposed to the client.

**Logging**

- TC-H3-005 – Validation errors are logged.
- TC-H3-006 – Unexpected errors are logged.
