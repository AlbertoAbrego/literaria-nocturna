# Story 15 – Create Book

## Objective

Create new books from the frontend.

## Description

Implement the book creation form with client-side validation and mutation handling.

## Acceptance Criteria

- Book creation form is implemented.
- Form validation is implemented.
- Successful creation redirects to the book list.
- Error handling is implemented.
- TanStack Query mutation is used.
- The books cache is refreshed after creation.

## Deliverables

- `BookForm`
- `useCreateBook`
- Create page
- Form validation
- Mutation handling

## Testing Scope

# Component Tests

- BookForm renders correctly.
- Required field validation works.
- Genre selection works.
- Submit button behavior is correct.

# Hook Tests

- useCreateBook creates a book successfully.
- Mutation error handling works.
- Cache invalidation is triggered.

# Integration Tests

- User can create a book.
- Validation errors are displayed.
- Successful creation redirects correctly.
- Book list updates after creation.

## Out of Scope

- Editing existing books
