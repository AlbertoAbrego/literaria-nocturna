### **Objective**

Consult an specific book

### **Endpoint**

`GET /api/books/:id`

### **Acceptance criteria:**

- Validate ObjectId format
- Search by ID
- 200 ok Response when book exists
- 404 Not found when book doesn't exist
- 400 Bad Request for invalid IDs
- Errors handled by Global errors handler

### **Test Cases**

**Success**

- TC-H5-001 – Retrieve an existing book by ID (200 OK).

**Validation**

- TC-H5-002 – Invalid ObjectId format returns 400 Bad Request.

**Not Found**

- TC-H5-003 – Valid ObjectId that does not exist returns 404 Not Found.

**Error Handling**

- TC-H5-004 – Database failure returns 500 Internal Server Error.
