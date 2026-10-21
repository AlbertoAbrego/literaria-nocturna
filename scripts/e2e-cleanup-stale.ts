import { resolve } from "node:path";
import { APIRequestContext, request as pwRequest } from "@playwright/test";
import { getApiBaseURL } from "../e2e/helpers/config";
import { isE2EOwned } from "../e2e/fixtures/test-data";
import { loadEnvFile } from "../e2e/helpers/env";

function getLocalApiBaseUrl(): string {
  const env = loadEnvFile(resolve("backend/.env"));
  const port = env.PORT || "3000";
  return `http://localhost:${port}`;
}

async function deleteStaleBooks(
  api: APIRequestContext,
  dryRun: boolean,
): Promise<number> {
  const response = await api.get("/api/books?limit=1000");
  if (!response.ok()) {
    console.error("[E2E Stale Cleanup] Failed to fetch books");
    return 0;
  }
  const body = (await response.json()) as {
    data: Array<{ _id: string; title: string; createdAt: string }>;
  };
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  const staleBooks = body.data.filter((book) => {
    if (!isE2EOwned(book.title)) return false;
    const createdAt = new Date(book.createdAt).getTime();
    return now - createdAt > twentyFourHours;
  });

  if (staleBooks.length === 0) {
    console.log("[E2E Stale Cleanup] No stale E2E books found");
    return 0;
  }

  console.log(
    `[E2E Stale Cleanup] Found ${staleBooks.length} stale E2E book(s)`,
  );
  for (const book of staleBooks) {
    console.log(`  - ${book.title} (created: ${book.createdAt})`);
  }

  if (dryRun) {
    console.log("[E2E Stale Cleanup] DRY RUN - no deletions performed");
    return staleBooks.length;
  }

  let deleted = 0;
  for (const book of staleBooks) {
    const del = await api.delete(`/api/books/${book._id}`);
    if (del.ok() || del.status() === 404) {
      deleted++;
    } else {
      console.error(
        `[E2E Stale Cleanup] Failed to delete ${book._id}: ${del.status()}`,
      );
    }
  }
  console.log(`[E2E Stale Cleanup] Deleted ${deleted} stale book(s)`);
  return deleted;
}

async function main(): Promise<void> {
  const dryRun =
    process.argv.includes("--dry-run") || !process.argv.includes("--force");
  const isStaging = process.env.E2E_STAGING === "1";

  if (isStaging && !process.env.E2E_RUN_ID) {
    console.error(
      "[E2E Stale Cleanup] REFUSING to clean staging without explicit E2E_RUN_ID",
    );
    console.error(
      "Set E2E_RUN_ID to the run ID you want to clean, or run without E2E_STAGING=1 for local cleanup",
    );
    process.exit(1);
  }

  console.log(
    `[E2E Stale Cleanup] Starting (staging: ${isStaging}, dryRun: ${dryRun})`,
  );

  const apiBase = isStaging ? getApiBaseURL() : getLocalApiBaseUrl();
  const api = await pwRequest.newContext({ baseURL: apiBase });

  try {
    await deleteStaleBooks(api, dryRun);
  } finally {
    await api.dispose();
  }

  console.log("[E2E Stale Cleanup] Complete");
}

main().catch((err) => {
  console.error("[E2E Stale Cleanup] Error:", err);
  process.exit(1);
});
