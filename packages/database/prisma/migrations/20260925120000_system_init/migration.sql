CREATE TABLE "SystemInit" (
    "id" TEXT NOT NULL,
    "initializedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemInit_pkey" PRIMARY KEY ("id")
);
