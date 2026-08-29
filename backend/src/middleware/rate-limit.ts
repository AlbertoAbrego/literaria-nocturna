import rateLimit from "express-rate-limit";

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "", 10) || 15 * 60 * 1000;
const max = parseInt(process.env.RATE_LIMIT_MAX ?? "", 10) || 100;

export const globalLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
});

export const healthLimiter = rateLimit({
  windowMs,
  max: Math.max(max, 300),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests, please try again later.",
    code: "RATE_LIMIT_EXCEEDED",
  },
});
