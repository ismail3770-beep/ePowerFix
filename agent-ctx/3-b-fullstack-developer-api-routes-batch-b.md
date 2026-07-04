# Task 3-b — Full-stack Developer (API Routes Batch B)

## Task
Build admin API routes for coupons, bookings, services, blog, reviews, messages, quote-requests.

## Routes Created (17 files)

| # | Route | Methods | Notes |
|---|-------|---------|-------|
| 1 | `/api/admin/coupons` | GET, POST | dual field-name mapping |
| 2 | `/api/admin/coupons/[id]` | GET, PUT, DELETE (soft) | |
| 3 | `/api/admin/bookings` | GET, POST | includes user+service |
| 4 | `/api/admin/bookings/[id]` | GET, PUT | PUT accepts `status` (what frontend calls) |
| 5 | `/api/admin/bookings/[id]/status` | PUT | status-only update |
| 6 | `/api/admin/services` | GET, POST | price/duration/image/featured mapping |
| 7 | `/api/admin/services/[id]` | GET, PUT, DELETE (soft) | |
| 8 | `/api/admin/service-categories` | GET, POST | `{ data: categories }` with _count |
| 9 | `/api/admin/service-categories/[id]` | GET, PUT, DELETE (soft) | |
| 10 | `/api/admin/blog` | GET, POST | status<->isPublished, imageUrl<->coverImage |
| 11 | `/api/admin/blog/[id]` | GET, PUT, DELETE (soft) | |
| 12 | `/api/admin/reviews` | GET | includes user+product+service |
| 13 | `/api/admin/reviews/[id]` | GET, PUT, DELETE (soft) | PUT validates status enum |
| 14 | `/api/admin/messages` | GET | Contact model; isRead derived from status |
| 15 | `/api/admin/messages/[id]` | GET, PUT, DELETE (hard) | PUT accepts isRead OR status |
| 16 | `/api/admin/quote-requests` | GET | message<->description alias |
| 17 | `/api/admin/quote-requests/[id]` | GET, PUT, DELETE (hard) | |

## Key Field-Mapping Decisions

The task spec, the SQLite schema, and the admin frontend use three different
naming conventions for several models. Each route accepts BOTH conventions and
returns BOTH sets of aliases so the API works with the existing frontend AND
the task spec.

### Coupon
- Frontend: `discount`, `discountType`, `maxUses`, `validFrom`, `validTo`
- Schema:  `value`, `type`, `usageLimit`, `startDate`, `endDate`
- `code` is upper-cased on create.

### Service
- Frontend: `price`, `duration`, `image` (single URL), `featured`
- Schema:  `basePrice`, `shortDesc`, `images` (JSON array), `isFeatured`
- `priceUnit` defaults to `'fixed'` (schema requires it).
- If `categoryId` is missing, finds-or-creates an "Uncategorized"
  ServiceCategory (schema requires the FK).

### BlogPost
- Frontend: `status` ('DRAFT'|'PUBLISHED'), `imageUrl`, `tags` (array)
- Schema:  `isPublished` (Boolean), `coverImage`, `tags` (JSON string)
- `author` is a plain String (NO author relation in schema). Set from
  body.author or the current admin's name.
- Task-spec "include author (name, email)" is N/A — documented in code.

### Contact (messages)
- Frontend: `isRead` (boolean)
- Schema:  `status` (String, default 'NEW')
- `isRead` derived as `(status !== 'NEW')`. PUT accepts `isRead` OR `status`.

### QuoteRequest
- Frontend expects `message` and `email` (string).
- Schema has `description` and `email?` (nullable).
- Response aliases `message` = `description`, `email` coerced to `''`.
- `quotedPrice` / `adminNotes` (task spec) are NOT schema fields — ignored.

## Delete Behavior
- Soft-delete (isDeleted: true): Coupon, Service, ServiceCategory, BlogPost, Review.
- Hard delete: Contact (messages), QuoteRequest — per task spec.

## Verification
- `npx eslint src/app/api/admin/{coupons,bookings,services,service-categories,blog,reviews,messages,quote-requests}` → EXIT_CODE=0, no errors.

## Issues / Caveats
- The bookings frontend page currently calls `PUT /api/admin/bookings/:id` with
  `{ status }` (not the `/status` sub-path). Both endpoints are implemented, so
  the page works regardless. The dedicated `/status` endpoint matches the
  worklog's recommended path for any future client.
- BlogPost has no `author` relation in the SQLite schema, so the task-spec
  "include author (name, email)" relation include is not possible; `author` is
  returned as the stored String field.
- `adminReply` (reviews/messages) and `quotedPrice`/`adminNotes` (quote-requests)
  from the task spec are not columns in the schema and are silently ignored.
