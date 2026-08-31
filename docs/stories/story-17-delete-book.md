# Story 17 – Delete Book

## Objective

Delete books safely from the frontend.

## Description

Implement deletion with confirmation, mutation handling, and cache synchronization.

## Acceptance Criteria

- Delete action is available.
- Confirmation modal is implemented.
- Successful deletion refreshes the book list.
- Error handling is implemented.
- Optimistic UI behavior is considered where appropriate.

## Deliverables

- `useDeleteBook`
- Confirmation modal
- Delete integration
- Cache synchronization

## Testing Scope

# Component Tests

- Delete button renders correctly.
- Confirmation modal opens.
- Confirmation modal closes correctly.

# Hook Tests

- useDeleteBook deletes a book.
- Mutation error handling works.
- Cache invalidation is triggered.

# Integration Tests

- User can delete a book.
- Confirmation flow works.
- Book list updates after deletion.

## Out of Scope

- Bulk deletion
