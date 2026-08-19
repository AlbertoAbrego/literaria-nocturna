# Story 23 — Pagination, Search & Data Integrity Fixes

## Objective

Fix the issues identified in pagination, search, and data consistency before beginning E2E testing.

## Scope

### Pagination

Fix:

- deleting the last item on a page;
- automatically adjusting the current page when it no longer exists;
- incorrect counts when filters are active;
- inconsistent pagination metadata.

### Search

Safely handle special characters used in `$regex`.

User input must not unintentionally alter the regular expression.

Search should maintain:

- case-insensitive matching;
- partial matching;
- safe handling of regex metacharacters.

### Data Integrity

Add a unique database constraint for:

```text
(title, author)
```

Handle MongoDB duplicate key error 11000 as:

```
409 CONFLICT
```

### Testing

Add tests for:

- Pagination
- Delete the last book on a page.
- Delete the only book on a page.
- Delete an item while filters are active.
- Navigate after deletion.
- Verify total, totalPages, and current page.
- Search

Test characters including:

- .
- -
- -
- ?
- (
- )
- [
- ]
- {
- }
- |
- ^
- $
- \

Also verify:

- partial matching;
- case-insensitive matching;
- normal text searches.
- Data Integrity
- Duplicate title + author.
- Same title with different author.
- Same author with different title.
- Concurrent duplicate creation where practical.
- Duplicate key → 409 CONFLICT.

### Acceptance Criteria

- Identified pagination bugs are fixed.
- Pagination metadata remains correct with filters.
- Special characters do not break search requests.
- Search maintains expected partial/case-insensitive behavior.
- Database enforces uniqueness for (title, author).
- Duplicate key errors return 409 CONFLICT.
- Backend and frontend test suites pass.

**Related Audit Findings**
H-02
H-05
H-08
