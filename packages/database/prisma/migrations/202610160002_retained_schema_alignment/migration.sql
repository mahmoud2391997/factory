-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "contractExpiryDate" TIMESTAMP(3),
ADD COLUMN     "idExpiryDate" TIMESTAMP(3),
ADD COLUMN     "idNumber" TEXT,
ADD COLUMN     "vacationBalance" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "customerId" TEXT;

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "customerId" TEXT;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

