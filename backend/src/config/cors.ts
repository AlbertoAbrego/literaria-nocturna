import type { CorsOptions } from "cors";

const DEFAULT_ORIGIN = "http://localhost:5173";

function parseOrigins(raw: string | undefined): string[] {
  if (!raw) return [DEFAULT_ORIGIN];
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

const allowedOrigins = parseOrigins(process.env.CORS_ORIGIN);

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
