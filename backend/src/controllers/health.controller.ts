import { Request, Response } from "express";

/**
 * @openapi
 * /health:
 *   get:
 *     summary: API health check
 *     tags: [Health]
 *     responses:
 *       "200":
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, version, timestamp]
 *               properties:
 *                 status:
 *                   type: string
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
export const getHealth = (_: Request, res: Response) => {
  const response = {
    status: "ok",
    message: "Literaria Nocturna API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  };
  return res.status(200).json(response);
};
