import { NextResponse } from 'next/server'
import { demoPreviewEnabled, demoPreviewUrl } from '@/server/demo-availability'
export const runtime = 'nodejs'
export async function GET() {
  const destination = demoPreviewUrl()
  if (!demoPreviewEnabled() || !destination) return NextResponse.json({error:'الديمو غير متاح'}, {status:404})
  return NextResponse.redirect(destination, {status:307,headers:{'Cache-Control':'no-store'}})
}
