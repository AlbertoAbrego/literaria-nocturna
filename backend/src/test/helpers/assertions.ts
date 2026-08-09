import type { Response } from "supertest";

export function expectValidationError(response: Response): void {
  expect(response.status).toBe(400);
  expect(response.body).toMatchObject({
    message: "Validation failed",
    code: "VALIDATION_ERROR",
  });
}

export function expectConflictError(response: Response): void {
  expect(response.status).toBe(409);
  expect(response.body).toMatchObject({
    message: "Book already exists.",
    code: "CONFLICT",
  });
}

export function expectNotFoundError(response: Response): void {
  expect(response.status).toBe(404);
  expect(response.body).toMatchObject({
    message: "Book not found",
    code: "NOT_FOUND",
  });
}