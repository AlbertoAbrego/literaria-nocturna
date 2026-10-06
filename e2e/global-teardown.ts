import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { APIRequestContext, request as pwRequest } from "@playwright/test";
import { RUN_ID_PATH } from "./global-setup";
import { loadEnvFile } from "./helpers/env";

function loadEnvFileLocal(filePath: string): Record<string, string> {
  const vars: Record<string, string> = {};
  const content = readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    vars[key] = value;
  }
  return vars;
}

function getApiBaseUrl(): string {
  const isStaging = process.env.E2E_STAGING === "1";
  if (isStaging) {
    return process.env.PLAYWRIGHT_API_URL || "https://api-staging.literaria-nocturna.render.com";
  }
  const env = loadEnvFileLocal(resolve("backend/.env"));
  const port = env.PORT || "3000";
  return `http://localhost:${port}`;
}

async function deleteRunBooks(api: APIRequestContext, runId: string): Promise<number> {
  try {
    const response = await api.get("/api/books?limit=100");
    if (!response.ok()) {
      const errorBody = await response.text().catch(() => "unknown");
      console.warn(`[E2E Global Teardown] Failed to fetch books for cleanup: ${response.status()} ${response.statusText()} - ${errorBody}`);
      return 0;
    }
    const body = (await response.json()) as { data: Array<{ _id: string; title: string }> };
    const runPrefix = `E2E:${runId}:`;
    const runBooks = body.data.filter((b) => b.title.startsWith(runPrefix));

    let deleted = 0;
    for (const book of runBooks) {
      const del = await api.delete(`/api/books/${book._id}`);
      if (del.ok() || del.status() === 404) {
        deleted++;
      } else {
        console.warn(`[E2E Global Teardown] Failed to delete book ${book._id}: ${del.status()}`);
      }
    }
    return deleted;
  } catch (err) {
    console.warn(`[E2E Global Teardown] Error during cleanup: ${err}`);
    return 0;
  }
}

export default async function globalTeardown(): Promise<void> {
  const isStaging = process.env.E2E_STAGING === "1";
  const runIdFile = RUN_ID_PATH;

  let runId: string | null = null;
  try {
    runId = readFileSync(runIdFile, "utf-8").trim();
  } catch {
    console.log("[E2E Global Teardown] No run ID file found, skipping cleanup");
    return;
  }

  if (!runId) {
    console.log("[E2E Global Teardown] Empty run ID, skipping cleanup");
    return;
  }

  if (isStaging && !process.env.E2E_RUN_ID) {
    console.error("[E2E Global Teardown] REFUSING to clean staging without explicit run ID");
    return;
  }

  console.log(`[E2E Global Teardown] Cleaning up run ${runId} (staging: ${isStaging})`);

  const apiBase = getApiBaseUrl();
  const api = await pwRequest.newContext({ baseURL: apiBase });
  const deleted = await deleteRunBooks(api, runId);
  await api.dispose();

  console.log(`[E2E Global Teardown] Deleted ${deleted} test-owned books`);
}
