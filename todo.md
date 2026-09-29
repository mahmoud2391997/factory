# خطة إغلاق متطلبات المالك — نظام ERP مصنع الأعلاف

## Phase 1 — التكلفة الحقيقية (أولوية قصوى)
- [x] مراجعة costing.ts + engine.ts (الأسطر ~275، ~2350) + types.ts + migrate.ts.
- [x] Utilities: توزيع فعلي من UtilitiesReading (كهرباء/ماء/غاز) ÷ طن شهري، fallback إلى costRates مع وسم estimated.
- [x] Labor: توزيع الرواتب المعتمدة + الإضافي على أطنان الشهر (أو ساعات الحضور)، أساس قابل للضبط (per ton / per hour).
- [x] Maintenance: توزيع MaintenanceRecord + SparePartUsage حسب الآلة على دفع الإنتاج في الفترة.
- [x] Transport: استبدال النسب الثابتة بتوزيع فعلي (تكلفة الرحلة ÷ الحمولة الفعلية) على الفواتير/العملاء.
- [x] Bags/Packaging: استخدام PackagingConsumption الفعلي.
- [ ] CostLine: إضافة basis (ACTUAL/ESTIMATED/MANUAL) + source، وإظهار الشارة في عرض تكلفة الدفعة.
- [ ] snapshot عند إتمام الدفعة + أمر "إعادة الحساب عند إغلاق الشهر" (GM فقط، مُدقّق).
- [ ] تقرير ربحية حسب المنتج/العميل/الشهر (تكلفة/طن، متوسط سعر بيع/طن، هامش قيمة ونسبة).
- [x] اختبارات Phase 1.
- [ ] تشغيل الاختبارات + build + commit.

## Phase 2 — قواعد الانحراف والتقارير
- [ ] حدود warning/critical لكل منتج/وصفة مع fallback للقيمة العامة + migration.
- [ ] Warning = علم + إشعار للمدير. Critical = رمز سبب + ملاحظة إلزامية + تنبيه المالك.
- [ ] إضافة shift و productionLine/machineId لأوامر الإنتاج (اختياري للقديم).
- [ ] شاشة تقرير: الانحراف والهدر حسب المنتج/الوردية/المشغّل/الخط/الشهر + مخطط اتجاه.
- [ ] اختبارات Phase 2.
- [ ] تشغيل الاختبارات + build + commit.

## Phase 3 — الاستدعاء / الحجر
- [ ] أوامر holdLot/releaseLot/recallLot و holdRawBatch/releaseRawBatch مع سبب ومستخدم وaudit.
- [ ] إعادة استخدام lotQcBlock/rawBatchQcBlock guards.
- [ ] حساب العملاء المتأثرين (forward trace) + تقرير استدعاء قابل للطباعة تحت app/print/.
- [ ] بحث forward-trace في شاشة التتبع.
- [ ] اختبارات Phase 3.
- [ ] تشغيل الاختبارات + build + commit.

## Phase 4 — استكمال الجودة
- [ ] حدود مواصفات لكل مادة/منتج (min/max + blocking) مع fallback.
- [ ] نوع عينة IN_PROCESS مرتبط بأمر إنتاج.
- [ ] pass/fail تلقائي؛ فشل الخامة يحجرها؛ فشل الدفعة يمنع البيع حتى اعتماد المدير.
- [ ] تسجيل الفاحص/المعمل/الطريقة + مرفق تقرير المختبر.
- [ ] توسيع شاشة جودة الموردين: معدل النجاح، متوسط الرطوبة/البروتين، اتجاه شهري.
- [ ] اختبارات Phase 4.
- [ ] تشغيل الاختبارات + build + commit.

## Phase 5 — مرفقات الملفات
- [ ] مخزن مرفقات: metadata في الحالة + البايتات في طبقة التخزين.
- [ ] مسار رفع/تنزيل مع فحص الصلاحيات.
- [ ] ربطها بالوثائق/الموظفين/المختبر/المركبات/إثبات التسليم.
- [ ] عدم إرسال البايتات داخل /api/erp.
- [ ] اختبارات Phase 5.
- [ ] تشغيل الاختبارات + build + commit.

## Optional
- [ ] لوحة المالك: بطاقات الوقود/الوثائق/الجودة/المركبات/التوقف.
- [ ] أدوار Storekeeper/Production/Maintenance/Sales + migration.
- [ ] ScaleAdapter interface.

## Final
- [ ] تحديث docs/command-coverage.md و data-model.md و rbac.md.
- [ ] تشغيل كل الاختبارات + build + commit نهائي.
