import { NextResponse } from 'next/server'
import { demoPreviewEnabled, demoPreviewUrl } from '@/server/demo-availability'
export const runtime = 'nodejs'
export async function GET() {
  return NextResponse.json({ available: demoPreviewEnabled() && Boolean(demoPreviewUrl()) }, {headers:{'Cache-Control':'no-store'}})
}
