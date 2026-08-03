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
  
  if(error instanceof mongoose.Error.ValidationError){
    return res.status(400).json({ message: "Validation failed" });
  }
  
  const statusCode = error.statusCode ?? error.status ?? 500;
  
  if(statusCode >= 500){
    console.error(`[Error ${statusCode}]`, error);
  }
  
  const message = statusCode >= 500 ? "Internal Server Error" : error.message;

  return res.status(statusCode).json({ message });
}
