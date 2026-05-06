import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  const items = await prisma.homeSectionItem.findMany({
    where: { isActive: true },
    include: { product: { include: { images: true, category: true } } },
    orderBy: { sortOrder: "asc" },
  });
  res.json(items);
});

router.put("/:type", async (req, res) => {
  const type = req.params.type.toUpperCase();
  const items = req.body.items ?? [];
  await prisma.homeSectionItem.deleteMany({ where: { type } });
  await prisma.homeSectionItem.createMany({
    data: items.map((item, index) => ({
      type,
      productId: item.productId,
      sortOrder: index,
      isActive: item.isActive ?? true,
    })),
  });
  res.json({ message: "Secao atualizada." });
});

export default router;
