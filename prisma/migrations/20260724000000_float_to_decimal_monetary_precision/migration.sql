-- AlterTable: Convert Float (double precision) monetary columns to Decimal(12,2)
-- for exact BDT precision. Ratings remain Float (non-monetary averages).

-- products
ALTER TABLE "products" ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "products" ALTER COLUMN "sale_price" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "products" ALTER COLUMN "cost_price" SET DATA TYPE DECIMAL(12,2);

-- product_variants
ALTER TABLE "product_variants" ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "product_variants" ALTER COLUMN "sale_price" SET DATA TYPE DECIMAL(12,2);

-- orders
ALTER TABLE "orders" ALTER COLUMN "subtotal" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "orders" ALTER COLUMN "delivery_charge" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "orders" ALTER COLUMN "discount" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "orders" ALTER COLUMN "tax_amount" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "orders" ALTER COLUMN "total" SET DATA TYPE DECIMAL(12,2);

-- order_items
ALTER TABLE "order_items" ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "order_items" ALTER COLUMN "total" SET DATA TYPE DECIMAL(12,2);

-- payments
ALTER TABLE "payments" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- coupons
ALTER TABLE "coupons" ALTER COLUMN "value" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "coupons" ALTER COLUMN "min_order" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "coupons" ALTER COLUMN "max_discount" SET DATA TYPE DECIMAL(12,2);

-- services
ALTER TABLE "services" ALTER COLUMN "base_price" SET DATA TYPE DECIMAL(12,2);

-- service_bookings
ALTER TABLE "service_bookings" ALTER COLUMN "total_cost" SET DATA TYPE DECIMAL(12,2);

-- return_requests
ALTER TABLE "return_requests" ALTER COLUMN "refund_amount" SET DATA TYPE DECIMAL(12,2);

-- projects
ALTER TABLE "projects" ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "projects" ALTER COLUMN "sale_price" SET DATA TYPE DECIMAL(12,2);

-- project_kits
ALTER TABLE "project_kits" ALTER COLUMN "price" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "project_kits" ALTER COLUMN "sale_price" SET DATA TYPE DECIMAL(12,2);

-- flash_sales
ALTER TABLE "flash_sales" ALTER COLUMN "discount" SET DATA TYPE DECIMAL(5,2);

-- taxes
ALTER TABLE "taxes" ALTER COLUMN "rate" SET DATA TYPE DECIMAL(5,2);

-- site_settings
ALTER TABLE "site_settings" ALTER COLUMN "cod_fee" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "site_settings" ALTER COLUMN "shipping_inside_dhaka" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "site_settings" ALTER COLUMN "shipping_outside_dhaka" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "site_settings" ALTER COLUMN "free_shipping_threshold" SET DATA TYPE DECIMAL(12,2);
