-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRoleKey" AS ENUM ('SUPER_ADMIN', 'MANAGEMENT', 'WAREHOUSE', 'PRODUCTION', 'ACCOUNTANT', 'HR', 'SALES');

-- CreateEnum
CREATE TYPE "WarehouseKey" AS ENUM ('WH_RAW', 'WH_MFG', 'WH_FG');

-- CreateEnum
CREATE TYPE "VatTreatment" AS ENUM ('STANDARD', 'ZERO', 'EXEMPT');

-- CreateEnum
CREATE TYPE "CatalogItemType" AS ENUM ('MATERIAL', 'PRODUCT');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CONFIRMED', 'PARTIAL', 'PAID', 'RECEIVED', 'COMPLETED', 'RELEASED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "key" "UserRoleKey" NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL DEFAULT 'OMR',
    "productionVarianceThresholdPct" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "taxRegistrationNumber" TEXT,
    "taxRatePct" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "taxInclusivePricing" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "key" "WarehouseKey" NOT NULL,
    "nameAr" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErpDocument" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseLocation" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarehouseLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "minQty" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "vatTreatment" "VatTreatment" NOT NULL DEFAULT 'STANDARD',
    "barcode" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "salePrice" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "vatTreatment" "VatTreatment" NOT NULL DEFAULT 'STANDARD',
    "barcode" TEXT NOT NULL,
    "bagKg" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "vatNumber" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "vatNumber" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "basicSalary" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "baseOutputQty" DECIMAL(14,3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeItem" (
    "recipeId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "qty" DECIMAL(14,3) NOT NULL,

    CONSTRAINT "RecipeItem_pkey" PRIMARY KEY ("recipeId","materialId")
);

-- CreateTable
CREATE TABLE "InventoryBalance" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "locationId" TEXT,
    "itemType" "CatalogItemType" NOT NULL,
    "materialId" TEXT,
    "productId" TEXT,
    "batchNo" TEXT NOT NULL,
    "qty" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "expiryDate" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryLedgerEntry" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "locationId" TEXT,
    "itemType" "CatalogItemType" NOT NULL,
    "materialId" TEXT,
    "productId" TEXT,
    "batchNo" TEXT NOT NULL,
    "qty" DECIMAL(14,3) NOT NULL,
    "unitCost" DECIMAL(14,3) NOT NULL,
    "prevQty" DECIMAL(14,3) NOT NULL,
    "newQty" DECIMAL(14,3) NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "InventoryLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "notes" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderLine" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "qty" DECIMAL(14,3) NOT NULL,
    "unitCost" DECIMAL(14,3) NOT NULL,
    "receivedQty" DECIMAL(14,3) NOT NULL DEFAULT 0,

    CONSTRAINT "PurchaseOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceipt" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoodsReceiptLine" (
    "id" TEXT NOT NULL,
    "goodsReceiptId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "qty" DECIMAL(14,3) NOT NULL,
    "unitCost" DECIMAL(14,3) NOT NULL,
    "batchNo" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),

    CONSTRAINT "GoodsReceiptLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionOrder" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "plannedQty" DECIMAL(14,3) NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'RELEASED',
    "actualOutputQty" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "outputBatch" TEXT NOT NULL,
    "varianceReason" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ProductionOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionInput" (
    "id" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "expectedQty" DECIMAL(14,3) NOT NULL,
    "actualQty" DECIMAL(14,3) NOT NULL,
    "wasteQty" DECIMAL(14,3) NOT NULL,

    CONSTRAINT "ProductionInput_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesInvoice" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT NOT NULL,
    "subtotal" DECIMAL(14,3) NOT NULL,
    "vatAmount" DECIMAL(14,3) NOT NULL,
    "total" DECIMAL(14,3) NOT NULL,
    "paidAmount" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "SalesInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesInvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "qty" DECIMAL(14,3) NOT NULL,
    "unitPrice" DECIMAL(14,3) NOT NULL,
    "vatTreatment" "VatTreatment" NOT NULL,
    "vatRatePct" DECIMAL(5,2) NOT NULL,
    "net" DECIMAL(14,3) NOT NULL,
    "vat" DECIMAL(14,3) NOT NULL,
    "total" DECIMAL(14,3) NOT NULL,
    "batchNo" TEXT NOT NULL,
    "unitCost" DECIMAL(14,3) NOT NULL,

    CONSTRAINT "SalesInvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesPayment" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(14,3) NOT NULL,
    "method" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "SalesPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memo" TEXT NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "debit" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "credit" DECIMAL(14,3) NOT NULL DEFAULT 0,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollLine" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "basic" DECIMAL(14,3) NOT NULL,
    "overtimeHours" DECIMAL(14,3) NOT NULL,
    "overtimeAmount" DECIMAL(14,3) NOT NULL,
    "allowances" DECIMAL(14,3) NOT NULL,
    "deductions" DECIMAL(14,3) NOT NULL,
    "gross" DECIMAL(14,3) NOT NULL,
    "net" DECIMAL(14,3) NOT NULL,

    CONSTRAINT "PayrollLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "totalNet" DECIMAL(14,3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedBy" TEXT,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_key_key" ON "Warehouse"("key");

