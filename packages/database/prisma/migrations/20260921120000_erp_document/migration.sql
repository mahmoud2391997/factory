-- CreateTable
CREATE TABLE "ErpDocument" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "payload" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErpDocument_pkey" PRIMARY KEY ("id")
);
