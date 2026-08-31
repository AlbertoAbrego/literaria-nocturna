### **Objective**

Support paginated book listing.

### **Endpoint**

`GET /api/books?page=1&limit=10`

### **Acceptance Criteria**

- Support page and limit query parameters.
- Return the requested page of books.
- Return pagination metadata.
- Validate pagination parameters.
- Return 400 Bad Request for invalid pagination values.
- Return 200 OK for successful requests.
- Errors are handled by the global error middleware.

### **Test Cases**

**Success**

- TC-H9-001 – Retrieve the first page.
- TC-H9-002 – Retrieve a middle page.
- TC-H9-003 – Retrieve the last page.
- TC-H9-004 – Retrieve an empty page.

**Defaults**

- TC-H9-005 – Default pagination values are applied when parameters are omitted.

**Validation**

- TC-H9-006 – Invalid page value returns 400 Bad Request.
- TC-H9-007 – Invalid limit value returns 400 Bad Request.

**Metadata**

- TC-H9-008 – Pagination metadata is returned correctly.

**Error Handling**

- TC-H9-009 – Database failure returns 500 Internal Server Error.
