import { resolve } from "node:path";
import { MongoClient } from "mongodb";
import { test, expect } from "@playwright/test";
import { gotoCatalog } from "../helpers/navigation";
import { loadEnvFile } from "../helpers/env";
import { SEED_BOOKS } from "../global-setup";

function getMongoClient() {
  const env = loadEnvFile(resolve("backend/.env"));
  return new MongoClient(env.MONGODB_URI);
}

test.describe("Empty Catalog", () => {
  test.beforeEach(async () => {
    const client = getMongoClient();
    await client.connect();
    await client.db().collection("books").deleteMany({});
    await client.close();
  });

  test.afterEach(async () => {
    const client = getMongoClient();
    await client.connect();
    await client
      .db()
      .collection("books")
      .insertMany([...SEED_BOOKS]);
    await client.close();
  });

  test("TC-H36-011: empty catalog shows empty state", async ({ page }) => {
    await gotoCatalog(page);

    await expect(page.getByTestId("empty-state")).toBeVisible();
    await expect(
      page.getByText("No volumes have been cataloged yet."),
    ).toBeVisible();
  });
});
