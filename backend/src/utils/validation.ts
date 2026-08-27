import { GENRES } from "../constants/genres";

const ObjectIdPattern = /^[0-9a-fA-F]{24}$/;

export function validateObjectId(id: string): boolean {
  return typeof id === "string" && ObjectIdPattern.test(id);
}

export function validateGenre(genre: string): boolean {
  return (GENRES as readonly string[]).includes(genre);
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePage(page: unknown): ValidationResult {
  if (page === null || page === undefined || page === "") {
    return { valid: true };
  }

  const num = Number(page);
  if (!Number.isInteger(num) || num < 1) {
    return { valid: false, error: "Invalid page value" };
  }

  return { valid: true };
}

export function validateLimit(limit: unknown): ValidationResult {
  if (limit === null || limit === undefined || limit === "") {
    return { valid: true };
  }

  const num = Number(limit);
  if (!Number.isInteger(num) || num < 1 || num > 100) {
    return { valid: false, error: "Invalid limit value" };
  }

  return { valid: true };
}

export function validateRequiredBody(body: unknown): ValidationResult {
  if (
    body === null ||
    body === undefined ||
    (typeof body === "object" && Object.keys(body).length === 0)
  ) {
    return { valid: false, error: "Request body is missing" };
  }

  return { valid: true };
}

export function validateEmptyBody(body: unknown): ValidationResult {
  if (
    body === null ||
    body === undefined ||
    (typeof body === "object" && Object.keys(body).length === 0)
  ) {
    return { valid: false, error: "Request body is missing" };
  }

  return { valid: true };
}
