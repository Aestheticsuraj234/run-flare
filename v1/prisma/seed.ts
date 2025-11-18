import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
}).$extends(withAccelerate());

async function main() {
  console.log('🌱 Starting database seed...\n')

  // ============================================================
  // SEED STATUSES (Judge0 Compatible)
  // ============================================================
  console.log('📊 Seeding statuses...')
  
const statuses = [
  { id: 1, name: 'In Queue', description: 'In Queue' },
  { id: 2, name: 'Processing', description: 'Processing' },
  { id: 3, name: 'Accepted', description: 'Accepted' },
  { id: 4, name: 'Wrong Answer', description: 'Wrong Answer' },
  { id: 5, name: 'Time Limit Exceeded', description: 'Time Limit Exceeded' },
  { id: 6, name: 'Compilation Error', description: 'Compilation Error' },
  { id: 7, name: 'Runtime Error (SIGSEGV)', description: 'Runtime Error (SIGSEGV)' },
  { id: 8, name: 'Runtime Error (SIGXFSZ)', description: 'Runtime Error (SIGXFSZ)' },
  { id: 9, name: 'Runtime Error (SIGFPE)', description: 'Runtime Error (SIGFPE)' },
  { id: 10, name: 'Runtime Error (SIGABRT)', description: 'Runtime Error (SIGABRT)' },
  { id: 11, name: 'Runtime Error (NZEC)', description: 'Runtime Error (NZEC)' },
  { id: 12, name: 'Runtime Error (Other)', description: 'Runtime Error (Other)' },
  { id: 13, name: 'Internal Error', description: 'Internal Error' },
]

  for (const status of statuses) {
    await prisma.status.upsert({
      where: { id: status.id },
      update: {},
      create: status,
    })
  }
  
  console.log(`✅ Created ${statuses.length} statuses\n`)

  // ============================================================
  // SEED LANGUAGES
  // ============================================================
  console.log('🔤 Seeding languages...')
  
const languages = [
  {
    id: 1,
    name: 'JavaScript (Node.js 20)',
    compileCmd: null,
    runCmd: 'node /workspace/solution.js',
    sourceFile: 'solution.js',
  },
  {
    id: 2,
    name: 'TypeScript (5.3)',
    compileCmd: 'tsc /workspace/solution.ts --outDir /workspace',
    runCmd: 'node /workspace/solution.js',
    sourceFile: 'solution.ts',
  },
  {
    id: 3,
    name: 'Python (3.11)',
    compileCmd: null,
    runCmd: 'python3 /workspace/solution.py',
    sourceFile: 'solution.py',
  },
  {
    id: 4,
    name: 'Java (OpenJDK 17)',
    compileCmd: 'javac /workspace/Solution.java',
    runCmd: 'java -cp /workspace Solution',
    sourceFile: 'Solution.java',
  },
  {
    id: 5,
    name: 'C++ (GCC 11)',
    compileCmd: 'g++ -std=c++17 -O2 /workspace/solution.cpp -o /workspace/solution',
    runCmd: '/workspace/solution',
    sourceFile: 'solution.cpp',
  },
]

for (const language of languages) {
  await prisma.language.upsert({
    where: { id: language.id },  // Use id instead of name
    update: {},
    create: language,
  })
}

  for (const language of languages) {
    await prisma.language.upsert({
      where: { name: language.name },
      update: {},
      create: language,
    })
  }
  
  console.log(`✅ Created ${languages.length} languages\n`)

  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })