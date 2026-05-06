import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res) => {
  const data = await prisma.setting.findUnique({ where: { id: "global" } });
  res.json(data);
});

router.put("/", async (req, res) => {
  const data = await prisma.setting.upsert({
    where: { id: "global" },
    update: req.body,
    create: { id: "global", whatsappNumber: req.body.whatsappNumber ?? "5511999999999", ...req.body },
  });
  res.json(data);
});

export default router;
