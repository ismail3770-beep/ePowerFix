-- Phase 0A: add an explicit, reversible inventory/coupon reservation lifecycle
-- for online orders. This migration is deliberately additive: existing orders
-- retain the default NONE/false state and are not guessed or backfilled.

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "idempotency_key" TEXT,
  ADD COLUMN IF NOT EXISTS "reservation_status" TEXT NOT NULL DEFAULT 'NONE',
  ADD COLUMN IF NOT EXISTS "reservation_expires_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reservation_released_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "reservation_release_reason" TEXT;

ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "inventory_reserved" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS "orders_idempotency_key_key"
  ON "orders"("idempotency_key");

CREATE INDEX IF NOT EXISTS "orders_reservation_status_reservation_expires_at_idx"
  ON "orders"("reservation_status", "reservation_expires_at");
