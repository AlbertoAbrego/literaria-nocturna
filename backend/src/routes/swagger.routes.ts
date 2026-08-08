import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "../config/swagger";

const router = Router();

// Expose the raw OpenAPI document as JSON. swagger-ui-express only serves the HTML
// bundle on its mount path, so this route provides the machine-readable spec.
router.get("/docs/swagger.json", (_req, res) => {
  res.json(swaggerSpec);
});

router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default router;