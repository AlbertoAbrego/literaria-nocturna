import { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { AppError, ErrorCodes } from "../errors/AppError";
import type { ErrorCode } from "../errors/AppError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  // If a response was already sent, Express itself must finish the request.

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

    return res.status(400).json({
      message: "Validation failed",
      code: ErrorCodes.VALIDATION_ERROR,
      details,
    });
  }
  // Mongoose schema validation is always a client error → 400 with field details.

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      console.error(`[Error ${err.statusCode}]`, err);
    }
    // Only server errors are logged; 4xx client errors are silent.

    const body: { message: string; code: ErrorCode; details?: Record<string, string> } = {
      message: err.statusCode >= 500 ? "Internal Server Error" : err.message,
      code: err.code,
    };
    if (err.details) {
      body.details = err.details;
    }
    // `details` only appears when explicitly attached to the AppError.

    return res.status(err.statusCode).json(body);
  }
  // Business errors carry their own status/code (e.g. 404 NOT_FOUND, 409 CONFLICT).

  console.error("[Error 500]", err);
  return res.status(500).json({
    message: "Internal Server Error",
    code: ErrorCodes.INTERNAL_ERROR,
  });
  // Anything else is unexpected; its details are never exposed to the client.
};
