import express from "express";
import helmet from "helmet";
import cors from "cors";
import { corsOptions } from "./config/cors";
import { globalLimiter, healthLimiter } from "./middleware/rate-limit";
import healthRoutes from "./routes/health.routes";
import bookRoutes from "./routes/book.routes";
import swaggerRoutes from "./routes/swagger.routes";
import { errorHandler } from "./middleware/error.middleware";

const bodyLimit = process.env.REQUEST_BODY_LIMIT || "1mb";

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(express.json({ limit: bodyLimit }));

app.get("/", (_, res) => {
  res.send("Literaria Nocturna API");
});

app.use("/api/health", healthLimiter, healthRoutes);
app.use("/api/books", bookRoutes);
app.use("/api", swaggerRoutes);

app.use(errorHandler);

export default app;
