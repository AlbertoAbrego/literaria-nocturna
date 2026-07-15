import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes";
import bookRoutes from "./routes/book.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_, res) => {
  res.send("Literaria Nocturna API");
});

app.use("/api/health", healthRoutes);
app.use("/api/books", bookRoutes);

export default app;
