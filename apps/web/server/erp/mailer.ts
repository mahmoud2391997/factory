import type { ErpState } from '@/lib/erp/domain/types'

export async function deliverPendingEmails(state: ErpState) {
  const pending = state.notifications.filter((item) => item.emailStatus === 'pending')
  if (pending.length === 0) return false

  const host = process.env.SMTP_HOST?.trim()
  if (!host) {
    for (const item of pending) item.emailStatus = 'skipped'
    return true
  }

  try {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
    for (const item of pending) {
      const recipients = state.users
        .filter((user) => user.active && item.roles.includes(user.role))
        .map((user) => user.email)
      if (state.company.notifyEmail) recipients.push(state.company.notifyEmail)
      const to = [...new Set(recipients)]
      if (to.length === 0) {
        item.emailStatus = 'skipped'
        continue
      }
      await transporter.sendMail({
        from: process.env.SMTP_FROM || state.company.email,
        to: to.join(','),
        subject: item.title,
        text: `${item.body}\n\n${state.company.nameAr}`,
      })
      item.emailStatus = 'sent'
    }
  } catch (error) {
    console.error('[erp/mail]', error)
    for (const item of pending) {
      if (item.emailStatus === 'pending') item.emailStatus = 'skipped'
    }
  }
  return true
}
