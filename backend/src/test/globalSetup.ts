import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { MongoMemoryServer } from "mongodb-memory-server";

export const globalConfigPath = path.join(
  os.tmpdir(),
  "literaria-nocturna-jest-global-config.json",
);

export default async function globalSetup(): Promise<void> {
  const mongod = await MongoMemoryServer.create();
  const config = { MONGODB_URI: mongod.getUri() };

  fs.writeFileSync(globalConfigPath, JSON.stringify(config));

  process.env.MONGODB_URI = config.MONGODB_URI;
  (globalThis as { __MONGOD__?: MongoMemoryServer }).__MONGOD__ = mongod;
}
