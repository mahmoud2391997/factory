CREATE TABLE "PrivateAttachment" (
    "id" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrivateAttachment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PrivateAttachment_size" CHECK (octet_length("bytes") <= 10485760)
);
