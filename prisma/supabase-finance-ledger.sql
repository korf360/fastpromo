-- Optional: apply in Supabase SQL editor if `prisma migrate deploy` is not used yet.
-- Same as prisma/migrations/20260804160000_finance_ledger/migration.sql

CREATE TABLE IF NOT EXISTS "FinanceEntry" (
    "id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "note" TEXT,
    "orderId" TEXT,
    "stripeSessionId" TEXT,
    "externalRef" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdByEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FinanceEntry_direction_occurredAt_idx"
  ON "FinanceEntry"("direction", "occurredAt");

CREATE INDEX IF NOT EXISTS "FinanceEntry_category_occurredAt_idx"
  ON "FinanceEntry"("category", "occurredAt");

CREATE INDEX IF NOT EXISTS "FinanceEntry_occurredAt_idx"
  ON "FinanceEntry"("occurredAt");

CREATE UNIQUE INDEX IF NOT EXISTS "FinanceEntry_stripeSessionId_category_direction_key"
  ON "FinanceEntry"("stripeSessionId", "category", "direction");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FinanceEntry_orderId_fkey'
  ) THEN
    ALTER TABLE "FinanceEntry"
      ADD CONSTRAINT "FinanceEntry_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "Order"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
