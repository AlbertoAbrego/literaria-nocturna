import { Request, Response } from "express";

export const getHealth = (_: Request, res: Response) => {
  const response = {
    status: "ok",
    message: "Literaria Nocturna API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  };
  return res.status(200).json(response);
};
