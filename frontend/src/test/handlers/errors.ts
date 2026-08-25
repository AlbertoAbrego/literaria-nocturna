import { HttpResponse } from "msw";
import type { ApiErrorBody } from "@/shared/api/errors";
import { ERROR_MESSAGES } from "@/test/contract/error-messages";

function error(status: number, code: string, message: string, details?: Record<string, string>) {
  const body: ApiErrorBody = { message, code };
  if (details) {
    body.details = details;
  }
  return HttpResponse.json(body, { status });
}

export function validationError(
  message: string = ERROR_MESSAGES.VALIDATION_FAILED,
  details?: Record<string, string>,
) {
  return error(400, "VALIDATION_ERROR", message, details);
}

export function unauthorizedError(message: string = "Unauthorized") {
  return error(401, "UNAUTHORIZED", message);
}

export function notFoundError(message: string = ERROR_MESSAGES.BOOK_NOT_FOUND) {
  return error(404, "NOT_FOUND", message);
}

export function conflictError(message: string = ERROR_MESSAGES.BOOK_EXISTS) {
  return error(409, "CONFLICT", message);
}

export function internalError(message: string = ERROR_MESSAGES.INTERNAL_SERVER_ERROR) {
  return error(500, "INTERNAL_ERROR", message);
}
