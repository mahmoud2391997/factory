import type { PrismaClient } from '@prisma/client'

export function validateAttachmentId(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw new Error('INVALID_ATTACHMENT_ID')
}

// Parameterized SQL keeps this additive migration independent of the 17 unused
// model alternatives and works during rolling client generation. Missing table
// or database errors propagate: never fall back to temporary storage on writes.
export function databaseAttachmentStore(db: Pick<PrismaClient, '$executeRaw' | '$queryRaw'>) {
  return {
    async write(id: string, bytes: Uint8Array) {
      validateAttachmentId(id)
      if (bytes.byteLength > 10 * 1024 * 1024) throw new Error('ATTACHMENT_TOO_LARGE')
      await db.$executeRaw`INSERT INTO "PrivateAttachment" ("id", "bytes") VALUES (${id}, ${Buffer.from(bytes)})`
    },
    async read(id: string): Promise<Uint8Array | null> {
      validateAttachmentId(id)
      const rows = await db.$queryRaw<{ bytes: Uint8Array }[]>`SELECT "bytes" FROM "PrivateAttachment" WHERE "id" = ${id}`
      return rows[0] ? new Uint8Array(rows[0].bytes) : null
    },
    async remove(id: string) {
      validateAttachmentId(id)
      await db.$executeRaw`DELETE FROM "PrivateAttachment" WHERE "id" = ${id}`
    },
  }
}
