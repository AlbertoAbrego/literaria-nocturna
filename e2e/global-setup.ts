import { resolve } from "node:path";
import { writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";
import { loadEnvFile } from "./helpers/env";

export const RUN_ID_PATH = resolve(".e2e-run-id");

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
    console.log(`[E2E Global Setup] Seeded ${SEED_BOOKS.length} reference books`);
  } else {
    console.log("[E2E Global Setup] Reference books already present");
  }

  await client.close();
  console.log("[E2E Global Setup] Disconnected from MongoDB");
}
