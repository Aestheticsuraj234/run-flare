import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate());

async function main() {
    const java = await prisma.language.findUnique({
        where: { id: 4 },
    });
    console.log(JSON.stringify(java, null, 2));
}

main().finally(() => prisma.$disconnect());
