import { prisma } from "../lib/db";

export class StatusRepository {
  async findAll() {
    return prisma.status.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { id: "asc" },
      cacheStrategy: { ttl: 60, swr: 300 },
    });
  }
}

