export type Language = 'ar' | 'en' | 'hi'

export const translations = {
  ar: {
    // Navigation
    dashboard: 'لوحة التحكم',
    home: 'الرئيسية',
    tasks: 'التقارير والمتابعة',
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

    // Costing & profitability
    profitability: 'تحليل الربحية',
    costBasis: 'أساس التكلفة',
    basisActual: 'فعلي',
    basisEstimated: 'تقديري',
    basisManual: 'يدوي',
    costRecalculation: 'إعادة حساب تكلفة الشهر',
    recalculate: 'إعادة الحساب',
    marginValue: 'قيمة الهامش',
    marginPct: 'نسبة الهامش',
    costPerTon: 'تكلفة/طن',
    salePricePerTon: 'سعر البيع/طن',
    source: 'المصدر',
    month: 'الشهر',

    // Variance report
    varianceReport: 'تحليل الانحراف',
    expectedOutput: 'المتوقع',
    actualOutput: 'الفعلي',
    varianceKg: 'الانحراف (كجم)',
    variancePct: 'نسبة الانحراف',
    groupBy: 'التجميع حسب',
    product: 'المنتج',
    shift: 'الوردية',
    operator: 'المشغّل',
    machine: 'الخط/الآلة',

    // Shell
    welcome: 'مرحباً',
    notifications: 'الإشعارات',
    language: 'اللغة',
  },
  en: {
    // Navigation
    dashboard: 'Dashboard',
    home: 'Home',
    tasks: 'Reports & Follow-up',
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

    // Costing & profitability
    profitability: 'Profitability',
    costBasis: 'Cost basis',
    basisActual: 'Actual',
    basisEstimated: 'Estimated',
    basisManual: 'Manual',
    costRecalculation: 'Month-close cost recalculation',
    recalculate: 'Recalculate',
    marginValue: 'Margin value',
    marginPct: 'Margin %',
    costPerTon: 'Cost/ton',
    salePricePerTon: 'Sale price/ton',
    source: 'Source',
    month: 'Month',

    // Variance report
    varianceReport: 'Variance analysis',
    expectedOutput: 'Expected',
    actualOutput: 'Actual',
    varianceKg: 'Variance (kg)',
    variancePct: 'Variance %',
    groupBy: 'Group by',
    product: 'Product',
    shift: 'Shift',
    operator: 'Operator',
    machine: 'Line/machine',

    // Shell
    welcome: 'Welcome',
    notifications: 'Notifications',
    language: 'Language',
  },
  hi: {
    // Navigation
    dashboard: 'डैशबोर्ड',
    home: 'होम',
    tasks: 'रिपोर्ट और अनुसरण',
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

    // Costing & profitability
    profitability: 'लाभप्रदता',
    costBasis: 'लागत आधार',
    basisActual: 'वास्तविक',
    basisEstimated: 'अनुमानित',
    basisManual: 'मैनुअल',
    costRecalculation: 'माह-समापन लागत पुनर्गणना',
    recalculate: 'पुनर्गणना',
    marginValue: 'मार्जिन मूल्य',
    marginPct: 'मार्जिन %',
    costPerTon: 'लागत/टन',
    salePricePerTon: 'विक्रय मूल्य/टन',
    source: 'स्रोत',
    month: 'महीना',

    // Variance report
    varianceReport: 'विचलन विश्लेषण',
    expectedOutput: 'अपेक्षित',
    actualOutput: 'वास्तविक',
    varianceKg: 'विचलन (किग्रा)',
    variancePct: 'विचलन %',
    groupBy: 'समूहीकरण',
    product: 'उत्पाद',
    shift: 'शिफ्ट',
    operator: 'ऑपरेटर',
    machine: 'लाइन/मशीन',

    // Shell
    welcome: 'स्वागत है',
    notifications: 'सूचनाएं',
    language: 'भाषा',
  },
} as const

export type TranslationKey = keyof typeof translations.ar

/** Maps sidebar destination ids to translation keys. */
export const DESTINATION_KEYS: Record<string, TranslationKey> = {
  home: 'home',
  inventory: 'inventory',
  production: 'production',
  sales: 'sales',
  accounting: 'accounting',
  fleet: 'fleet',
  hr: 'hr',
  tasks: 'tasks',
  settings: 'settings',
}

export function destinationLabel(lang: Language, id: string, fallback: string): string {
  const key = DESTINATION_KEYS[id]
  return key ? t(lang, key) : fallback
}

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
