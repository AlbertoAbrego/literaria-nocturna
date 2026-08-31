### **Objective**

Being able to register a book to the catalog

### **Endpoint**

`POST /api/books`

### **Acceptance criteria:**

- Create BookModel
- Create CreateBookDto
- Implement BookService.createBook
- Implement BookController.createBook
- Register route
- Validate duplicated books (title + author)
- Persistence in Mongo

### **Test Cases**

**Success**

- TC-H2-001 – Create a valid book (201 Created).

**Validation**

- TC-H2-002 – Missing title returns 400 Bad Request.
- TC-H2-003 – Missing author returns 400 Bad Request.
- TC-H2-004 – Missing genre returns 400 Bad Request.
- TC-H2-005 – Missing synopsis returns 400 Bad Request.
- TC-H2-006 – Invalid genre value returns 400 Bad Request.
- TC-H2-007 – Empty request body returns 400 Bad Request.

**Business Rules**

- TC-H2-008 – Duplicate book (same title and author) returns 409 Conflict.

**Error Handling**

- TC-H2-009 – Invalid request payload returns 400 Bad Request.
- TC-H2-010 – Unexpected server error returns 500 Internal Server Error.
