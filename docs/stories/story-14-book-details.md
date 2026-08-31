# Story 14 – Book Details

## Objective

Display complete information for a single book.

## Description

Implement the book details page using dynamic routing and feature-based data fetching.

## Acceptance Criteria

- Route `/books/:id` is implemented.
- Book details are retrieved from the backend.
- Loading state is implemented.
- Error state is implemented.
- Not found state is implemented.
- Navigation back to the book list is available.

## Deliverables

- `getBookById`
- `useBook`
- `BookDetails`
- `BookDetailsPage`

## Testing Scope

# Component Tests

- BookDetails renders all book fields.
- Loading state is displayed.
- Error state is displayed.
- Not found state is displayed.

# Hook Tests

- useBook fetches a single book.
- useBook handles API errors.

# Integration Tests

- Book details page loads correctly.
- Invalid ID displays not found state.
- Navigation back to list works correctly.

## Out of Scope

- Editing
- Deletion
