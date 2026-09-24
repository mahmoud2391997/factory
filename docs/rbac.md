# الصلاحيات في النظام العامل

النظام العامل ليس خدمة `apps/api` منفصلة، ولا يستخدم أدوار Prisma السبعة (`SUPER_ADMIN` … `SALES`). تلك الأدوار بقيت في مخطط Prisma القديم كبقايا تصميم سابق.

التشغيل الفعلي يمر عبر `POST /api/erp` ثم `applyCommand` في `apps/web/lib/erp/domain/engine.ts`. كل أمر يُفحص في `authorize()` مقابل صلاحية واحدة، وTypeScript يفرض أن كل `action` جديد يصرّح بصلاحيته.

## الأدوار الثلاثة

تُخزَّن في مستند `ErpState.rolePermissions` (انظر `apps/web/lib/erp/domain/permissions.ts`):

| الدور | المعنى | أمثلة على ما يراه |
| --- | --- | --- |
| `GM` | المدير العام | كل الصلاحيات، بما فيها الرواتب والقيود وسجل التدقيق |
| `ACCOUNTANT` | المحاسب والموارد البشرية | الحسابات، المصروفات، الموظفون، الحضور، المسير، التدقيق. لا يعتمد أوامر الشراء |
| `OPERATIONS` | المستودع والإنتاج والمبيعات | المخزون والشراء والإنتاج والبيع. لا يستلم الرواتب ولا القيود ولا سجل التدقيق ولا رواتب الموظفين |

`GET /api/erp` ونتائج `POST /api/erp` تمر على `publicState(state, permissions)` قبل أن تصل للمتصفح. من لا يملك صلاحية القراءة لا يستلم المجموعة أصلاً:

- الراتب الأساسي يحتاج `employees.read` أو `employees.manage`
- `payrolls` تحتاج `payroll.manage` أو `payroll.approve` أو `payroll.pay`
- `journals` تحتاج `accounting.read` أو `accounting.manage`
- `auditLogs` تحتاج `audit.read`
- `attendance` تحتاج `attendance.read` أو `attendance.manage`

`passwordHash` يُحذف دائماً من نسخة المتصفح.

## أول دخول

حساب `admin@factory.local` في البيانات الأولية عليه `mustChangePassword`. قبل تغيير كلمة مروره لا يُقبل أي أمر سوى `setUserPassword` لحسابه نفسه، وهذا الأمر يمسح العلم.

## الأرشيف

جداول Prisma العلائقية (ومنها `InventoryLedgerEntry` و`JournalEntry` و`AuditLog`) ليست مسار القراءة والكتابة اليومي. أمر `archiveHistory` (صلاحية `settings.update`) ينسخ حركات المخزون والقيود وسجل التدقيق الأقدم من عدد أيام محدد إلى تلك الجداول، ثم يزيلها من المستند الحي مع الإبقاء على أرصدة المخزون وميزان المراجعة.
