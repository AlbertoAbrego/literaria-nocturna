import type { Response } from "supertest";

export function expectValidationError(response: Response): void {
  expect(response.status).toBe(400);
  expect(response.body.message).toBe("Validation failed");
}

export function expectConflictError(response: Response): void {
  expect(response.status).toBe(409);
  expect(response.body.message).toBe("Book already exists.");
}

export function expectNotFoundError(response: Response): void {
  expect(response.status).toBe(404);
  expect(response.body.message).toBe("Book not found");
}