-- CreateIndex
CREATE INDEX "WarehouseLocation_warehouseId_idx" ON "WarehouseLocation"("warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseLocation_warehouseId_code_key" ON "WarehouseLocation"("warehouseId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Material_code_key" ON "Material"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Material_barcode_key" ON "Material"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Product_code_key" ON "Product"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_code_key" ON "Employee"("code");

-- CreateIndex
CREATE INDEX "Recipe_productId_idx" ON "Recipe"("productId");

-- CreateIndex
CREATE INDEX "RecipeItem_materialId_idx" ON "RecipeItem"("materialId");

-- CreateIndex
CREATE INDEX "InventoryBalance_materialId_idx" ON "InventoryBalance"("materialId");

-- CreateIndex
CREATE INDEX "InventoryBalance_productId_idx" ON "InventoryBalance"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryBalance_warehouseId_locationId_itemType_materialId_key" ON "InventoryBalance"("warehouseId", "locationId", "itemType", "materialId", "productId", "batchNo");

-- CreateIndex
CREATE INDEX "InventoryLedgerEntry_warehouseId_at_idx" ON "InventoryLedgerEntry"("warehouseId", "at");

-- CreateIndex
CREATE INDEX "InventoryLedgerEntry_materialId_idx" ON "InventoryLedgerEntry"("materialId");

-- CreateIndex
CREATE INDEX "InventoryLedgerEntry_productId_idx" ON "InventoryLedgerEntry"("productId");

-- CreateIndex
CREATE INDEX "InventoryLedgerEntry_refType_refId_idx" ON "InventoryLedgerEntry"("refType", "refId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_number_key" ON "PurchaseOrder"("number");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierId_status_idx" ON "PurchaseOrder"("supplierId", "status");

-- CreateIndex
CREATE INDEX "PurchaseOrderLine_materialId_idx" ON "PurchaseOrderLine"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "GoodsReceipt_number_key" ON "GoodsReceipt"("number");

-- CreateIndex
CREATE INDEX "GoodsReceiptLine_materialId_idx" ON "GoodsReceiptLine"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionOrder_number_key" ON "ProductionOrder"("number");

-- CreateIndex
CREATE INDEX "ProductionOrder_productId_status_idx" ON "ProductionOrder"("productId", "status");

-- CreateIndex
CREATE INDEX "ProductionInput_materialId_idx" ON "ProductionInput"("materialId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesInvoice_number_key" ON "SalesInvoice"("number");

-- CreateIndex
CREATE INDEX "SalesInvoice_customerId_status_idx" ON "SalesInvoice"("customerId", "status");

-- CreateIndex
CREATE INDEX "SalesInvoiceLine_productId_idx" ON "SalesInvoiceLine"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesPayment_number_key" ON "SalesPayment"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Account_code_key" ON "Account"("code");

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_number_key" ON "JournalEntry"("number");

-- CreateIndex
CREATE INDEX "JournalLine_accountId_idx" ON "JournalLine"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_employeeId_date_key" ON "Attendance"("employeeId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollRun_number_key" ON "PayrollRun"("number");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseLocation" ADD CONSTRAINT "WarehouseLocation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WarehouseLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBalance" ADD CONSTRAINT "InventoryBalance_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLedgerEntry" ADD CONSTRAINT "InventoryLedgerEntry_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLedgerEntry" ADD CONSTRAINT "InventoryLedgerEntry_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WarehouseLocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLedgerEntry" ADD CONSTRAINT "InventoryLedgerEntry_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryLedgerEntry" ADD CONSTRAINT "InventoryLedgerEntry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoodsReceiptLine" ADD CONSTRAINT "GoodsReceiptLine_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionInput" ADD CONSTRAINT "ProductionInput_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionInput" ADD CONSTRAINT "ProductionInput_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesInvoice" ADD CONSTRAINT "SalesInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesInvoiceLine" ADD CONSTRAINT "SalesInvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SalesInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesInvoiceLine" ADD CONSTRAINT "SalesInvoiceLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesPayment" ADD CONSTRAINT "SalesPayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "SalesInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollLine" ADD CONSTRAINT "PayrollLine_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "PayrollRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollLine" ADD CONSTRAINT "PayrollLine_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

