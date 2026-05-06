import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/categories", async (_req, res) => {
  const data = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  res.json(data);
});

router.get("/products", async (req, res) => {
  const { category, search = "" } = req.query;
  const data = await prisma.product.findMany({
    where: {
      isActive: true,
      name: { contains: String(search), mode: "insensitive" },
      ...(category
        ? { category: { slug: String(category), isActive: true } }
        : {}),
    },
    include: { images: true, category: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(data);
});

router.get("/products/:slug", async (req, res) => {
  const data = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: { images: true, category: true },
  });
  if (!data) return res.status(404).json({ message: "Produto nao encontrado." });
  res.json(data);
});

router.get("/settings", async (_req, res) => {
  const data = await prisma.setting.findUnique({ where: { id: "global" } });
  res.json(data);
});

router.get("/home", async (_req, res) => {
  const items = await prisma.homeSectionItem.findMany({
    where: { isActive: true },
    include: { product: { include: { images: true, category: true } } },
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
  });

  const grouped = {
    hero: [],
    live: [],
    lancamentos: [],
    destaques: [],
  };

  items.forEach((item) => {
    const key = item.type.toLowerCase();
    if (grouped[key]) grouped[key].push(item.product);
  });

  res.json(grouped);
});

export default router;
