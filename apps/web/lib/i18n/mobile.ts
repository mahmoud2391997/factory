import type { Language } from './translations'

const messages = {
  install: ['تثبيت التطبيق', 'Install app', 'ऐप इंस्टॉल करें'],
  installHelp: ['في iPhone: افتح التطبيق في Safari، ثم مشاركة ← إضافة إلى الشاشة الرئيسية. في Android: استخدم تثبيت التطبيق من قائمة المتصفح.', 'On iPhone, open in Safari, then Share → Add to Home Screen. On Android, use Install app from the browser menu.', 'iPhone पर Safari में खोलें, फिर शेयर → होम स्क्रीन पर जोड़ें। Android पर ब्राउज़र मेनू से ऐप इंस्टॉल करें।'],
  close: ['إغلاق', 'Close', 'बंद करें'],
  camera: ['مسح بالكاميرا', 'Scan with camera', 'कैमरे से स्कैन करें'],
  stop: ['إيقاف الكاميرا', 'Stop camera', 'कैमरा बंद करें'],
  starting: ['جارٍ تشغيل الكاميرا…', 'Starting camera…', 'कैमरा शुरू हो रहा है…'],
  aim: ['وجّه الكاميرا إلى الباركود مع إضاءة جيدة. تتم القراءة والبحث تلقائياً.', 'Point the camera at the barcode in good light. Reading and lookup happen automatically.', 'अच्छी रोशनी में कैमरे को बारकोड की ओर रखें। स्कैन और खोज अपने आप होगी।'],
  selectCamera: ['الكاميرا', 'Camera', 'कैमरा'],
  cameraNumber: ['كاميرا', 'Camera', 'कैमरा'],
  secure: ['الكاميرا تتطلب رابط HTTPS. على الهاتف استخدم رابط Vercel الآمن، وليس عنوان الشبكة المحلي عبر HTTP.', 'Camera access requires HTTPS. On your phone, use the secure Vercel URL rather than a local network HTTP address.', 'कैमरे के लिए HTTPS आवश्यक है। फ़ोन पर स्थानीय HTTP पते के बजाय सुरक्षित Vercel URL इस्तेमाल करें।'],
  unsupported: ['هذا المتصفح لا يدعم الكاميرا. افتح التطبيق في Safari أو Chrome، أو أدخل الكود يدوياً.', 'This browser cannot access the camera. Open in Safari or Chrome, or enter the code manually.', 'यह ब्राउज़र कैमरा नहीं खोल सकता। Safari या Chrome में खोलें या कोड स्वयं दर्ज करें।'],
  denied: ['تم رفض إذن الكاميرا. اسمح بالكاميرا من إعدادات الموقع ثم حاول مجدداً.', 'Camera permission was denied. Allow camera access in site settings and try again.', 'कैमरे की अनुमति नहीं मिली। साइट सेटिंग में कैमरे की अनुमति दें और फिर कोशिश करें।'],
  missing: ['لا توجد كاميرا متاحة على هذا الجهاز.', 'No camera is available on this device.', 'इस डिवाइस पर कैमरा उपलब्ध नहीं है।'],
  busy: ['تعذر تشغيل الكاميرا. أغلق التطبيقات التي تستخدمها ثم حاول مجدداً.', 'Could not start the camera. Close other apps using it and try again.', 'कैमरा शुरू नहीं हो सका। कैमरा इस्तेमाल करने वाले अन्य ऐप बंद करके फिर कोशिश करें।'],
  failed: ['تعذر تشغيل الماسح. حاول مجدداً أو أدخل الكود يدوياً.', 'Could not start the scanner. Try again or enter the code manually.', 'स्कैनर शुरू नहीं हो सका। फिर कोशिश करें या कोड स्वयं दर्ज करें।'],
  code: ['الباركود', 'Barcode', 'बारकोड'],
  hint: ['امسح بكاميرا الهاتف، أو استخدم قارئ USB، أو أدخل الكود يدوياً.', 'Scan with your phone camera, use a USB scanner, or enter the code manually.', 'फ़ोन के कैमरे या USB स्कैनर से स्कैन करें या कोड स्वयं दर्ज करें।'],
} as const

export function mobileText(language: Language, key: keyof typeof messages) {
  return messages[key][language === 'ar' ? 0 : language === 'hi' ? 2 : 1]
}
