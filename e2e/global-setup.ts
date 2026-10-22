import { resolve } from "node:path";
import { writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";
import { getApiBaseURL, getBaseURL } from "./helpers/config";
import { isStagingE2E, loadEnvFile } from "./helpers/env";

export const RUN_ID_PATH = resolve(".e2e-run-id");

// Story 42 phase 1: Render cold starts can take 30-60s on the first request,
// which would otherwise surface as a timeout in the first test. Warm both
// deployed endpoints first. Deliberately frugal - the staging API allows 100
// requests / 15 minutes, so a healthy warm-up costs exactly 2 requests and
// failures stop early instead of burning the window.
const WARMUP_ATTEMPTS = 3;
const WARMUP_TIMEOUT_MS = 60_000;
const WARMUP_RETRY_DELAY_MS = 5_000;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolveDelay) => setTimeout(resolveDelay, ms));

async function warmUpStagingEndpoint(name: string, url: string): Promise<void> {
  let lastFailure = "not attempted";
  let terminal = false;

  for (let attempt = 1; attempt <= WARMUP_ATTEMPTS; attempt++) {
    const startedAt = Date.now();
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(WARMUP_TIMEOUT_MS),
      });
      if (response.ok) {
        console.log(
          `[E2E Global Setup] Warm-up ${name} OK (${url}) in ${Date.now() - startedAt}ms`,
        );
        return;
      }
      lastFailure = `HTTP ${response.status}`;
      // Waiting a few seconds will not clear an exhausted rate-limit window;
      // stop and tell the operator to wait for ratelimit-reset instead.
      terminal = response.status === 429;
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error);
    }

    console.warn(
      `[E2E Global Setup] Warm-up ${name} attempt ${attempt}/${WARMUP_ATTEMPTS} failed: ${lastFailure}`,
    );
    if (terminal || attempt === WARMUP_ATTEMPTS) break;
    await sleep(WARMUP_RETRY_DELAY_MS);
  }

  throw new Error(
    `Staging warm-up failed for ${name} (${url}): ${lastFailure}. ` +
      "A sleeping staging service needs ~30-60s to wake (retry once it is " +
      "up); HTTP 429 means the 100 requests / 15 minutes window is " +
      "exhausted - wait for ratelimit-reset and re-run.",
  );
}

async function warmUpStaging(): Promise<void> {
  const startedAt = Date.now();
  console.log("[E2E Global Setup] Warming up staging services...");
  await warmUpStagingEndpoint("API", `${getApiBaseURL()}/api/health`);
  await warmUpStagingEndpoint("frontend", getBaseURL());
  console.log(
    `[E2E Global Setup] Staging warm-up complete in ${Date.now() - startedAt}ms`,
  );
}

export const SEED_BOOKS = [
  {
    title: "The Emerald Crown",
    author: "Brandon Sanderson",
    genre: "Fantasy",
    synopsis: "A kingdom seeks a magical crown hidden beneath ancient ruins.",
  },
  {
    title: "Moonlit Kingdom",
    author: "Robin Hobb",
    genre: "Fantasy",
    synopsis: "A forgotten princess returns to reclaim her enchanted homeland.",
  },
  {
    title: "The Crystal River",
    author: "Patrick Rothfuss",
    genre: "Fantasy",
    synopsis: "A wandering storyteller discovers a river that reveals destiny.",
  },
  {
    title: "The Golden Labyrinth",
    author: "Ursula K. Le Guin",
    genre: "Fantasy",
    synopsis: "Explorers enter a maze that changes with every memory.",
  },
  {
    title: "The Red House",
    author: "Stephen King",
    genre: "Horror",
    synopsis:
      "A family moves into a house that remembers every previous owner.",
  },
  {
    title: "Midnight Harvest",
    author: "Stephen King",
    genre: "Horror",
    synopsis: "A small town celebrates a festival that demands a sacrifice.",
  },
  {
    title: "Black Cathedral",
    author: "Shirley Jackson",
    genre: "Horror",
    synopsis: "A decaying cathedral awakens during a solar eclipse.",
  },
  {
    title: "The Bone Garden",
    author: "Clive Barker",
    genre: "Horror",
    synopsis: "A hidden garden grows flowers from human bones.",
  },
  {
    title: "Orbit Zero",
    author: "Isaac Asimov",
    genre: "Science Fiction",
    synopsis: "A stranded station orbits a dying star.",
  },
  {
    title: "The Quantum Gate",
    author: "Isaac Asimov",
    genre: "Science Fiction",
    synopsis: "Scientists discover a gateway that bends causality.",
  },
  {
    title: "Solar Drift",
    author: "Arthur C. Clarke",
    genre: "Science Fiction",
    synopsis: "A generation ship loses contact with Earth.",
  },
  {
    title: "The Silent Witness",
    author: "Agatha Christie",
    genre: "Thriller",
    synopsis: "A witness disappears before a crucial trial.",
  },
  {
    title: "Dark Protocol",
    author: "Gillian Flynn",
    genre: "Thriller",
    synopsis: "A cybersecurity breach exposes dangerous government secrets.",
  },
  {
    title: "Summer in Florence",
    author: "Nicholas Sparks",
    genre: "Romance",
    synopsis: "Two strangers meet during a summer abroad.",
  },
  {
    title: "Winter Hearts",
    author: "Jojo Moyes",
    genre: "Romance",
    synopsis: "A chance encounter during winter changes two lives forever.",
  },
];

export default async function globalSetup(): Promise<void> {
  const runId = randomBytes(4).toString("hex");
  process.env.E2E_RUN_ID = runId;
  writeFileSync(RUN_ID_PATH, runId);
  console.log(`[E2E Global Setup] Run ID: ${runId}`);

  // Story 42: staging runs never touch a database directly. The deployed
  // environment is validated through its API and UI only; seeding is a local
  // convenience (tests create their own run-scoped data and do not depend on
  // the reference titles), and backend/.env on a dev machine points at the
  // development database — writing there during a staging run would be wrong.
  if (isStagingE2E()) {
    console.log(
      "[E2E Global Setup] Staging mode: skipping MongoDB seeding (API-only)",
    );
    await warmUpStaging();
    return;
  }

  const env = loadEnvFile(resolve("backend/.env"));
  const mongodbUri = env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error(
      "MONGODB_URI environment variable is required. " +
        "Configure it in backend/.env.",
    );
  }

  const client = new MongoClient(mongodbUri);
  await client.connect();
  console.log("[E2E Global Setup] Connected to MongoDB");

  const db = client.db();
  const books = db.collection("books");

  const existingCount = await books.countDocuments({
    title: { $in: SEED_BOOKS.map((b) => b.title) },
  });

  if (existingCount < SEED_BOOKS.length) {
    await books.deleteMany({ title: { $in: SEED_BOOKS.map((b) => b.title) } });
    await books.insertMany(SEED_BOOKS);
    console.log(
      `[E2E Global Setup] Seeded ${SEED_BOOKS.length} reference books`,
    );
  } else {
    console.log("[E2E Global Setup] Reference books already present");
  }

  await client.close();
  console.log("[E2E Global Setup] Disconnected from MongoDB");
}
