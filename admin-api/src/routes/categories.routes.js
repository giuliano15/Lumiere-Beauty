import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  const data = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  res.json(data);
});

router.post("/", async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
    description: z.string().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Payload invalido." });

  const data = await prisma.category.create({ data: parsed.data });
  res.status(201).json(data);
});

router.put("/:id", async (req, res) => {
  const data = await prisma.category.update({ where: { id: req.params.id }, data: req.body });
  res.json(data);
});

router.delete("/:id", async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
