import { prisma } from "../lib/db";

export class LanguageRepository {
  async findAll() {
    return prisma.language.findMany({
      select: { id: true, name: true },
      orderBy: { id: "asc" },
      cacheStrategy: { ttl: 60, swr: 300 },
    });
  }

  async findById(id: number) {
    return prisma.language.findUnique({ where: { id } });
  }
}

