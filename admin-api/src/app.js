import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import productsRoutes from "./routes/products.routes.js";
import homeSectionsRoutes from "./routes/home-sections.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import publicRoutes from "./routes/public.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "lumiere-api" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/public", publicRoutes);

app.use("/admin/categories", requireAuth, categoriesRoutes);
app.use("/admin/products", requireAuth, productsRoutes);
app.use("/admin/home-sections", requireAuth, homeSectionsRoutes);
app.use("/admin/settings", requireAuth, settingsRoutes);
app.use("/admin/upload", requireAuth, uploadRoutes);

export default app;
