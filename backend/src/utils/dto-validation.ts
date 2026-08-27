import { validateGenre, validatePage, validateLimit, validateRequiredBody } from "./validation";

export interface ValidationResultWithDetails {
  valid: boolean;
  details?: Record<string, string>;
}

export function validateCreateBookDto(body: unknown): ValidationResultWithDetails {
  const bodyCheck = validateRequiredBody(body);
  if (!bodyCheck.valid) {
    return { valid: false, details: { body: bodyCheck.error! } };
  }

  const b = body as Record<string, unknown>;
  const details: Record<string, string> = {};

  if (!b.title) details.title = "title is required";
  if (!b.author) details.author = "author is required";
  if (!b.genre) details.genre = "genre is required";
  if (!b.synopsis) details.synopsis = "synopsis is required";

  if (Object.keys(details).length > 0) {
    return { valid: false, details };
  }

  if (!validateGenre(b.genre as string)) {
    return { valid: false, details: { genre: "Invalid genre" } };
  }

  return { valid: true };
}

export function validateUpdateBookDto(body: unknown): ValidationResultWithDetails {
  if (
    body === null ||
    body === undefined ||
    (typeof body === "object" && Object.keys(body).length === 0)
  ) {
    return { valid: false, details: { body: "Request body is missing" } };
  }

  const b = body as Record<string, unknown>;
  const details: Record<string, string> = {};

  if (b.genre !== undefined && !validateGenre(b.genre as string)) {
    details.genre = "Invalid genre";
  }

  if (Object.keys(details).length > 0) {
    return { valid: false, details };
  }

  return { valid: true };
}

export function validateBookQueryDto(query: Record<string, unknown>): ValidationResultWithDetails {
  const details: Record<string, string> = {};

  if (query.genre && !validateGenre(query.genre as string)) {
    details.genre = "Invalid genre";
  }

  const pageResult = validatePage(query.page);
  if (!pageResult.valid) {
    details.page = pageResult.error!;
  }

  const limitResult = validateLimit(query.limit);
  if (!limitResult.valid) {
    details.limit = limitResult.error!;
  }

  if (Object.keys(details).length > 0) {
    return { valid: false, details };
  }

  return { valid: true };
}
