import { PrismaClient } from "@prisma/client";

let prismaInstance;

function getPrisma() {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL },
      },
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

    // Falha rapida se DATABASE_URL nao estiver configurada
    if (!process.env.DATABASE_URL) {
      console.error("[prisma] DATABASE_URL nao definida. Verifique as variaveis de ambiente no Vercel.");
    }
  }
  return prismaInstance;
}

export const prisma = new Proxy(
  {},
  {
    get(_target, prop) {
      const client = getPrisma();
      const value = client[prop];
      return typeof value === "function" ? value.bind(client) : value;
    },
  },
);
