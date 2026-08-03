import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error("Database URI is not provided");
  }
  try {
    await mongoose.connect(mongodbUri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB: ", error);
    throw error;
  }
}
