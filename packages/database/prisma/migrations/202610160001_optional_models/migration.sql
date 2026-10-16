-- CreateEnum
CREATE TYPE "QualitySampleType" AS ENUM ('RAW_MATERIAL', 'FINISHED_PRODUCT');

-- CreateEnum
CREATE TYPE "QualityResultStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'HOLD');

-- CreateEnum
CREATE TYPE "ProductionCostType" AS ENUM ('RAW_MATERIAL', 'BAGS', 'ELECTRICITY', 'GAS', 'LABOR', 'TRANSPORT', 'MAINTENANCE', 'OVERHEAD');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "contractExpiryDate" TIMESTAMP(3),
ADD COLUMN     "idExpiryDate" TIMESTAMP(3),
ADD COLUMN     "idNumber" TEXT,
ADD COLUMN     "vacationBalance" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "customerId" TEXT;

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "customerId" TEXT;

-- CreateTable
CREATE TABLE "ProductionLot" (
    "id" TEXT NOT NULL,
    "lotNo" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "operatorId" TEXT,
    "customerId" TEXT,
    "manufacturedAt" TIMESTAMP(3) NOT NULL,
    "expectedQty" DECIMAL(14,3) NOT NULL,
    "actualQty" DECIMAL(14,3) NOT NULL,
    "wasteQty" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "varianceQty" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "variancePct" DECIMAL(7,3) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "costPerTon" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "salePricePerTon" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "marginPerTon" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchMaterialLink" (
    "id" TEXT NOT NULL,
    "productionLotId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "supplierId" TEXT,
    "sourceBatchNo" TEXT NOT NULL,
    "qty" DECIMAL(14,3) NOT NULL,
    "unitCost" DECIMAL(14,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchMaterialLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QualitySample" (
    "id" TEXT NOT NULL,
    "productionLotId" TEXT,
    "materialId" TEXT,
    "productId" TEXT,
    "type" "QualitySampleType" NOT NULL,
    "sampledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sampledBy" TEXT NOT NULL,
    "moisturePct" DECIMAL(7,3),
    "proteinPct" DECIMAL(7,3),
    "ashPct" DECIMAL(7,3),
    "result" "QualityResultStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,

    CONSTRAINT "QualitySample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionCostLine" (
    "id" TEXT NOT NULL,
    "productionOrderId" TEXT NOT NULL,
    "productionLotId" TEXT,
    "type" "ProductionCostType" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionCostLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotDelivery" (
    "id" TEXT NOT NULL,
    "productionLotId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "deliveredQty" DECIMAL(14,3) NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceNo" TEXT,

    CONSTRAINT "LotDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "insuranceExpiry" TIMESTAMP(3),
    "registrationExpiry" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleMaintenance" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DECIMAL(14,3) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextDueDate" TIMESTAMP(3),
    "nextDueKm" INTEGER,
    "odometer" INTEGER NOT NULL,

    CONSTRAINT "VehicleMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelLog" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "liters" DECIMAL(10,2) NOT NULL,
    "cost" DECIMAL(14,3) NOT NULL,
    "odometer" INTEGER NOT NULL,
    "driverId" TEXT,

    CONSTRAINT "FuelLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripLog" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destination" TEXT NOT NULL,
    "startOdometer" INTEGER NOT NULL,
    "endOdometer" INTEGER NOT NULL,
    "distanceKm" INTEGER NOT NULL,
    "loadDescription" TEXT,
    "loadWeightKg" DECIMAL(10,2),
    "fuelUsedLiters" DECIMAL(10,2),
    "tripCost" DECIMAL(14,3) NOT NULL DEFAULT 0,

    CONSTRAINT "TripLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialObligation" (
    "id" TEXT NOT NULL,
    "beneficiary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "totalAmount" DECIMAL(14,3) NOT NULL,
    "installmentAmount" DECIMAL(14,3) NOT NULL,
    "paidAmount" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(14,3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialObligation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankTransaction" (
    "id" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(14,3) NOT NULL,
    "description" TEXT NOT NULL,
    "reconciled" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "location" TEXT,
    "runningHours" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineMaintenance" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost" DECIMAL(14,3) NOT NULL,
    "downTimeHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextDueDate" TIMESTAMP(3),
    "sparePartsUsed" TEXT,

    CONSTRAINT "MachineMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityName" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "cost" DECIMAL(14,3),
    "fileUrl" TEXT,
    "responsibleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtilityMeter" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "location" TEXT,

    CONSTRAINT "UtilityMeter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtilityReading" (
    "id" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(14,3) NOT NULL,
    "consumption" DECIMAL(14,3) NOT NULL,
    "cost" DECIMAL(14,3) NOT NULL,

    CONSTRAINT "UtilityReading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierCommunication" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "messageTemplate" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductionLot_lotNo_key" ON "ProductionLot"("lotNo");

-- CreateIndex
CREATE INDEX "ProductionLot_productId_manufacturedAt_idx" ON "ProductionLot"("productId", "manufacturedAt");

-- CreateIndex
CREATE INDEX "ProductionLot_customerId_idx" ON "ProductionLot"("customerId");

-- CreateIndex
CREATE INDEX "BatchMaterialLink_sourceBatchNo_idx" ON "BatchMaterialLink"("sourceBatchNo");

-- CreateIndex
CREATE INDEX "BatchMaterialLink_supplierId_idx" ON "BatchMaterialLink"("supplierId");

-- CreateIndex
CREATE INDEX "QualitySample_productionLotId_result_idx" ON "QualitySample"("productionLotId", "result");

-- CreateIndex
CREATE INDEX "QualitySample_materialId_sampledAt_idx" ON "QualitySample"("materialId", "sampledAt");

-- CreateIndex
CREATE INDEX "QualitySample_productId_sampledAt_idx" ON "QualitySample"("productId", "sampledAt");

-- CreateIndex
CREATE INDEX "ProductionCostLine_productionOrderId_type_idx" ON "ProductionCostLine"("productionOrderId", "type");

-- CreateIndex
CREATE INDEX "LotDelivery_customerId_deliveredAt_idx" ON "LotDelivery"("customerId", "deliveredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plateNumber_key" ON "Vehicle"("plateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_referenceId_key" ON "BankTransaction"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "Machine_code_key" ON "Machine"("code");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLot" ADD CONSTRAINT "ProductionLot_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLot" ADD CONSTRAINT "ProductionLot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLot" ADD CONSTRAINT "ProductionLot_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLot" ADD CONSTRAINT "ProductionLot_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchMaterialLink" ADD CONSTRAINT "BatchMaterialLink_productionLotId_fkey" FOREIGN KEY ("productionLotId") REFERENCES "ProductionLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchMaterialLink" ADD CONSTRAINT "BatchMaterialLink_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchMaterialLink" ADD CONSTRAINT "BatchMaterialLink_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualitySample" ADD CONSTRAINT "QualitySample_productionLotId_fkey" FOREIGN KEY ("productionLotId") REFERENCES "ProductionLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualitySample" ADD CONSTRAINT "QualitySample_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualitySample" ADD CONSTRAINT "QualitySample_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionCostLine" ADD CONSTRAINT "ProductionCostLine_productionOrderId_fkey" FOREIGN KEY ("productionOrderId") REFERENCES "ProductionOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionCostLine" ADD CONSTRAINT "ProductionCostLine_productionLotId_fkey" FOREIGN KEY ("productionLotId") REFERENCES "ProductionLot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotDelivery" ADD CONSTRAINT "LotDelivery_productionLotId_fkey" FOREIGN KEY ("productionLotId") REFERENCES "ProductionLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotDelivery" ADD CONSTRAINT "LotDelivery_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMaintenance" ADD CONSTRAINT "VehicleMaintenance_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelLog" ADD CONSTRAINT "FuelLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelLog" ADD CONSTRAINT "FuelLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripLog" ADD CONSTRAINT "TripLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripLog" ADD CONSTRAINT "TripLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineMaintenance" ADD CONSTRAINT "MachineMaintenance_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyDocument" ADD CONSTRAINT "CompanyDocument_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityReading" ADD CONSTRAINT "UtilityReading_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "UtilityMeter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierCommunication" ADD CONSTRAINT "SupplierCommunication_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

