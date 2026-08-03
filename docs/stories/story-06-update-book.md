### **Objective**

Allow updating an existing book in the catalog.

### **Endpoint**

`PATCH /api/books/:id`

### **Acceptance Criteria**

- Validate the book ID format.
- Return 400 Bad Request for invalid IDs.
- Return 404 Not Found if the book does not exist.
- Update one or more book fields.
- Validate updated data.
- Return 200 OK with the updated book.
- Errors are handled by the global error middleware.

### **Test Cases**

**Success**

- TC-H6-001 – Update an existing book (200 OK).
- TC-H6-002 – Partially update a book (200 OK).

**Validation**

- TC-H6-003 – Invalid ObjectId format returns 400 Bad Request.
- TC-H6-004 – Invalid genre returns 400 Bad Request.
- TC-H6-005 – Invalid request body returns 400 Bad Request.

**Not Found**

- TC-H6-006 – Non-existent book returns 404 Not Found.

**Business Rules**

- TC-H6-007 – Updating to a duplicate title/author combination returns 409 Conflict.

**Error Handling**

- TC-H6-008 – Database failure returns 500 Internal Server Error.
