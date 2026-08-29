import { Request, Response } from "express";
import mongoose from "mongoose";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("../../package.json");

/**
 * @openapi
 * /health:
 *   get:
 *     summary: API liveness check
 *     tags: [Health]
 *     description: Returns 200 if the process is alive. Does not check database connectivity.
 *     responses:
 *       "200":
 *         description: API is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, version, timestamp]
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
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
    version,
    timestamp: new Date().toISOString(),
  };
  return res.status(200).json(response);
};

/**
 * @openapi
 * /health/ready:
 *   get:
 *     summary: API readiness check
 *     tags: [Health]
 *     description: Returns 200 if the database is reachable. Returns 503 if the database is unavailable.
 *     responses:
 *       "200":
 *         description: API is ready to accept traffic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, version, timestamp, database]
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: string
 *                   example: connected
 *       "503":
 *         description: API is not ready (database unavailable)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [status, message, database]
 *               properties:
 *                 status:
 *                   type: string
 *                   example: degraded
 *                 message:
 *                   type: string
 *                 database:
 *                   type: string
 *                   example: disconnected
 */
export const getReadiness = (_: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const isConnected = dbState === 1;

  if (isConnected) {
    return res.status(200).json({
      status: "ok",
      message: "Literaria Nocturna API",
      version,
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  }

  const stateLabels: Record<number, string> = {
    0: "disconnected",
    2: "connecting",
    3: "disconnecting",
  };

  return res.status(503).json({
    status: "degraded",
    message: "Database is unavailable",
    version,
    timestamp: new Date().toISOString(),
    database: stateLabels[dbState] ?? "unknown",
  });
};
