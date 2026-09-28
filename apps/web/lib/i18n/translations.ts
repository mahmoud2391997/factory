export type Language = 'ar' | 'en' | 'hi'

export const translations = {
  ar: {
    // Navigation
    dashboard: 'لوحة التحكم',
    inventory: 'المخزون',
    purchasing: 'المشتريات',
    production: 'الإنتاج',
    sales: 'المبيعات',
    accounting: 'المحاسبة',
    hr: 'الموارد البشرية',
    quality: 'الجودة',
    fleet: 'الأسطول',
    reports: 'التقارير',
    settings: 'الإعدادات',
    
    // Common
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    view: 'عرض',
    add: 'إضافة',
    search: 'بحث',
    filter: 'تصفية',
    export: 'تصدير',
    print: 'طباعة',
    
    // Status
    active: 'نشط',
    inactive: 'غير نشط',
    pending: 'قيد الانتظار',
    approved: 'معتمد',
    rejected: 'مرفوض',
    completed: 'مكتمل',
    
    // Numbers
    quantity: 'الكمية',
    amount: 'المبلغ',
    price: 'السعر',
    cost: 'التكلفة',
    total: 'الإجمالي',
    
    // Dates
    date: 'التاريخ',
    from: 'من',
    to: 'إلى',
    today: 'اليوم',
    yesterday: 'أمس',
    
    // People
    customer: 'العميل',
    supplier: 'المورد',
    employee: 'الموظف',
    driver: 'السائق',
    
    // New features
    spareParts: 'قطع الغيار',
    packaging: 'التعبئة',
    distribution: 'التوزيع',
    maintenance: 'الصيانة',
    utilities: 'المرافق',
    bank: 'البنك',
    recipes: 'الخلطات',
    nutrition: 'التغذية',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    inventory: 'Inventory',
    purchasing: 'Purchasing',
    production: 'Production',
    sales: 'Sales',
    accounting: 'Accounting',
    hr: 'HR',
    quality: 'Quality',
    fleet: 'Fleet',
    reports: 'Reports',
    settings: 'Settings',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    print: 'Print',
    
    // Status
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Completed',
    
    // Numbers
    quantity: 'Quantity',
    amount: 'Amount',
    price: 'Price',
    cost: 'Cost',
    total: 'Total',
    
    // Dates
    date: 'Date',
    from: 'From',
    to: 'To',
    today: 'Today',
    yesterday: 'Yesterday',
    
    // People
    customer: 'Customer',
    supplier: 'Supplier',
    employee: 'Employee',
    driver: 'Driver',
    
    // New features
    spareParts: 'Spare Parts',
    packaging: 'Packaging',
    distribution: 'Distribution',
    maintenance: 'Maintenance',
    utilities: 'Utilities',
    bank: 'Bank',
    recipes: 'Recipes',
    nutrition: 'Nutrition',
  },
  hi: {
    // Navigation
    dashboard: 'डैशबोर्ड',
    inventory: 'इन्वेंटरी',
    purchasing: 'खरीद',
    production: 'उत्पादन',
    sales: 'बिक्री',
    accounting: 'लेखांकन',
    hr: 'मानव संसाधन',
    quality: 'गुणवत्ता',
    fleet: 'बेड़ा',
    reports: 'रिपोर्ट',
    settings: 'सेटिंग्स',
    
    // Common
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    view: 'देखें',
    add: 'जोड़ें',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    export: 'निर्यात',
    print: 'प्रिंट',
    
    // Status
    active: 'सक्रिय',
    inactive: 'निष्क्रिय',
    pending: 'लंबित',
    approved: 'स्वीकृत',
    rejected: 'अस्वीकृत',
    completed: 'पूर्ण',
    
    // Numbers
    quantity: 'मात्रा',
    amount: 'राशि',
    price: 'मूल्य',
    cost: 'लागत',
    total: 'कुल',
    
    // Dates
    date: 'दिनांक',
    from: 'से',
    to: 'तक',
    today: 'आज',
    yesterday: 'कल',
    
    // People
    customer: 'ग्राहक',
    supplier: 'आपूर्तिकर्ता',
    employee: 'कर्मचारी',
    driver: 'चालक',
    
    // New features
    spareParts: 'स्पेयर पार्ट्स',
    packaging: 'पैकेजिंग',
    distribution: 'वितरण',
    maintenance: 'रखरखाव',
    utilities: 'उपयोगिताएं',
    bank: 'बैंक',
    recipes: 'रेसिपी',
    nutrition: 'पोषण',
  },
} as const

export type TranslationKey = keyof typeof translations.ar

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang][key] || translations.en[key] || key
}

export function getSupportedLanguages(): Array<{ code: Language; name: string }> {
  return [
    { code: 'ar', name: 'العربية' },
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिंदी' },
  ]
}
