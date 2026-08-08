export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
// `as const` narrows each property to its literal string type instead of `string`,
// so ErrorCode can be a precise union and typos in codes fail at compile time.

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
// Indexed access on `(typeof ErrorCodes)[keyof ...]` produces a union of the object's literal values
// (e.g. "VALIDATION_ERROR" | "NOT_FOUND" | ...), keeping every code in one single source of truth.

export function deriveCodeFromStatus(statusCode: number): ErrorCode {
  if (statusCode === 404) return ErrorCodes.NOT_FOUND;
  if (statusCode === 409) return ErrorCodes.CONFLICT;
  if (statusCode >= 500) return ErrorCodes.INTERNAL_ERROR;
  return ErrorCodes.VALIDATION_ERROR;
}
// Fallback mapping so callers that only pass message + statusCode still get a consistent code.

export class AppError extends Error {
  public readonly statusCode: number;
  // `readonly` prevents the status from being mutated after construction.
  public readonly code: ErrorCode;
  public readonly details?: Record<string, string>;
  // `details` is optional and only populated when field-level validation messages exist.

  constructor(
    message: string,
    statusCode: number,
    code?: ErrorCode,
    details?: Record<string, string>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code ?? deriveCodeFromStatus(statusCode);
    this.details = details;
  }
}
