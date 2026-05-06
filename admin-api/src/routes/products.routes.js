import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (req, res) => {
  const { search = "", categoryId } = req.query;
  const data = await prisma.product.findMany({
    where: {
      name: { contains: String(search), mode: "insensitive" },
      ...(categoryId ? { categoryId: String(categoryId) } : {}),
    },
    include: { images: true, category: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(data);
});

router.get("/:id", async (req, res) => {
  const data = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { images: true, category: true },
  });
  if (!data) return res.status(404).json({ message: "Produto nao encontrado." });
  res.json(data);
});

router.post("/", async (req, res) => {
  const payload = req.body;
  const images = payload.images ?? [];
  const data = await prisma.product.create({
    data: {
      ...payload,
      price: Number(payload.price),
      promoPrice: payload.promoPrice ? Number(payload.promoPrice) : null,
      images: { create: images },
    },
    include: { images: true },
  });
  res.status(201).json(data);
});

router.put("/:id", async (req, res) => {
  const payload = req.body;
  const images = payload.images ?? [];
  await prisma.productImage.deleteMany({ where: { productId: req.params.id } });
  const data = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...payload,
      price: Number(payload.price),
      promoPrice: payload.promoPrice ? Number(payload.promoPrice) : null,
      images: { create: images },
    },
    include: { images: true },
  });
  res.json(data);
});

router.delete("/:id", async (req, res) => {
  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
