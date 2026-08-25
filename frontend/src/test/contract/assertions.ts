import type { DefaultBodyType, HttpResponse } from "msw";
import type { ApiErrorResponse } from "./types";

async function getBody<T extends DefaultBodyType>(response: HttpResponse<T>): Promise<T | undefined> {
  if (response.bodyUsed) return undefined;
  try {
    return (await response.clone().json()) as T;
  } catch {
    return undefined;
  }
}

export async function expectContractResponse<T extends DefaultBodyType>(
  response: HttpResponse<T>,
  expectedStatus: number,
): Promise<T> {
  const body = await getBody(response);
  if (response.status !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus} but received ${response.status}. Body: ${JSON.stringify(body)}`,
    );
  }
  return body as T;
}

export async function expectValidationError(
  response: HttpResponse<ApiErrorResponse>,
  expectedMessage: string,
  expectedDetails?: Record<string, string>,
): Promise<void> {
  if (response.status !== 400) {
    throw new Error(
      `Expected status 400 but received ${response.status}. Body: ${JSON.stringify(await getBody(response))}`,
    );
  }

  const body = (await getBody(response)) as ApiErrorResponse;
  if (body?.code !== "VALIDATION_ERROR") {
    throw new Error(
      `Expected error code "VALIDATION_ERROR" but received "${body?.code}". Message: "${body?.message}"`,
    );
  }

  if (body.message !== expectedMessage) {
    throw new Error(
      `Expected error message "${expectedMessage}" but received "${body.message}"`,
    );
  }

  if (expectedDetails && JSON.stringify(body.details) !== JSON.stringify(expectedDetails)) {
    throw new Error(
      `Expected error details ${JSON.stringify(expectedDetails)} but received ${JSON.stringify(body.details)}`,
    );
  }
}

export async function expectNotFoundError(
  response: HttpResponse<ApiErrorResponse>,
  expectedMessage = "Book not found",
): Promise<void> {
  if (response.status !== 404) {
    throw new Error(
      `Expected status 404 but received ${response.status}. Body: ${JSON.stringify(await getBody(response))}`,
    );
  }

  const body = (await getBody(response)) as ApiErrorResponse;
  if (body?.code !== "NOT_FOUND") {
    throw new Error(
      `Expected error code "NOT_FOUND" but received "${body?.code}". Message: "${body?.message}"`,
    );
  }

  if (body.message !== expectedMessage) {
    throw new Error(
      `Expected error message "${expectedMessage}" but received "${body.message}"`,
    );
  }
}

export async function expectConflictError(
  response: HttpResponse<ApiErrorResponse>,
  expectedMessage = "Book already exists.",
): Promise<void> {
  if (response.status !== 409) {
    throw new Error(
      `Expected status 409 but received ${response.status}. Body: ${JSON.stringify(await getBody(response))}`,
    );
  }

  const body = (await getBody(response)) as ApiErrorResponse;
  if (body?.code !== "CONFLICT") {
    throw new Error(
      `Expected error code "CONFLICT" but received "${body?.code}". Message: "${body?.message}"`,
    );
  }

  if (body.message !== expectedMessage) {
    throw new Error(
      `Expected error message "${expectedMessage}" but received "${body.message}"`,
    );
  }
}
