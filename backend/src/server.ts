import dotenv from "dotenv";
import app from "./app";
import { connectDatabase } from "./config/database";

dotenv.config();
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor", error);
    process.exit(1);
  }
}

startServer();
