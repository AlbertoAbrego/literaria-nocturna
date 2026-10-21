import { readFileSync } from "node:fs";
import { APIRequestContext, request as pwRequest } from "@playwright/test";
import { RUN_ID_PATH } from "./global-setup";
import { getApiBaseURL } from "./helpers/config";
import { isStagingE2E } from "./helpers/env";

async function deleteRunBooks(
  api: APIRequestContext,
  runId: string,
): Promise<number> {
  try {
    const response = await api.get("/api/books?limit=100");
    if (!response.ok()) {
      const errorBody = await response.text().catch(() => "unknown");
      console.warn(
        `[E2E Global Teardown] Failed to fetch books for cleanup: ${response.status()} ${response.statusText()} - ${errorBody}`,
      );
      return 0;
    }
    const body = (await response.json()) as {
      data: Array<{ _id: string; title: string }>;
    };
    const runPrefix = `E2E:${runId}:`;
    const runBooks = body.data.filter((b) => b.title.startsWith(runPrefix));

    let deleted = 0;
    for (const book of runBooks) {
      const del = await api.delete(`/api/books/${book._id}`);
      if (del.ok() || del.status() === 404) {
        deleted++;
      } else {
        console.warn(
          `[E2E Global Teardown] Failed to delete book ${book._id}: ${del.status()}`,
        );
      }
    }
    return deleted;
  } catch (err) {
    console.warn(`[E2E Global Teardown] Error during cleanup: ${err}`);
    return 0;
  }
}

export default async function globalTeardown(): Promise<void> {
  const isStaging = isStagingE2E();
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
    console.error(
      "[E2E Global Teardown] REFUSING to clean staging without explicit run ID",
    );
    return;
  }

  console.log(
    `[E2E Global Teardown] Cleaning up run ${runId} (staging: ${isStaging})`,
  );

  const apiBase = getApiBaseURL();
  const api = await pwRequest.newContext({ baseURL: apiBase });
  const deleted = await deleteRunBooks(api, runId);
  await api.dispose();

  console.log(`[E2E Global Teardown] Deleted ${deleted} test-owned books`);
}
