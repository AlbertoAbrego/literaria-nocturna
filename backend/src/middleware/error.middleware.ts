import { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { AppError, ErrorCodes, deriveCodeFromStatus } from "../errors/AppError";
import type { ErrorCode } from "../errors/AppError";

interface HttpError extends Error {
  statusCode?: number;
  status?: number;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.keys(err.errors).reduce(
      (acc, key) => {
        acc[key] = err.errors[key].message;
        return acc;
      },
      {} as Record<string, string>,
    );
    // `err.errors` maps field names to mongoose validator/cast errors; reducing it
    // to { field: message } gives clients field-level details without exposing internals.
    // The `{} as Record<string, string>` cast types the accumulator so no implicit any is inferred.

    return res.status(400).json({
      message: "Validation failed",
      code: ErrorCodes.VALIDATION_ERROR,
      details,
    });
  }

  const error = err as HttpError;
  const statusCode = error.statusCode ?? error.status ?? 500;

  if (statusCode >= 500) {
    console.error(`[Error ${statusCode}]`, error);
  }

  const message = statusCode >= 500 ? "Internal Server Error" : error.message;

  const body: { message: string; code: ErrorCode; details?: Record<string, string> } = {
    message,
    code: error instanceof AppError ? error.code : deriveCodeFromStatus(statusCode),
  };
  // AppError always carries a code (assigned in its constructor); any other error
  // gets the status-based fallback so the response format stays consistent.

  if (error instanceof AppError && error.details) {
    body.details = error.details;
  }
  // `details` only appears in the response when explicitly attached to the AppError.

  return res.status(statusCode).json(body);
};
