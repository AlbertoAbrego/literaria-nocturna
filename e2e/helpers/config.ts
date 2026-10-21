import { isStagingE2E } from "./env";

// Deployed staging environment (Story 42). These are the actual live
// endpoints: the Vercel frontend at the apex domain and the Render backend.
// Both can be overridden per-run via PLAYWRIGHT_BASE_URL / PLAYWRIGHT_API_URL.
export const STAGING_BASE_URL = "https://literaria-nocturna.vercel.app";
export const STAGING_API_URL = "https://literaria-nocturna.onrender.com";

const LOCAL_BASE_URL = "http://localhost:5173";
const LOCAL_API_URL = "http://localhost:3000";

export function getBaseURL(): string {
  return isStagingE2E()
    ? process.env.PLAYWRIGHT_BASE_URL || STAGING_BASE_URL
    : LOCAL_BASE_URL;
}

export function getApiBaseURL(): string {
  return isStagingE2E()
    ? process.env.PLAYWRIGHT_API_URL || STAGING_API_URL
    : LOCAL_API_URL;
}
