import { timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

export const scaleReadingSchema = z.object({
  eventId: z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/),
  scaleId: z.string().trim().min(1).max(100),
  productionOrderId: z.string().trim().min(1).max(100),
  materialId: z.string().trim().min(1).max(100),
  actualQty: z.number().finite().nonnegative(),
})

export type ScaleReadingPayload = z.infer<typeof scaleReadingSchema>

export function isScaleBearerAuthorized(authorization: string | null, configuredToken: string) {
  if (!authorization?.startsWith('Bearer ')) return false
  const presented = Buffer.from(authorization.slice('Bearer '.length), 'utf8')
  const expected = Buffer.from(configuredToken, 'utf8')
  return presented.length === expected.length && timingSafeEqual(presented, expected)
}
