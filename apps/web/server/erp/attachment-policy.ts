export type AttachmentLanguage = 'ar' | 'en' | 'hi'

const MB = 1024 * 1024

export function getAttachmentUploadLimits(isVercel: boolean) {
  return isVercel
    ? { maxFileBytes: 4 * MB, maxRequestBytes: 4.5 * MB }
    : { maxFileBytes: 10 * MB, maxRequestBytes: 11 * MB }
}

export function getAttachmentRequestLanguage(headers: Pick<Headers, 'get'>): AttachmentLanguage {
  const explicit = headers.get('x-erp-language')?.trim().toLowerCase()
  const accepted = headers.get('accept-language') ?? ''
  const candidates = [explicit, ...accepted.split(',').map((value) => value.split(';')[0]?.trim().toLowerCase())]
  for (const candidate of candidates) {
    if (candidate === 'ar' || candidate?.startsWith('ar-')) return 'ar'
    if (candidate === 'en' || candidate?.startsWith('en-')) return 'en'
    if (candidate === 'hi' || candidate?.startsWith('hi-')) return 'hi'
  }
  return 'ar'
}

export function attachmentTooLargeMessage(language: AttachmentLanguage, isVercel: boolean) {
  const maxMb = isVercel ? 4 : 10
  const messages: Record<AttachmentLanguage, string> = {
    ar: `الحد الأقصى لحجم المرفق ${maxMb} ميغابايت${isVercel ? ' على Vercel' : ''}. اختر ملفاً أصغر.`,
    en: `The maximum attachment size is ${maxMb} MB${isVercel ? ' on Vercel' : ''}. Choose a smaller file.`,
    hi: `अटैचमेंट का अधिकतम आकार ${maxMb} MB${isVercel ? ' Vercel पर' : ''} है। छोटी फ़ाइल चुनें।`,
  }
  return messages[language]
}

export function attachmentRequestTooLargeMessage(language: AttachmentLanguage) {
  const messages: Record<AttachmentLanguage, string> = {
    ar: 'يتجاوز طلب الرفع حد Vercel البالغ 4.5 ميغابايت. اختر ملفاً لا يتجاوز 4 ميغابايت.',
    en: 'The upload request exceeds Vercel’s 4.5 MB limit. Choose a file no larger than 4 MB.',
    hi: 'अपलोड अनुरोध Vercel की 4.5 MB सीमा से बड़ा है। 4 MB या उससे छोटी फ़ाइल चुनें।',
  }
  return messages[language]
}

export function attachmentStorageUnavailableMessage(language: AttachmentLanguage) {
  const messages: Record<AttachmentLanguage, string> = {
    ar: 'رفع المرفقات غير متاح على Vercel حالياً لأن ملفات النظام مؤقتة. لم يتم حفظ أي مرفق. اختر تخزيناً دائماً قبل تفعيل الرفع.',
    en: 'Attachment uploads are unavailable on Vercel because its filesystem is temporary. No attachment was saved. Configure durable storage before enabling uploads.',
    hi: 'Vercel पर अटैचमेंट अपलोड अभी उपलब्ध नहीं हैं क्योंकि इसका फ़ाइल सिस्टम अस्थायी है। कोई अटैचमेंट सहेजा नहीं गया। अपलोड चालू करने से पहले स्थायी स्टोरेज कॉन्फ़िगर करें।',
  }
  return messages[language]
}

export function attachmentDownloadUnavailableMessage(language: AttachmentLanguage) {
  const messages: Record<AttachmentLanguage, string> = {
    ar: 'سجل المرفق موجود، لكن ملفه غير متاح لأن ملفات Vercel مؤقتة. اضبط تخزيناً دائماً للمرفقات ثم أعد المحاولة.',
    en: 'The attachment record exists, but its file is unavailable because Vercel storage is temporary. Configure durable attachment storage and try again.',
    hi: 'अटैचमेंट का रिकॉर्ड मौजूद है, लेकिन Vercel का स्टोरेज अस्थायी होने के कारण फ़ाइल उपलब्ध नहीं है। स्थायी अटैचमेंट स्टोरेज कॉन्फ़िगर करके फिर प्रयास करें।',
  }
  return messages[language]
}
