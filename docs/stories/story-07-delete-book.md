### **Objective**

Allow removing a book from the catalog.

### **Endpoint**

`DELETE /api/books/:id`

### **Acceptance Criteria**

- Validate the book ID format.
- Return 400 Bad Request for invalid IDs.
- Return 404 Not Found if the book does not exist.
- Delete the book successfully.
- Return 204 No Content on success.
- Errors are handled by the global error middleware.

### **Test Cases**

**Success**

- TC-H7-001 – Delete an existing book (204 No Content).

**Validation**

- TC-H7-002 – Invalid ObjectId format returns 400 Bad Request.

**Not Found**

- TC-H7-003 – Non-existent book returns 404 Not Found.

**Data Integrity**

- TC-H7-004 – Deleted book cannot be retrieved afterwards.

**Error Handling**

- TC-H7-005 – Database failure returns 500 Internal Server Error.
