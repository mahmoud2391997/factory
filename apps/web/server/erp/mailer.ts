import type {ErpState} from '@/lib/erp/domain/types'
export async function configuredMailSender(){
 const host=process.env.SMTP_HOST?.trim(),from=process.env.SMTP_FROM?.trim()
 if(!host||!from)return null
 const nodemailer=await import('nodemailer')
 const transport=nodemailer.createTransport({host,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_SECURE==='true',requireTLS:process.env.NODE_ENV==='production'&&process.env.SMTP_SECURE!=='true',auth:process.env.SMTP_USER?{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}:undefined,connectionTimeout:10000,socketTimeout:15000})
 return async(message:{id:string;state:ErpState})=>{const item=message.state.notifications.find(n=>n.id===message.id);if(!item)throw Error('OUTBOX_MESSAGE_MISSING');const to=[...new Set(message.state.users.filter(u=>u.active&&item.roles.includes(u.role)).map(u=>u.email).concat(message.state.company.notifyEmail?[message.state.company.notifyEmail]:[]))];if(!to.length)throw Error('OUTBOX_RECIPIENT_MISSING');await transport.sendMail({from,to:to.join(','),messageId:'<factory-'+item.id+'@notifications.invalid>',subject:item.title,text:item.body+'\n\n'+message.state.company.nameAr})}
}
