import { ErrorRequestHandler } from "express";

interface HttpError extends Error {
  statusCode?: number;
  status?: number;
}

export const errorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next,
) => {
  if(res.headersSent){
    return _next(err);
  }

  const error = err as HttpError;
  const statusCode = error.statusCode ?? error.status ?? 500;
  const message = statusCode >= 500 ? "Internal Server Error" : error.message;

  console.error(`[Error ${statusCode}]`, error);

  res.status(statusCode).json({ message });
}
