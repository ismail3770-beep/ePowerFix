-- Phase 0A: distinguish sellable ProjectKit references from portfolio Projects
-- and allow guest ServiceBooking rows without synthetic User foreign keys.
--
-- This migration is additive. It preserves order and booking rows, moves only
-- provably misclassified ProjectKit IDs to their dedicated fields, and never
-- deletes or resets application data.

ALTER TABLE "cart_items"
  ADD COLUMN IF NOT EXISTS "project_kit_id" TEXT;

ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "project_kit_id" TEXT;

ALTER TABLE "service_bookings"
  ADD COLUMN IF NOT EXISTS "customer_name" TEXT,
  ADD COLUMN IF NOT EXISTS "customer_email" TEXT;

-- Guest bookings are valid without a user account. Existing valid users retain
-- their relation; non-existent synthetic guest IDs become NULL after snapshot
-- fields have been backfilled where a real user exists.
ALTER TABLE "service_bookings"
  ALTER COLUMN "user_id" DROP NOT NULL;

UPDATE "service_bookings" AS booking
SET
  "customer_name" = COALESCE(booking."customer_name", customer."name"),
  "customer_email" = COALESCE(booking."customer_email", customer."email")
FROM "users" AS customer
WHERE booking."user_id" = customer."id";

UPDATE "service_bookings" AS booking
SET "user_id" = NULL
WHERE booking."user_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "users" AS customer
    WHERE customer."id" = booking."user_id"
  );

-- Match the nullable Prisma relation: deleting an account keeps its booking
-- contact snapshot instead of orphaning a foreign-key reference.
ALTER TABLE "service_bookings"
  DROP CONSTRAINT IF EXISTS "service_bookings_user_id_fkey";

ALTER TABLE "service_bookings"
  ADD CONSTRAINT "service_bookings_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Correct historical rows only when the old project_id is conclusively a
-- ProjectKit ID and is not also a real portfolio Project ID. Ambiguous legacy
-- rows remain untouched so historical data is not guessed or discarded.
UPDATE "cart_items" AS item
SET
  "project_kit_id" = kit."id",
  "project_id" = NULL,
  "item_type" = 'PROJECT_KIT'
FROM "project_kits" AS kit
WHERE item."item_type" = 'PROJECT'
  AND item."project_kit_id" IS NULL
  AND item."project_id" = kit."id"
  AND NOT EXISTS (
    SELECT 1
    FROM "projects" AS project
    WHERE project."id" = item."project_id"
  );

UPDATE "order_items" AS item
SET
  "project_kit_id" = kit."id",
  "project_id" = NULL,
  "item_type" = 'PROJECT_KIT'
FROM "project_kits" AS kit
WHERE item."item_type" = 'PROJECT'
  AND item."project_kit_id" IS NULL
  AND item."project_id" = kit."id"
  AND NOT EXISTS (
    SELECT 1
    FROM "projects" AS project
    WHERE project."id" = item."project_id"
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cart_items_project_kit_id_fkey'
  ) THEN
    ALTER TABLE "cart_items"
      ADD CONSTRAINT "cart_items_project_kit_id_fkey"
      FOREIGN KEY ("project_kit_id") REFERENCES "project_kits"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_project_kit_id_fkey'
  ) THEN
    ALTER TABLE "order_items"
      ADD CONSTRAINT "order_items_project_kit_id_fkey"
      FOREIGN KEY ("project_kit_id") REFERENCES "project_kits"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "cart_items_project_kit_id_idx"
  ON "cart_items"("project_kit_id");

CREATE UNIQUE INDEX IF NOT EXISTS "cart_items_user_id_project_kit_id_key"
  ON "cart_items"("user_id", "project_kit_id");

CREATE INDEX IF NOT EXISTS "order_items_project_kit_id_idx"
  ON "order_items"("project_kit_id");
