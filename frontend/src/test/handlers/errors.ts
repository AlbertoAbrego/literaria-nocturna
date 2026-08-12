import { HttpResponse } from "msw";
import type { ApiErrorBody } from "@/shared/api/errors";

function error(status: number, code: string, message: string, details?: Record<string, string>) {
  const body: ApiErrorBody = { message, code };
  if (details) {
    body.details = details;
  }
  return HttpResponse.json(body, { status });
}

export function validationError(message = "Validation failed", details?: Record<string, string>) {
  return error(400, "VALIDATION_ERROR", message, details);
}

export function unauthorizedError(message = "Unauthorized") {
  return error(401, "UNAUTHORIZED", message);
}

export function notFoundError(message = "Resource not found") {
  return error(404, "NOT_FOUND", message);
}

export function conflictError(message = "Resource already exists") {
  return error(409, "CONFLICT", message);
}

export function internalError(message = "Internal server error") {
  return error(500, "INTERNAL_ERROR", message);
}
