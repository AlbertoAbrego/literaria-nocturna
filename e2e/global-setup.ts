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

const GENRES = [
  "Romance",
  "Thriller",
  "Fantasy",
  "Science Fiction",
  "Dystopia",
  "Historical Fiction",
  "Adventure",
  "Self Help",
  "Popular Science",
  "Horror",
  "Young Adult",
  "Children",
  "Health",
  "Sports",
  "Cooking",
] as const;

type Genre = (typeof GENRES)[number];

interface SeedBook {
  title: string;
  author: string;
  genre: Genre;
  synopsis: string;
}

const baseBooks: SeedBook[] = [
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

  await books.deleteMany({});
  console.log("[E2E Global Setup] Cleared books collection");

  await books.insertMany(baseBooks);
  console.log(`[E2E Global Setup] Seeded ${baseBooks.length} base books`);

  await client.close();
  console.log("[E2E Global Setup] Disconnected from MongoDB");
}
