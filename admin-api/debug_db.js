import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: { images: true }
  });
  console.log('--- PRODUCTS START ---');
  console.log(JSON.stringify(products, null, 2));
  console.log('--- PRODUCTS END ---');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
