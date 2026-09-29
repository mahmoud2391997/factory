import type { CompanyDocumentAttachment } from './types'

export const MAX_DOCUMENT_ATTACHMENT_BYTES = 10 * 1024 * 1024

export function inspectDocumentAttachment(fileName: string, bytes: Uint8Array) {
  const safeName = fileName
    .replaceAll('\\', '/')
    .split('/')
    .pop()!
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 160)
  if (!safeName) return { ok: false as const, error: 'اسم الملف غير صحيح' }
  if (bytes.length < 1 || bytes.length > MAX_DOCUMENT_ATTACHMENT_BYTES) {
    return { ok: false as const, error: 'يجب أن يكون حجم الملف بين 1 بايت و10 ميغابايت' }
  }

  const mediaType: CompanyDocumentAttachment['mediaType'] | null =
    bytes.length >= 5 && new TextDecoder().decode(bytes.subarray(0, 5)) === '%PDF-'
      ? 'application/pdf'
      : bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
        ? 'image/jpeg'
        : bytes.length >= 8 &&
            bytes[0] === 0x89 &&
            bytes[1] === 0x50 &&
            bytes[2] === 0x4e &&
            bytes[3] === 0x47 &&
            bytes[4] === 0x0d &&
            bytes[5] === 0x0a &&
            bytes[6] === 0x1a &&
            bytes[7] === 0x0a
          ? 'image/png'
          : null
  const extension = safeName.split('.').pop()?.toLocaleLowerCase()
  const matchesExtension =
    (mediaType === 'application/pdf' && extension === 'pdf') ||
    (mediaType === 'image/png' && extension === 'png') ||
    (mediaType === 'image/jpeg' && (extension === 'jpg' || extension === 'jpeg'))
  if (!mediaType || !matchesExtension) return { ok: false as const, error: 'محتوى الملف أو امتداده غير مدعوم' }
  return { ok: true as const, fileName: safeName, mediaType }
}
