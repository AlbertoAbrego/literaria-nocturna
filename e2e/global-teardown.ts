import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";

function loadEnvFile(filePath: string): Record<string, string> {
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

export default async function globalTeardown(): Promise<void> {
  const env = loadEnvFile(resolve("backend/.env"));
  const mongodbUri = env.MONGODB_URI;
  if (!mongodbUri) {
    return;
  }

  const client = new MongoClient(mongodbUri);
  await client.connect();

  const db = client.db();
  await db.collection("books").deleteMany({});
  console.log("[E2E Global Teardown] Cleared books collection");

  await client.close();
}
