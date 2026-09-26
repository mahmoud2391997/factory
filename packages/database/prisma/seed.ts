import { PrismaClient } from '../generated/client'

const prisma = new PrismaClient()

async function main() {
  void prisma
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err)
    await prisma.$disconnect()
    process.exit(1)
  })

