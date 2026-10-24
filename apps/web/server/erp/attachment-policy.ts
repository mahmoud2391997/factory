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
    ar: 'تعذر حفظ المرفق في التخزين الخاص. تحقق من اتصال قاعدة البيانات وترحيل جدول المرفقات وصلاحياته ثم أعد المحاولة.',
    en: 'The attachment could not be saved to private storage. Check the database connection, attachment migration and permissions, then retry.',
    hi: 'अटैचमेंट निजी स्टोरेज में सहेजा नहीं जा सका। डेटाबेस कनेक्शन, अटैचमेंट माइग्रेशन और अनुमतियाँ जाँचें, फिर कोशिश करें।',
  }
  return messages[language]
}

export function attachmentDownloadUnavailableMessage(language: AttachmentLanguage) {
  const messages: Record<AttachmentLanguage, string> = {
    ar: 'سجل المرفق موجود، لكن تعذر قراءة ملفه من التخزين الخاص. تحقق من اتصال قاعدة البيانات وترحيل المرفقات وصلاحيات القراءة. إذا كان الملف مفقوداً، راجع النسخة الكاملة قبل الاستعادة.',
    en: 'The attachment record exists, but its file could not be read from private storage. Check the database connection, attachment migration and read permissions. If bytes are missing, review a full backup before restoring.',
    hi: 'अटैचमेंट का रिकॉर्ड मौजूद है, लेकिन निजी स्टोरेज से फ़ाइल नहीं पढ़ी जा सकी। डेटाबेस कनेक्शन, माइग्रेशन और पढ़ने की अनुमतियाँ जाँचें। फ़ाइल गायब हो तो पुनर्स्थापना से पहले पूर्ण बैकअप की जाँच करें।',
  }
  return messages[language]
}

export function backupUnavailableMessage(language: AttachmentLanguage) {
  const messages: Record<AttachmentLanguage, string> = {
    ar: 'تعذر تصدير بيانات النظام. لم يتم إنشاء ملف؛ تحقق من اتصال قاعدة البيانات ثم أعد المحاولة.',
    en: 'System data could not be exported. No file was created; check the database connection and try again.',
    hi: 'सिस्टम डेटा निर्यात नहीं हो सका। कोई फ़ाइल नहीं बनाई गई; डेटाबेस कनेक्शन जाँचें और फिर प्रयास करें।',
  }
  return messages[language]
}

export function backupDownloadNotice(language: AttachmentLanguage) {
  const messages: Record<AttachmentLanguage, string> = {
    ar: 'هذا تصدير JSON لبيانات النظام حسب صلاحياتك؛ لا يشمل ملفات المرفقات أو السجلات المؤرشفة، وليس نسخة استرجاع كاملة. النسخة الكاملة تتطلب نسخ قاعدة PostgreSQL بما فيها المرفقات والأرشيف، وأي ملفات قديمة، وحفظها خارج الاستضافة مع اختبار الاستعادة. تنزيل الملف لا يفعّل نسخاً دورياً أو خارجياً.',
    en: 'This JSON exports system data allowed by your permissions. It excludes attachment bytes and archived records and is not a full recovery backup. Full recovery requires a PostgreSQL backup including attachments and archives, any legacy files, off-host storage and a tested restore. Downloading does not enable scheduled or offsite backups.',
    hi: 'यह JSON आपकी अनुमतियों के अनुसार सिस्टम डेटा निर्यात करता है। इसमें अटैचमेंट फ़ाइलें और संग्रहित रिकॉर्ड शामिल नहीं हैं; यह पूर्ण रिकवरी बैकअप नहीं है। पूर्ण रिकवरी के लिए अटैचमेंट और अभिलेख सहित PostgreSQL बैकअप, पुरानी फ़ाइलें, होस्ट से बाहर सुरक्षित संग्रह और परीक्षित पुनर्स्थापना चाहिए। डाउनलोड करने से नियमित या ऑफसाइट बैकअप चालू नहीं होता।',
  }
  return messages[language]
}
