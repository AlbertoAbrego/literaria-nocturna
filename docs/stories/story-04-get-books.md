### **Objective**

List all books

### **Endpoint**

`GET /api/books`

### **Acceptance criteria:**

- Get all books listed
- 200 ok Response
- Return an array
- Return an empty array when there are no books
- Errors handling with global middleware

### **Test Cases**

**Success**

- TC-H4-001 – Retrieve all books (200 OK).
- TC-H4-002 – Return an empty array when no books exist.

**Data Integrity**

- TC-H4-003 – Response is an array.
- TC-H4-004 – Returned books contain the expected fields.

**Error Handling**

- TC-H4-005 – Database failure returns 500 Internal Server Error.
