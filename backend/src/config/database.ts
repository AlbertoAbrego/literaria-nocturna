import mongoose from "mongoose";

export async function connectDatabase(): Promise<void> {
  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error("URI de conexión no proporcionada");
  }
  try {
    await mongoose.connect(mongodbUri);
    console.log("Conectado a MongoDB");
  } catch (error) {
    console.error("Error de conexión a MongoDB: ", error);
    throw error;
  }
}
