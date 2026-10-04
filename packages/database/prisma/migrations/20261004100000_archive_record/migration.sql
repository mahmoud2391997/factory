CREATE TABLE "ArchiveRecord" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArchiveRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ArchiveRecord_kind_at_idx" ON "ArchiveRecord"("kind", "at");
