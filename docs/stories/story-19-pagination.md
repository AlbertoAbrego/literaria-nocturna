# Story 19 – Pagination

## Objective

Implement paginated navigation for the book catalog.

## Description

Integrate backend pagination with a responsive pagination interface and React Query cache management.

## Acceptance Criteria

- Pagination controls are implemented.
- Backend pagination is consumed.
- Page navigation updates the URL.
- Pagination metadata is displayed.
- Previous and next navigation works.
- Direct page navigation works.
- Loading states between pages are handled smoothly.

## Deliverables

- `PaginationControls`
- Pagination integration
- URL synchronization
- React Query pagination
- Metadata display

## Testing Scope

# Component Tests

- Pagination controls render correctly.
- Current page is highlighted.
- Previous and next buttons behave correctly.

# Hook Tests

- Page state updates correctly.
- Query keys change correctly.
- Pagination metadata is handled correctly.

# Integration Tests

- User can navigate between pages.
- URL synchronization works correctly.
- Pagination metadata is displayed.
- Loading state between pages works correctly.

## Out of Scope

- Infinite scroll
- Virtualized lists
