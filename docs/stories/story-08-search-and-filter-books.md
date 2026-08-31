### **Objective**

Allow filtering books using query parameters.

### **Endpoint**

`GET /api/books`

### **Supported Filters**

- genre
- author
- title (optional)

### **Matching Semantics**

- `genre` matches exactly (enum value).
- `author` and `title` match partially and case-insensitively (`$regex`, `$options: "i"`).

### **Sorting**

- Results are sorted by `title` in ascending order.

### **Acceptance Criteria**

- Return books matching the provided filters.
- Support combining multiple filters.
- Return an empty array when no books match.
- Return 200 OK for successful requests.
- Errors are handled by the global error middleware.

### **Test Cases**

**Success**

- TC-H8-001 – Filter by genre.
- TC-H8-002 – Filter by author.
- TC-H8-003 – Filter by title.
- TC-H8-004 – Combine multiple filters.

**No Results**

- TC-H8-005 – No matching books returns an empty array.

**Validation**

- TC-H8-006 – Invalid `genre` returns 400 Bad Request (implemented; other filter values are free text and require no validation).

**Error Handling**

- TC-H8-007 – Database failure returns 500 Internal Server Error.
