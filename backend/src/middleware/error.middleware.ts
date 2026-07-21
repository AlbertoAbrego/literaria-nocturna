import { ErrorRequestHandler } from "express";
import mongoose from "mongoose";

interface HttpError extends Error {
  statusCode?: number;
  status?: number;
}

export const errorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  next,
) => {
  if(res.headersSent){
    return next(err);
  }
  const error = err as HttpError;
  console.log("Error: ", error)
  const statusCode = error.statusCode ?? error.status ?? 500;
  const message = statusCode >= 500 ? "Internal Server Error" : error.message;

  console.error(`[Error ${statusCode}]`, error);

  if(error instanceof mongoose.Error.ValidationError){
    return res.status(400).json({ message: "Validation failed" });
  }

  return res.status(statusCode).json({ message });
}
