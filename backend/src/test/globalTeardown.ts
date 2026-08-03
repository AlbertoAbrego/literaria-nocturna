export default async function globalTeardown(): Promise<void> {
  const mongod = (globalThis as { __MONGOD__?: { stop(): Promise<void> } }).__MONGOD__;

  if (mongod) {
    await mongod.stop();
  }
}
