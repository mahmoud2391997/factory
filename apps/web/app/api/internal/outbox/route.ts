import {NextResponse,type NextRequest} from 'next/server'
import {timingSafeEqual,createHash} from 'node:crypto'
import {deliverNotificationOutbox} from '@/server/erp/store'
export const runtime = 'nodejs'
export async function POST(req:NextRequest){const key=process.env.NOTIFICATION_OUTBOX_SECRET||'',header=req.headers.get('authorization')||'';const hash=(v:string)=>createHash('sha256').update(v).digest();if(key.length<32||!timingSafeEqual(hash(header),hash('Bearer '+key)))return NextResponse.json({success:false},{status:403});await deliverNotificationOutbox();return NextResponse.json({success:true})}
