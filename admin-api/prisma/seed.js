import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@lumiere.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@lumiere.com",
      passwordHash,
      role: "OWNER",
    },
  });

  const categories = [
    { name: "Pele", slug: "pele", sortOrder: 1 },
    { name: "Olhos", slug: "olhos", sortOrder: 2 },
    { name: "Labios", slug: "labios", sortOrder: 3 },
    { name: "Skincare", slug: "skincare", sortOrder: 4 },
    { name: "Kits", slug: "kits", sortOrder: 5 },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  await prisma.setting.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      whatsappNumber: "5511999999999",
      shippingText: "Entregamos para todo Brasil",
      installmentsText: "Parcele em ate 6x",
      supportText: "Atendimento humanizado",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
