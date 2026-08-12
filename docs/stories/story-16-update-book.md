# Story 16 – Update Book

## Objective

Edit existing books.

## Description

Implement book editing using the existing form component and mutation architecture.

## Acceptance Criteria

- Existing book data is preloaded.
- The form is reusable.
- Successful update refreshes cached data.
- Error handling is implemented.
- Navigation works correctly after update.

## Deliverables

- `useUpdateBook`
- Edit page
- Reusable `BookForm`
- Cache invalidation

## Testing Scope

# Component Tests

- BookForm loads existing values.
- Form updates correctly.
- Validation works during editing.

# Hook Tests

- useUpdateBook updates a book.
- Mutation error handling works.
- Cache invalidation is triggered.

# Integration Tests

- User can edit a book.
- Updated data is displayed.
- Navigation after update works correctly.

## Out of Scope

- Deletion
