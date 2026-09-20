# RBAC — الأدوار والصلاحيات (Granular Permissions)

هذه الوثيقة تحدد إطار الصلاحيات الذي سيتم تطبيقه في `apps/api` عبر Guards، وتستخدم `Permission` strings قابلة للتوسع.

## 1) الأدوار الافتراضية (Seed)

- **Super Admin**: كل شيء.
- **Management**: كل صلاحيات الأعمال + تقارير + موافقات، بدون إعدادات نظام حساسة.
- **Warehouse Employee**: مخزون + مستودعات + استلام + تحويلات (حسب السياسة).
- **Production Employee**: أوامر إنتاج + استهلاك + هدر + إكمال (بحسب السياسة).
- **Accountant**: محاسبة + مشتريات + مبيعات + ضرائب + دفعات.
- **HR**: موظفين + حضور + إضافي.
- **Sales**: عملاء + مبيعات + تحصيلات.

## 2) نطاقات صلاحيات (Permission Namespaces)

### 2.1 Auth / Users / RBAC
- `users.read`
- `users.manage`
- `roles.read`
- `roles.manage`

### 2.2 Settings / Integrations
- `settings.read`
- `settings.update`
- `integrations.read`
- `integrations.manage`

### 2.3 Inventory / Warehouses
- `warehouses.read`
- `warehouses.manage`
- `inventory.read`
- `inventory.transfer.create`
- `inventory.adjust`
- `inventory.ledger.read`

### 2.4 Purchasing
- `purchasing.read`
- `purchasing.po.create`
- `purchasing.po.approve`
- `purchasing.gr.create`

### 2.5 Manufacturing
- `production.read`
- `production.create`
- `production.issue_materials`
- `production.complete`

### 2.6 Sales
- `sales.read`
- `sales.create`
- `sales.confirm`
- `sales.payments.manage`
- `withdrawals.create`

### 2.7 Accounting / Tax
- `accounting.read`
- `accounting.journal.read`
- `accounting.manage`
- `tax.read`
- `tax.manage`

### 2.8 HR / Attendance
- `employees.read`
- `employees.manage`
- `attendance.read`
- `attendance.manage`
- `overtime.read`
- `overtime.manage`

### 2.9 Reports / Audit / Notifications
- `reports.read`
- `audit.read`
- `notifications.read`

## 3) تطبيق RBAC

### 3.1 سياسة التنفيذ
- كل Endpoint محمي بـ `JwtAuthGuard`.
- ثم `PermissionsGuard` يفحص `user.permissions` أو `user.roles`.
- صلاحيات دقيقة على عمليات المخزون (خصوصاً `inventory.adjust`, `production.complete`, `sales.confirm`).

### 3.2 Audit enforcement

أي Endpoint “مؤثر” يجب أن يسجل `AuditLog`:
- entity + entityId
- action
- old/new payloads
- userId + timestamp

