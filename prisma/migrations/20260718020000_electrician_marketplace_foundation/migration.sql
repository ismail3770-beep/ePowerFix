-- CreateTable
CREATE TABLE "provider_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "display_name" TEXT NOT NULL,
    "display_name_bn" TEXT,
    "bio" TEXT,
    "years_experience" INTEGER NOT NULL DEFAULT 0,
    "rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "jobs_completed" INTEGER NOT NULL DEFAULT 0,
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "emergency_available" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_documents" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_bn" TEXT,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_skills" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "years_experience" INTEGER NOT NULL DEFAULT 0,
    "proficiency" TEXT NOT NULL DEFAULT 'STANDARD',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_divisions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_bn" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geo_divisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_districts" (
    "id" TEXT NOT NULL,
    "division_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_bn" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geo_districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo_upazilas" (
    "id" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_bn" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geo_upazilas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_zones" (
    "id" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "upazila_id" TEXT,
    "name" TEXT NOT NULL,
    "name_bn" TEXT,
    "slug" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_service_zones" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "service_zone_id" TEXT NOT NULL,
    "travel_radius_km" INTEGER NOT NULL DEFAULT 10,
    "emergency_available" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_service_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_availability" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_time_off" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_time_off_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "value_type" TEXT NOT NULL DEFAULT 'STRING',
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_audit_events" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "provider_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "from_state" TEXT,
    "to_state" TEXT,
    "metadata" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_service_requests" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "service_id" TEXT,
    "skill_id" TEXT,
    "service_zone_id" TEXT NOT NULL,
    "idempotency_key" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "problem_summary" TEXT NOT NULL,
    "description" TEXT,
    "service_address" TEXT NOT NULL,
    "area_name" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "scheduled_for" TIMESTAMP(3),
    "is_emergency" BOOLEAN NOT NULL DEFAULT false,
    "emergency_surcharge" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "cancellation_reason" TEXT,
    "submitted_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_request_attachments" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "caption" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_request_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_jobs" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "provider_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "assigned_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "en_route_at" TIMESTAMP(3),
    "arrived_at" TIMESTAMP(3),
    "work_started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "customer_confirmed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "warranty_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_assignments" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "assigned_by_id" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'OFFERED',
    "score" DECIMAL(7,4),
    "score_details" TEXT,
    "offered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "response_note" TEXT,

    CONSTRAINT "job_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_status_history" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "note" TEXT,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_quotes" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(12,2) NOT NULL,
    "fee_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "notes" TEXT,
    "expires_at" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "admin_reviewed_by_id" TEXT,
    "admin_reviewed_at" TIMESTAMP(3),
    "customer_decision_by_id" TEXT,
    "customer_decision_at" TIMESTAMP(3),
    "customer_decision_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_line_items" (
    "id" TEXT NOT NULL,
    "quote_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'LABOR',
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_payments" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "quote_id" TEXT,
    "customer_id" TEXT NOT NULL,
    "provider_id" TEXT,
    "payout_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "amount" DECIMAL(12,2) NOT NULL,
    "commission_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "commission_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "provider_net_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "external_transaction_id" TEXT,
    "gateway_reference" TEXT,
    "gateway_data" TEXT,
    "paid_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "financial_ledger_entries" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "payment_id" TEXT,
    "payout_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "amount" DECIMAL(12,2) NOT NULL,
    "reference_type" TEXT,
    "reference_id" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_payouts" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "commission_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "adjustment_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "method" TEXT,
    "destination_masked" TEXT,
    "external_reference" TEXT,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_payout_items" (
    "id" TEXT NOT NULL,
    "payout_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "commission_amount" DECIMAL(12,2) NOT NULL,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_payout_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_reviews" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_warranty_claims" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "resolved_by_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "issue" TEXT NOT NULL,
    "provider_response" TEXT,
    "provider_responded_at" TIMESTAMP(3),
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_warranty_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_disputes" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "opened_by_id" TEXT NOT NULL,
    "resolved_by_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "provider_response" TEXT,
    "provider_responded_at" TIMESTAMP(3),
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arrival_otps" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'ARRIVAL',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified_at" TIMESTAMP(3),
    "invalidated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arrival_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_location_pings" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "latitude" DECIMAL(10,7) NOT NULL,
    "longitude" DECIMAL(10,7) NOT NULL,
    "accuracy_meters" DECIMAL(8,2),
    "consent_granted_at" TIMESTAMP(3) NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_location_pings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_deliveries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "entity_type" TEXT,
    "entity_id" TEXT,
    "destination_masked" TEXT,
    "provider_message_id" TEXT,
    "failure_reason" TEXT,
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "provider_profiles_user_id_key" ON "provider_profiles"("user_id");

-- CreateIndex
CREATE INDEX "provider_profiles_status_is_active_idx" ON "provider_profiles"("status", "is_active");

-- CreateIndex
CREATE INDEX "provider_profiles_reviewed_by_id_idx" ON "provider_profiles"("reviewed_by_id");

-- CreateIndex
CREATE INDEX "provider_profiles_rating_idx" ON "provider_profiles"("rating");

-- CreateIndex
CREATE INDEX "provider_documents_status_idx" ON "provider_documents"("status");

-- CreateIndex
CREATE INDEX "provider_documents_reviewed_by_id_idx" ON "provider_documents"("reviewed_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_documents_provider_id_type_key" ON "provider_documents"("provider_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_skills_slug_key" ON "marketplace_skills"("slug");

-- CreateIndex
CREATE INDEX "marketplace_skills_is_active_sort_order_idx" ON "marketplace_skills"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "provider_skills_skill_id_is_verified_idx" ON "provider_skills"("skill_id", "is_verified");

-- CreateIndex
CREATE UNIQUE INDEX "provider_skills_provider_id_skill_id_key" ON "provider_skills"("provider_id", "skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "geo_divisions_code_key" ON "geo_divisions"("code");

-- CreateIndex
CREATE INDEX "geo_divisions_is_active_idx" ON "geo_divisions"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "geo_districts_code_key" ON "geo_districts"("code");

-- CreateIndex
CREATE INDEX "geo_districts_division_id_is_active_idx" ON "geo_districts"("division_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "geo_upazilas_code_key" ON "geo_upazilas"("code");

-- CreateIndex
CREATE INDEX "geo_upazilas_district_id_is_active_idx" ON "geo_upazilas"("district_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "service_zones_slug_key" ON "service_zones"("slug");

-- CreateIndex
CREATE INDEX "service_zones_district_id_is_active_idx" ON "service_zones"("district_id", "is_active");

-- CreateIndex
CREATE INDEX "service_zones_upazila_id_idx" ON "service_zones"("upazila_id");

-- CreateIndex
CREATE INDEX "provider_service_zones_service_zone_id_is_active_idx" ON "provider_service_zones"("service_zone_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "provider_service_zones_provider_id_service_zone_id_key" ON "provider_service_zones"("provider_id", "service_zone_id");

-- CreateIndex
CREATE INDEX "provider_availability_provider_id_day_of_week_is_active_idx" ON "provider_availability"("provider_id", "day_of_week", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "provider_availability_provider_id_day_of_week_start_time_en_key" ON "provider_availability"("provider_id", "day_of_week", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "provider_time_off_provider_id_starts_at_ends_at_idx" ON "provider_time_off"("provider_id", "starts_at", "ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_settings_key_key" ON "marketplace_settings"("key");

-- CreateIndex
CREATE INDEX "marketplace_settings_is_public_idx" ON "marketplace_settings"("is_public");

-- CreateIndex
CREATE INDEX "marketplace_settings_updated_by_id_idx" ON "marketplace_settings"("updated_by_id");

-- CreateIndex
CREATE INDEX "marketplace_audit_events_entity_type_entity_id_created_at_idx" ON "marketplace_audit_events"("entity_type", "entity_id", "created_at");

-- CreateIndex
CREATE INDEX "marketplace_audit_events_actor_user_id_created_at_idx" ON "marketplace_audit_events"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "marketplace_audit_events_provider_id_created_at_idx" ON "marketplace_audit_events"("provider_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_service_requests_idempotency_key_key" ON "marketplace_service_requests"("idempotency_key");

-- CreateIndex
CREATE INDEX "marketplace_service_requests_customer_id_status_created_at_idx" ON "marketplace_service_requests"("customer_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "marketplace_service_requests_service_zone_id_status_schedul_idx" ON "marketplace_service_requests"("service_zone_id", "status", "scheduled_for");

-- CreateIndex
CREATE INDEX "marketplace_service_requests_skill_id_status_idx" ON "marketplace_service_requests"("skill_id", "status");

-- CreateIndex
CREATE INDEX "marketplace_service_requests_service_id_idx" ON "marketplace_service_requests"("service_id");

-- CreateIndex
CREATE INDEX "service_request_attachments_request_id_sort_order_idx" ON "service_request_attachments"("request_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_jobs_request_id_key" ON "marketplace_jobs"("request_id");

-- CreateIndex
CREATE INDEX "marketplace_jobs_provider_id_status_created_at_idx" ON "marketplace_jobs"("provider_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "marketplace_jobs_status_created_at_idx" ON "marketplace_jobs"("status", "created_at");

-- CreateIndex
CREATE INDEX "job_assignments_provider_id_status_expires_at_idx" ON "job_assignments"("provider_id", "status", "expires_at");

-- CreateIndex
CREATE INDEX "job_assignments_assigned_by_id_offered_at_idx" ON "job_assignments"("assigned_by_id", "offered_at");

-- CreateIndex
CREATE UNIQUE INDEX "job_assignments_job_id_provider_id_attempt_key" ON "job_assignments"("job_id", "provider_id", "attempt");

-- CreateIndex
CREATE INDEX "job_status_history_job_id_created_at_idx" ON "job_status_history"("job_id", "created_at");

-- CreateIndex
CREATE INDEX "job_status_history_actor_user_id_created_at_idx" ON "job_status_history"("actor_user_id", "created_at");

-- CreateIndex
CREATE INDEX "marketplace_quotes_provider_id_status_created_at_idx" ON "marketplace_quotes"("provider_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "marketplace_quotes_status_expires_at_idx" ON "marketplace_quotes"("status", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_quotes_job_id_version_key" ON "marketplace_quotes"("job_id", "version");

-- CreateIndex
CREATE INDEX "quote_line_items_quote_id_sort_order_idx" ON "quote_line_items"("quote_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_payments_idempotency_key_key" ON "marketplace_payments"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_payments_external_transaction_id_key" ON "marketplace_payments"("external_transaction_id");

-- CreateIndex
CREATE INDEX "marketplace_payments_job_id_status_created_at_idx" ON "marketplace_payments"("job_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "marketplace_payments_customer_id_created_at_idx" ON "marketplace_payments"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "marketplace_payments_provider_id_status_idx" ON "marketplace_payments"("provider_id", "status");

-- CreateIndex
CREATE INDEX "marketplace_payments_payout_id_idx" ON "marketplace_payments"("payout_id");

-- CreateIndex
CREATE UNIQUE INDEX "financial_ledger_entries_idempotency_key_key" ON "financial_ledger_entries"("idempotency_key");

-- CreateIndex
CREATE INDEX "financial_ledger_entries_provider_id_created_at_idx" ON "financial_ledger_entries"("provider_id", "created_at");

-- CreateIndex
CREATE INDEX "financial_ledger_entries_payment_id_idx" ON "financial_ledger_entries"("payment_id");

-- CreateIndex
CREATE INDEX "financial_ledger_entries_payout_id_idx" ON "financial_ledger_entries"("payout_id");

-- CreateIndex
CREATE INDEX "financial_ledger_entries_reference_type_reference_id_idx" ON "financial_ledger_entries"("reference_type", "reference_id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_payouts_idempotency_key_key" ON "provider_payouts"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "provider_payouts_external_reference_key" ON "provider_payouts"("external_reference");

-- CreateIndex
CREATE INDEX "provider_payouts_provider_id_status_created_at_idx" ON "provider_payouts"("provider_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "provider_payouts_created_by_id_idx" ON "provider_payouts"("created_by_id");

-- CreateIndex
CREATE INDEX "provider_payouts_approved_by_id_idx" ON "provider_payouts"("approved_by_id");

-- CreateIndex
CREATE INDEX "provider_payout_items_payment_id_idx" ON "provider_payout_items"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "provider_payout_items_payout_id_payment_id_key" ON "provider_payout_items"("payout_id", "payment_id");

-- CreateIndex
CREATE INDEX "marketplace_reviews_provider_id_status_created_at_idx" ON "marketplace_reviews"("provider_id", "status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_reviews_job_id_customer_id_key" ON "marketplace_reviews"("job_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_warranty_claims_idempotency_key_key" ON "marketplace_warranty_claims"("idempotency_key");

-- CreateIndex
CREATE INDEX "marketplace_warranty_claims_job_id_status_idx" ON "marketplace_warranty_claims"("job_id", "status");

-- CreateIndex
CREATE INDEX "marketplace_warranty_claims_customer_id_created_at_idx" ON "marketplace_warranty_claims"("customer_id", "created_at");

-- CreateIndex
CREATE INDEX "marketplace_warranty_claims_resolved_by_id_idx" ON "marketplace_warranty_claims"("resolved_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_warranty_claims_job_id_customer_id_key" ON "marketplace_warranty_claims"("job_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_disputes_idempotency_key_key" ON "marketplace_disputes"("idempotency_key");

-- CreateIndex
CREATE INDEX "marketplace_disputes_job_id_status_idx" ON "marketplace_disputes"("job_id", "status");

-- CreateIndex
CREATE INDEX "marketplace_disputes_opened_by_id_created_at_idx" ON "marketplace_disputes"("opened_by_id", "created_at");

-- CreateIndex
CREATE INDEX "marketplace_disputes_resolved_by_id_idx" ON "marketplace_disputes"("resolved_by_id");

-- CreateIndex
CREATE INDEX "arrival_otps_job_id_purpose_expires_at_idx" ON "arrival_otps"("job_id", "purpose", "expires_at");

-- CreateIndex
CREATE INDEX "provider_location_pings_job_id_captured_at_idx" ON "provider_location_pings"("job_id", "captured_at");

-- CreateIndex
CREATE INDEX "provider_location_pings_provider_id_captured_at_idx" ON "provider_location_pings"("provider_id", "captured_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_deliveries_idempotency_key_key" ON "notification_deliveries"("idempotency_key");

-- CreateIndex
CREATE INDEX "notification_deliveries_user_id_read_at_created_at_idx" ON "notification_deliveries"("user_id", "read_at", "created_at");

-- CreateIndex
CREATE INDEX "notification_deliveries_user_id_status_created_at_idx" ON "notification_deliveries"("user_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "notification_deliveries_entity_type_entity_id_idx" ON "notification_deliveries"("entity_type", "entity_id");

-- AddForeignKey
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_documents" ADD CONSTRAINT "provider_documents_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_documents" ADD CONSTRAINT "provider_documents_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_skills" ADD CONSTRAINT "provider_skills_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_skills" ADD CONSTRAINT "provider_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "marketplace_skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_districts" ADD CONSTRAINT "geo_districts_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "geo_divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo_upazilas" ADD CONSTRAINT "geo_upazilas_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "geo_districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_zones" ADD CONSTRAINT "service_zones_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "geo_districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_zones" ADD CONSTRAINT "service_zones_upazila_id_fkey" FOREIGN KEY ("upazila_id") REFERENCES "geo_upazilas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_service_zones" ADD CONSTRAINT "provider_service_zones_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_service_zones" ADD CONSTRAINT "provider_service_zones_service_zone_id_fkey" FOREIGN KEY ("service_zone_id") REFERENCES "service_zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_availability" ADD CONSTRAINT "provider_availability_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_time_off" ADD CONSTRAINT "provider_time_off_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_settings" ADD CONSTRAINT "marketplace_settings_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_audit_events" ADD CONSTRAINT "marketplace_audit_events_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_audit_events" ADD CONSTRAINT "marketplace_audit_events_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_service_requests" ADD CONSTRAINT "marketplace_service_requests_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_service_requests" ADD CONSTRAINT "marketplace_service_requests_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_service_requests" ADD CONSTRAINT "marketplace_service_requests_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "marketplace_skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_service_requests" ADD CONSTRAINT "marketplace_service_requests_service_zone_id_fkey" FOREIGN KEY ("service_zone_id") REFERENCES "service_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_request_attachments" ADD CONSTRAINT "service_request_attachments_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "marketplace_service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_jobs" ADD CONSTRAINT "marketplace_jobs_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "marketplace_service_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_jobs" ADD CONSTRAINT "marketplace_jobs_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "marketplace_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_status_history" ADD CONSTRAINT "job_status_history_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "marketplace_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_status_history" ADD CONSTRAINT "job_status_history_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_quotes" ADD CONSTRAINT "marketplace_quotes_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "marketplace_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_quotes" ADD CONSTRAINT "marketplace_quotes_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_quotes" ADD CONSTRAINT "marketplace_quotes_admin_reviewed_by_id_fkey" FOREIGN KEY ("admin_reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_quotes" ADD CONSTRAINT "marketplace_quotes_customer_decision_by_id_fkey" FOREIGN KEY ("customer_decision_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_line_items" ADD CONSTRAINT "quote_line_items_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "marketplace_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_payments" ADD CONSTRAINT "marketplace_payments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "marketplace_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_payments" ADD CONSTRAINT "marketplace_payments_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "marketplace_quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_payments" ADD CONSTRAINT "marketplace_payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_payments" ADD CONSTRAINT "marketplace_payments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_payments" ADD CONSTRAINT "marketplace_payments_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "provider_payouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledger_entries" ADD CONSTRAINT "financial_ledger_entries_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledger_entries" ADD CONSTRAINT "financial_ledger_entries_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "marketplace_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_ledger_entries" ADD CONSTRAINT "financial_ledger_entries_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "provider_payouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_payouts" ADD CONSTRAINT "provider_payouts_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_payouts" ADD CONSTRAINT "provider_payouts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_payouts" ADD CONSTRAINT "provider_payouts_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_payout_items" ADD CONSTRAINT "provider_payout_items_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "provider_payouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_payout_items" ADD CONSTRAINT "provider_payout_items_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "marketplace_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "marketplace_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_warranty_claims" ADD CONSTRAINT "marketplace_warranty_claims_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "marketplace_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_warranty_claims" ADD CONSTRAINT "marketplace_warranty_claims_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_warranty_claims" ADD CONSTRAINT "marketplace_warranty_claims_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_disputes" ADD CONSTRAINT "marketplace_disputes_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "marketplace_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_disputes" ADD CONSTRAINT "marketplace_disputes_opened_by_id_fkey" FOREIGN KEY ("opened_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_disputes" ADD CONSTRAINT "marketplace_disputes_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arrival_otps" ADD CONSTRAINT "arrival_otps_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "marketplace_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_location_pings" ADD CONSTRAINT "provider_location_pings_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "marketplace_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_location_pings" ADD CONSTRAINT "provider_location_pings_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "provider_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
