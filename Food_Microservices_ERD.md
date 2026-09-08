# Food Application Microservices ERD

## Document Control & Scope

- **Document Name:** Food_Microservices_ERD.md
- **Version Number:** v1.0
- **Status:** Canonical schema authority for the Food Application
- **Architecture:** Microservices-only
- **Backend:** Node.js / TypeScript
- **Databases:** PostgreSQL, one database owned by each stateful service
- **Clients:** React Web + React Native CLI
- **Gateway:** API Gateway
- **Messaging:** RabbitMQ or Kafka
- **Scope:** Product catalog, guest/authenticated carts, checkout, inventory, orders, payments, notifications, users, authentication, RBAC, and audit.

This document follows the structural style of the supplied Phoenix ERD: document control, terminology, canonical enumerations, owning-service annotations, lifecycle/mutability, columns, normative constraints/rules, index guidance, relationships, and operational rules.

## Architectural Laws

1. Each stateful microservice owns its database.
2. No service may directly query, update, or join another service's database.
3. Cross-service IDs are logical references only; they are never database foreign keys.
4. APIs are organized by business resource, not by user role.
5. ADMIN, MANAGER, and CUSTOMER are authorization roles, not separate business services.
6. Domain events are append-only facts and are published through the message broker.
7. Critical checkout operations must be idempotent.
8. Client-supplied price, tax, discount, stock, and order totals are never trusted.
9. Historical order item values are immutable snapshots.
10. Security and authorization are enforced server-side; hiding UI controls is not authorization.
11. Timestamps are stored as UTC `timestamptz`.
12. Monetary values use `numeric(12,2)` and must not be calculated from floating-point client values.
13. Service databases may use UUID primary keys. Event/outbox sequence IDs may use bigint where useful.

---

## Terminology & Reading Guide

- **Owning Service:** The only service authorized to mutate the entity's authoritative data.
- **Logical FK:** An ID referencing an entity owned by another service. It is not a database FK.
- **Canonical:** The standardized value used by services and events.
- **Normative:** A mandatory invariant. Violating it is a defect.
- **Append-only:** Existing records are never updated or deleted except by explicit retention policy.
- **Snapshot:** Historical business data copied into an entity so later changes to the source do not alter history.
- **Outbox:** Transactionally stored event awaiting publication to the broker.
- **Projection:** Read-optimized data derived from authoritative service events.

---

# 1. Service Boundaries

| Service | Database | Primary Responsibility |
|---|---|---|
| API Gateway | None | Routing, authentication propagation, rate limiting |
| Auth Service | `auth_db` | Identity, credentials, sessions, roles, permissions |
| User Service | `user_db` | Customer profile and addresses |
| Catalog Service | `catalog_db` | Categories, products, images, prices |
| Cart Service | `cart_db` | Guest and authenticated carts |
| Inventory Service | `inventory_db` | Stock, reservations, inventory transactions |
| Order Service | `order_db` | Orders, order items, order lifecycle |
| Payment Service | `payment_db` | Payments, transactions, refunds |
| Notification Service | `notification_db` | Notifications and delivery attempts |
| Audit Service | `audit_db` | Immutable security/system audit events |

---

# 2. Enumerations (Normative — Canonical)

Enumerations in this section are the only canonical values permitted in corresponding schema columns.

### 2.1 user_status
- ACTIVE
- SUSPENDED
- DELETED

### 2.2 role_code
- ADMIN
- MANAGER
- CUSTOMER

### 2.3 account_status
- ACTIVE
- LOCKED
- DISABLED

### 2.4 category_status
- ACTIVE
- INACTIVE
- DELETED

### 2.5 product_status
- DRAFT
- ACTIVE
- INACTIVE
- ARCHIVED

### 2.6 cart_status
- ACTIVE
- CHECKOUT
- CONVERTED
- ABANDONED
- EXPIRED

### 2.7 inventory_status
- ACTIVE
- INACTIVE

### 2.8 inventory_transaction_type
- STOCK_IN
- STOCK_OUT
- RESERVATION
- RELEASE
- ADJUSTMENT
- RETURN
- DAMAGE
- EXPIRED

### 2.9 reservation_status
- RESERVED
- RELEASED
- CONSUMED
- EXPIRED
- CANCELLED

### 2.10 order_status
- PENDING
- CONFIRMED
- PROCESSING
- READY
- OUT_FOR_DELIVERY
- DELIVERED
- CANCELLED

### 2.11 payment_status
- PENDING
- AUTHORIZED
- CAPTURED
- FAILED
- REFUNDED
- PARTIALLY_REFUNDED
- CANCELLED

### 2.12 payment_transaction_type
- AUTHORIZE
- CAPTURE
- REFUND
- VOID

### 2.13 payment_transaction_status
- INITIATED
- SUCCESS
- FAILED

### 2.14 notification_type
- ORDER_CREATED
- ORDER_CONFIRMED
- ORDER_PROCESSING
- ORDER_READY
- ORDER_OUT_FOR_DELIVERY
- ORDER_DELIVERED
- ORDER_CANCELLED
- PAYMENT_SUCCESS
- PAYMENT_FAILED

### 2.15 notification_status
- PENDING
- SENT
- FAILED
- CANCELLED

### 2.16 notification_channel
- EMAIL
- SMS
- PUSH

### 2.17 audit_action
- CREATE
- UPDATE
- DELETE
- LOGIN
- LOGOUT
- LOGIN_FAILED
- PASSWORD_CHANGED
- ROLE_CHANGED
- PAYMENT_ACTION
- ORDER_ACTION
- INVENTORY_ACTION

---

# 3. Auth Service — `auth_db`

## A1. users

- **Owning Service:** Auth
- **Lifecycle / Mutability:** RUNTIME / MUTABLE_AUDITED
- **Purpose:** Authoritative authentication identity.

### Columns

- `user_id: uuid` PK
- `email: citext` NOT NULL UNIQUE
- `password_hash: text` NOT NULL
- `user_status: text` NOT NULL *(user_status)*
- `account_status: text` NOT NULL *(account_status)*
- `email_verified_at_utc: timestamptz` NULL
- `last_login_at_utc: timestamptz` NULL
- `failed_login_count: int` NOT NULL DEFAULT 0
- `locked_until_utc: timestamptz` NULL
- `created_at_utc: timestamptz` NOT NULL
- `updated_at_utc: timestamptz` NOT NULL

### Constraints

- Email MUST be unique case-insensitively.
- Password MUST never be stored in plaintext.
- Deleted users remain as audit-relevant records.

### Index Guidance

- `uq_users_email`
- `idx_users_status (user_status, account_status)`

---

## A2. roles

- **Owning Service:** Auth
- **Lifecycle / Mutability:** SYSTEM / MUTABLE_AUDITED

### Columns

- `role_id: uuid` PK
- `role_code: text` NOT NULL UNIQUE *(role_code)*
- `name: text` NOT NULL
- `description: text` NULL
- `is_active: boolean` NOT NULL DEFAULT true
- `created_at_utc: timestamptz` NOT NULL
- `updated_at_utc: timestamptz` NOT NULL

---

## A3. permissions

- **Owning Service:** Auth
- **Lifecycle / Mutability:** SYSTEM / MUTABLE_AUDITED

### Columns

- `permission_id: uuid` PK
- `permission_code: text` NOT NULL UNIQUE
- `name: text` NOT NULL
- `description: text` NULL
- `is_active: boolean` NOT NULL DEFAULT true
- `created_at_utc: timestamptz` NOT NULL

---

## A4. role_permissions

- **Owning Service:** Auth
- **Lifecycle / Mutability:** SYSTEM / MUTABLE_AUDITED

### Columns

- `role_id: uuid` PK, FK → `roles.role_id`
- `permission_id: uuid` PK, FK → `permissions.permission_id`
- `created_at_utc: timestamptz` NOT NULL

### Constraints

- Composite PK prevents duplicate assignments.

---

## A5. user_roles

- **Owning Service:** Auth
- **Lifecycle / Mutability:** RUNTIME / MUTABLE_AUDITED

### Columns

- `user_role_id: uuid` PK
- `user_id: uuid` NOT NULL, FK → `users.user_id`
- `role_id: uuid` NOT NULL, FK → `roles.role_id`
- `assigned_at_utc: timestamptz` NOT NULL
- `revoked_at_utc: timestamptz` NULL
- `assigned_by_user_id: uuid` NULL, logical self-reference

### Constraints

- Only one active assignment for the same user/role.

---

## A6. refresh_tokens

- **Owning Service:** Auth
- **Lifecycle / Mutability:** RUNTIME / ROTATING

### Columns

- `refresh_token_id: uuid` PK
- `user_id: uuid` NOT NULL, logical FK → `users.user_id`
- `token_hash: text` NOT NULL UNIQUE
- `family_id: uuid` NOT NULL
- `issued_at_utc: timestamptz` NOT NULL
- `expires_at_utc: timestamptz` NOT NULL
- `revoked_at_utc: timestamptz` NULL
- `replaced_by_token_id: uuid` NULL
- `device_id: text` NULL
- `ip_hash: text` NULL

### Normative Rules

- Store only a hash of the refresh token.
- Refresh token rotation MUST revoke the consumed token.
- Reuse detection SHOULD revoke the token family.

---

## A7. auth_outbox

- **Owning Service:** Auth
- **Lifecycle / Mutability:** RUNTIME / APPEND_ONLY

### Columns

- `outbox_id: bigint` PK
- `event_id: uuid` NOT NULL UNIQUE
- `event_type: text` NOT NULL
- `aggregate_type: text` NOT NULL
- `aggregate_id: uuid` NOT NULL
- `payload_json: jsonb` NOT NULL
- `created_at_utc: timestamptz` NOT NULL
- `published_at_utc: timestamptz` NULL
- `attempt_count: int` NOT NULL DEFAULT 0

---

# 4. User Service — `user_db`

## B1. customer_profiles

- **Owning Service:** User
- **Lifecycle / Mutability:** RUNTIME / MUTABLE_AUDITED

### Columns

- `customer_id: uuid` PK
- `user_id: uuid` NOT NULL UNIQUE, logical FK → Auth `users.user_id`
- `first_name: text` NOT NULL
- `last_name: text` NULL
- `phone: text` NULL
- `profile_image_url: text` NULL
- `created_at_utc: timestamptz` NOT NULL
- `updated_at_utc: timestamptz` NOT NULL

### Normative

- `user_id` is the Auth identity reference.
- User Service MUST NOT create authentication credentials.

---

## B2. addresses

- **Owning Service:** User
- **Lifecycle / Mutability:** RUNTIME / MUTABLE_AUDITED

### Columns

- `address_id: uuid` PK
- `customer_id: uuid` NOT NULL, logical FK → `customer_profiles.customer_id`
- `address_label: text` NULL
- `recipient_name: text` NOT NULL
- `phone: text` NULL
- `address_line1: text` NOT NULL
- `address_line2: text` NULL
- `city: text` NOT NULL
- `state: text` NOT NULL
- `postal_code: text` NOT NULL
- `country_code: char(2)` NOT NULL
- `latitude: numeric(9,6)` NULL
- `longitude: numeric(9,6)` NULL
- `is_default: boolean` NOT NULL DEFAULT false
- `is_active: boolean` NOT NULL DEFAULT true
- `created_at_utc: timestamptz` NOT NULL
- `updated_at_utc: timestamptz` NOT NULL

### Constraints

- A customer may have at most one active default address.

---

## B3. user_outbox

- **Owning Service:** User
- **Lifecycle / Mutability:** RUNTIME / APPEND_ONLY

### Columns

- `outbox_id: bigint` PK
- `event_id: uuid` NOT NULL UNIQUE
- `event_type: text` NOT NULL
- `aggregate_id: uuid` NOT NULL
- `payload_json: jsonb` NOT NULL
- `created_at_utc: timestamptz` NOT NULL
- `published_at_utc: timestamptz` NULL

---

# 5. Catalog Service — `catalog_db`

## C1. categories

- **Owning Service:** Catalog
- **Lifecycle / Mutability:** MASTER_DATA / MUTABLE_AUDITED

### Columns

- `category_id: uuid` PK
- `parent_category_id: uuid` NULL, FK → `categories.category_id`
- `name: text` NOT NULL
- `slug: text` NOT NULL UNIQUE
- `description: text` NULL
- `category_status: text` NOT NULL *(category_status)*
- `sort_order: int` NOT NULL DEFAULT 0
- `created_at_utc: timestamptz` NOT NULL
- `updated_at_utc: timestamptz` NOT NULL

---

## C2. products

- **Owning Service:** Catalog
- **Lifecycle / Mutability:** MASTER_DATA / MUTABLE_AUDITED

### Columns

- `product_id: uuid` PK
- `category_id: uuid` NOT NULL, logical FK → `categories.category_id`
- `sku: text` NOT NULL UNIQUE
- `name: text` NOT NULL
- `slug: text` NOT NULL UNIQUE
- `description: text` NULL
- `unit: text` NOT NULL
- `product_status: text` NOT NULL *(product_status)*
- `tax_rate: numeric(5,2)` NOT NULL DEFAULT 0
- `created_at_utc: timestamptz` NOT NULL
- `updated_at_utc: timestamptz` NOT NULL

### Normative Rules

- SKU MUST be immutable after products are referenced by orders.
- Product deletion SHOULD be implemented as archival/inactivation.
- Product availability is separate from inventory quantity.

---

## C3. product_prices

- **Owning Service:** Catalog
- **Lifecycle / Mutability:** MASTER_DATA / TEMPORAL

### Columns

- `product_price_id: uuid` PK
- `product_id: uuid` NOT NULL, FK → `products.product_id`
- `price: numeric(12,2)` NOT NULL
- `currency_code: char(3)` NOT NULL
- `effective_from_utc: timestamptz` NOT NULL
- `effective_to_utc: timestamptz` NULL
- `created_at_utc: timestamptz` NOT NULL

### Constraints

- Price MUST be >= 0.
- Effective periods for a product MUST NOT overlap.

---

## C4. product_images

- **Owning Service:** Catalog
- **Lifecycle / Mutability:** MASTER_DATA / MUTABLE

### Columns

- `product_image_id: uuid` PK
- `product_id: uuid` NOT NULL, FK → `products.product_id`
- `image_url: text` NOT NULL
- `alt_text: text` NULL
- `sort_order: int` NOT NULL DEFAULT 0
- `is_primary: boolean` NOT NULL DEFAULT false
- `created_at_utc: timestamptz` NOT NULL

---

## C5. catalog_outbox

- **Owning Service:** Catalog
- **Lifecycle / Mutability:** RUNTIME / APPEND_ONLY

### Columns

- `outbox_id: bigint` PK
- `event_id: uuid` NOT NULL UNIQUE
- `event_type: text` NOT NULL
- `aggregate_id: uuid` NOT NULL
- `payload_json: jsonb` NOT NULL
- `created_at_utc: timestamptz` NOT NULL
- `published_at_utc: timestamptz` NULL

---

# 6. Cart Service — `cart_db`

## D1. carts

- **Owning Service:** Cart
- **Lifecycle / Mutability:** RUNTIME / MUTABLE

### Columns

- `cart_id: uuid` PK
- `customer_id: uuid` NULL, logical FK → User Service
- `guest_session_id: uuid` NULL
- `cart_status: text` NOT NULL *(cart_status)*
- `currency_code: char(3)` NOT NULL
- `created_at_utc: timestamptz` NOT NULL
- `updated_at_utc: timestamptz` NOT NULL
- `expires_at_utc: timestamptz` NULL

### Constraints

- Exactly one of `customer_id` or `guest_session_id` MUST identify ownership.
- An authenticated customer SHOULD have at most one active cart.
- Guest session cart ownership MUST be unguessable.

---

## D2. cart_items

- **Owning Service:** Cart
- **Lifecycle / Mutability:** RUNTIME / MUTABLE

### Columns

- `cart_item_id: uuid` PK
- `cart_id: uuid` NOT NULL, FK → `carts.cart_id`
- `product_id: uuid` NOT NULL, logical FK → Catalog
- `quantity: numeric(12,3)` NOT NULL
- `created_at_utc: timestamptz` NOT NULL
- `updated_at_utc: timestamptz` NOT NULL

### Constraints

- Quantity MUST be > 0.
- One cart MUST contain at most one row for a product.

### Normative Rules

- Cart price is informational only.
- Final price MUST be re-read from Catalog during checkout.

---

## D3. cart_outbox

- **Owning Service:** Cart
- **Lifecycle / Mutability:** RUNTIME / APPEND_ONLY

### Columns

- `outbox_id: bigint` PK
- `event_id: uuid` NOT NULL UNIQUE
- `event_type: text` NOT NULL
- `aggregate_id: uuid` NOT NULL
- `payload_json: jsonb` NOT NULL
- `created_at_utc: timestamptz` NOT NULL
- `published_at_utc: timestamptz` NULL

---

# 7. Inventory Service — `inventory_db`

## E1. inventory

- **Owning Service:** Inventory
- **Lifecycle / Mutability:** RUNTIME / MUTABLE_AUDITED

### Columns

- `inventory_id: uuid` PK
- `product_id: uuid` NOT NULL UNIQUE, logical FK → Catalog
- `available_quantity: numeric(12,3)` NOT NULL DEFAULT 0
- `reserved_quantity: numeric(12,3)` NOT NULL DEFAULT 0
- `inventory_status: text` NOT NULL *(inventory_status)*
- `version: bigint` NOT NULL DEFAULT 0
- `updated_at_utc: timestamptz` NOT NULL

### Normative Rules

- `available_quantity >= 0`.
- `reserved_quantity >= 0`.
- Inventory writes MUST use row locking or optimistic versioning.
- Inventory Service is authoritative for stock availability.

---

## E2. inventory_reservations

- **Owning Service:** Inventory
- **Lifecycle / Mutability:** RUNTIME / MUTABLE_AUDITED

### Columns

- `reservation_id: uuid` PK
- `order_id: uuid` NOT NULL, logical FK → Order Service
- `product_id: uuid` NOT NULL, logical FK → Catalog
- `quantity: numeric(12,3)` NOT NULL
- `reservation_status: text` NOT NULL *(reservation_status)*
- `expires_at_utc: timestamptz` NULL
- `created_at_utc: timestamptz` NOT NULL
- `updated_at_utc: timestamptz` NOT NULL

### Constraints

- Quantity MUST be > 0.
- Reservation IDs MUST be idempotent for repeated checkout requests.

---

## E3. inventory_transactions

- **Owning Service:** Inventory
- **Lifecycle / Mutability:** RUNTIME / APPEND_ONLY

### Columns

- `inventory_transaction_id: bigint` PK
- `transaction_uuid: uuid` NOT NULL UNIQUE
- `inventory_id: uuid` NOT NULL, FK → `inventory.inventory_id`
- `product_id: uuid` NOT NULL, logical FK → Catalog
- `transaction_type: text` NOT NULL *(inventory_transaction_type)*
- `quantity: numeric(12,3)` NOT NULL
- `reference_type: text` NULL
- `reference_id: uuid` NULL
- `occurred_at_utc: timestamptz` NOT NULL
- `metadata_json: jsonb` NULL

### Normative

- Inventory transactions are immutable.
- Every stock mutation MUST create an inventory transaction.

---

## E4. inventory_outbox

- **Owning Service:** Inventory
- **Lifecycle / Mutability:** RUNTIME / APPEND_ONLY

### Columns

- `outbox_id: bigint` PK
- `event_id: uuid` NOT NULL UNIQUE
- `event_type: text` NOT NULL
- `aggregate_id: uuid` NOT NULL
- `payload_json: jsonb` NOT NULL
- `created_at_utc: timestamptz` NOT NULL
- `published_at_utc: timestamptz` NULL

---

# 8. Order Service — `order_db`

## F1. orders

- **Owning Service:** Order
- **Lifecycle / Mutability:** RUNTIME / MUTABLE_AUDITED

### Columns

- `order_id: uuid` PK
- `order_number: text` NOT NULL UNIQUE
- `customer_id: uuid` NOT NULL, logical FK → User
- `address_id: uuid` NOT NULL, logical FK → User
- `order_status: text` NOT NULL *(order_status)*
- `currency_code: char(3)` NOT NULL
- `subtotal: numeric(12,2)` NOT NULL
- `discount_total: numeric(12,2)` NOT NULL DEFAULT 0
- `tax_total: numeric(12,2)` NOT NULL DEFAULT 0
- `delivery_fee: numeric(12,2)` NOT NULL DEFAULT 0
- `grand_total: numeric(12,2)` NOT NULL
- `placed_at_utc: timestamptz` NOT NULL
- `confirmed_at_utc: timestamptz` NULL
- `cancelled_at_utc: timestamptz` NULL
- `delivered_at_utc: timestamptz` NULL
- `created_at_utc: timestamptz` NOT NULL
- `updated_at_utc: timestamptz` NOT NULL

### Normative Rules

- Totals MUST be calculated by Order Service.
- Client totals are untrusted.
- Order creation MUST be idempotent.
- Cross-service operations MUST use a saga/orchestration pattern; distributed database transactions are forbidden.
- Historical address data SHOULD be snapshotted where legally/business-required.

---

## F2. order_items

- **Owning Service:** Order
- **Lifecycle / Mutability:** RUNTIME / IMMUTABLE_AFTER_CONFIRMATION

### Columns

- `order_item_id: uuid` PK
- `order_id: uuid` NOT NULL, FK → `orders.order_id`
- `product_id: uuid` NOT NULL, logical FK → Catalog
- `sku_snapshot: text` NOT NULL
- `product_name_snapshot: text` NOT NULL
- `unit_snapshot: text` NOT NULL
- `quantity: numeric(12,3)` NOT NULL
- `unit_price: numeric(12,2)` NOT NULL
- `discount_amount: numeric(12,2)` NOT NULL DEFAULT 0
- `tax_amount: numeric(12,2)` NOT NULL DEFAULT 0
- `line_total: numeric(12,2)` NOT NULL
- `created_at_utc: timestamptz` NOT NULL

### Normative

- Product name, SKU, unit, and price are historical snapshots.
- Product changes MUST NOT alter historical order items.
- `line_total` MUST equal the server-calculated line amount.

---

## F3. order_status_history

- **Owning Service:** Order
- **Lifecycle / Mutability:** RUNTIME / APPEND_ONLY

### Columns

- `order_status_history_id: bigint` PK
- `order_id: uuid` NOT NULL, FK → `orders.order_id`
- `from_status: text` NULL *(order_status)*
- `to_status: text` NOT NULL *(order_status)*
- `changed_by_user_id: uuid` NULL, logical FK → Auth
- `reason_code: text` NULL
- `notes: text` NULL
- `changed_at_utc: timestamptz` NOT NULL

### Normative

- Every order status change MUST create a history record.
- History is immutable.
- Invalid status transitions MUST be rejected server-side.

---

## F4. order_idempotency_keys

- **Owning Service:** Order
- **Lifecycle / Mutability:** RUNTIME / IMMUTABLE

### Columns

- `idempotency_key_id: uuid` PK
- `customer_id: uuid` NOT NULL
- `idempotency_key: text` NOT NULL
- `request_hash: text` NOT NULL
- `order_id: uuid` NULL
- `created_at_utc: timestamptz` NOT NULL
- `expires_at_utc: timestamptz` NOT NULL

### Constraints

- `UNIQUE(customer_id, idempotency_key)`

---

## F5. order_outbox

- **Owning Service:** Order
- **Lifecycle / Mutability:** RUNTIME / APPEND_ONLY

### Columns

- `outbox_id: bigint` PK
- `event_id: uuid` NOT NULL UNIQUE
- `event_type: text` NOT NULL
- `aggregate_id: uuid` NOT NULL
- `payload_json: jsonb` NOT NULL
- `created_at_utc: timestamptz` NOT NULL
- `published_at_utc: timestamptz` NULL

---

# 9. Payment Service — `payment_db`

## G1. payments

- **Owning Service:** Payment
- **Lifecycle / Mutability:** RUNTIME / MUTABLE_AUDITED

### Columns

- `payment_id: uuid` PK
- `order_id: uuid` NOT NULL UNIQUE, logical FK → Order
- `customer_id: uuid` NOT NULL, logical FK → User
- `amount: numeric(12,2)` NOT NULL
- `currency_code: char(3)` NOT NULL
- `payment_status: text` NOT NULL *(payment_status)*
- `provider: text` NOT NULL
- `provider_payment_id: text` NULL UNIQUE
- `failure_code: text` NULL
- `failure_message: text` NULL
- `created_at_utc: timestamptz` NOT NULL
- `updated_at_utc: timestamptz` NOT NULL

### Normative

- Payment Service is authoritative for payment state.
- Provider secrets MUST NOT be stored in client applications.
- Sensitive payment credentials MUST NOT be stored unless explicitly required and compliant with payment-provider rules.

---

## G2. payment_transactions

- **Owning Service:** Payment
- **Lifecycle / Mutability:** RUNTIME / APPEND_ONLY

### Columns

- `payment_transaction_id: bigint` PK
- `transaction_uuid: uuid` NOT NULL UNIQUE
- `payment_id: uuid` NOT NULL, FK → `payments.payment_id`
- `transaction_type: text` NOT NULL *(payment_transaction_type)*
- `transaction_status: text` NOT NULL *(payment_transaction_status)*
- `amount: numeric(12,2)` NOT NULL
- `provider_transaction_id: text` NULL
- `provider_response_json: jsonb` NULL
- `created_at_utc: timestamptz` NOT NULL

---

## G3. refunds

- **Owning Service:** Payment
- **Lifecycle / Mutability:** RUNTIME / APPEND_ONLY

### Columns

- `refund_id: uuid` PK
- `payment_id: uuid` NOT NULL, FK → `payments.payment_id`
- `amount: numeric(12,2)` NOT NULL
- `reason: text` NULL
- `provider_refund_id: text` NULL
- `created_at_utc: timestamptz` NOT NULL

---

## G4. payment_outbox

- **Owning Service:** Payment
- **Lifecycle / Mutability:** RUNTIME / APPEND_ONLY

### Columns

- `outbox_id: bigint` PK
- `event_id: uuid` NOT NULL UNIQUE
- `event_type: text` NOT NULL
- `aggregate_id: uuid` NOT NULL
- `payload_json: jsonb` NOT NULL
- `created_at_utc: timestamptz` NOT NULL
- `published_at_utc: timestamptz` NULL

---

# 10. Notification Service — `notification_db`

## H1. notifications

- **Owning Service:** Notification
- **Lifecycle / Mutability:** RUNTIME / MUTABLE_AUDITED

### Columns

- `notification_id: uuid` PK
- `user_id: uuid` NOT NULL, logical FK → Auth
- `order_id: uuid` NULL, logical FK → Order
- `notification_type: text` NOT NULL *(notification_type)*
- `channel: text` NOT NULL *(notification_channel)*
- `recipient: text` NOT NULL
- `title: text` NULL
- `message: text` NOT NULL
- `notification_status: text` NOT NULL *(notification_status)*
- `scheduled_at_utc: timestamptz` NULL
- `sent_at_utc: timestamptz` NULL
- `created_at_utc: timestamptz` NOT NULL
- `updated_at_utc: timestamptz` NOT NULL

---

## H2. notification_delivery_logs

- **Owning Service:** Notification
- **Lifecycle / Mutability:** RUNTIME / APPEND_ONLY

### Columns

- `delivery_log_id: bigint` PK
- `notification_id: uuid` NOT NULL, FK → `notifications.notification_id`
- `attempt_number: int` NOT NULL
- `status: text` NOT NULL
- `provider_message_id: text` NULL
- `error_message: text` NULL
- `attempted_at_utc: timestamptz` NOT NULL

---

# 11. Audit Service — `audit_db`

## I1. audit_logs

- **Owning Service:** Audit
- **Lifecycle / Mutability:** RUNTIME / APPEND_ONLY

### Columns

- `audit_log_id: bigint` PK
- `event_uuid: uuid` NOT NULL UNIQUE
- `actor_user_id: uuid` NULL, logical FK → Auth
- `actor_role: text` NULL
- `service_name: text` NOT NULL
- `action: text` NOT NULL *(audit_action)*
- `entity_type: text` NOT NULL
- `entity_id: uuid` NULL
- `request_id: text` NULL
- `trace_id: text` NULL
- `ip_hash: text` NULL
- `metadata_json: jsonb` NULL
- `occurred_at_utc: timestamptz` NOT NULL

### Normative Rules

- Audit records are append-only.
- Passwords, access tokens, refresh tokens, payment secrets, and other sensitive credentials MUST NOT be written to audit payloads.
- Audit Service is independent from operational service databases.

---

# 12. Cross-Service Relationships

Cross-service relationships are logical only.

```text
Auth.users
  ├── User.customer_profiles
  ├── Auth.user_roles
  ├── Cart.carts
  ├── Order.orders
  ├── Payment.payments
  └── Notification.notifications

User.customer_profiles
  └── User.addresses

Catalog.categories
  └── Catalog.products
       ├── Catalog.product_prices
       ├── Catalog.product_images
       ├── Cart.cart_items
       ├── Inventory.inventory
       ├── Inventory.inventory_reservations
       └── Order.order_items

Order.orders
  ├── Order.order_items
  ├── Order.order_status_history
  ├── Inventory.inventory_reservations
  └── Payment.payments

Payment.payments
  ├── Payment.payment_transactions
  └── Payment.refunds

Notification.notifications
  └── Notification.notification_delivery_logs
```

---

# 13. Event Architecture

Each stateful service uses the Transactional Outbox Pattern.

```text
Service Transaction
      |
      +-- update authoritative tables
      |
      +-- insert outbox event
      |
      COMMIT
          |
          v
     Outbox Publisher
          |
          v
     Message Broker
          |
    +-----+------+---------+
    |            |         |
 Consumer A   Consumer B  Consumer C
```

## Canonical Events

### Auth
- `UserRegistered`
- `UserRoleChanged`
- `UserSuspended`

### User
- `CustomerProfileUpdated`
- `AddressCreated`
- `AddressUpdated`

### Catalog
- `ProductCreated`
- `ProductUpdated`
- `ProductPriceChanged`
- `ProductArchived`

### Cart
- `CartCreated`
- `CartItemAdded`
- `CartItemUpdated`
- `CartItemRemoved`
- `GuestCartMerged`

### Inventory
- `InventoryStockChanged`
- `InventoryReserved`
- `InventoryReservationReleased`
- `InventoryReservationConsumed`
- `InventoryReservationFailed`

### Order
- `OrderCreated`
- `OrderConfirmed`
- `OrderProcessing`
- `OrderReady`
- `OrderOutForDelivery`
- `OrderDelivered`
- `OrderCancelled`

### Payment
- `PaymentAuthorized`
- `PaymentCaptured`
- `PaymentFailed`
- `PaymentRefunded`

### Notification
- `NotificationSent`
- `NotificationFailed`

---

# 14. Checkout Saga

Checkout MUST be implemented as a distributed workflow, not a cross-database transaction.

```text
Customer
   |
   v
API Gateway
   |
   v
Order Service
   |
   +--> validate customer/address
   |
   +--> Cart Service: get active cart
   |
   +--> Catalog Service: get current prices
   |
   +--> Inventory Service: reserve stock
   |          |
   |          +--> InventoryReserved
   |
   +--> Order Service creates order
   |
   +--> Payment Service
             |
             +--> PaymentCaptured
                     |
                     v
                 Order Confirmed
                     |
              +------+------+
              |             |
              v             v
       Notification      Audit
```

## Failure Compensation

```text
PaymentFailed
     |
     v
Order Service
     |
     +--> Cancel order
     |
     +--> Inventory Service
             |
             +--> Release reservation
```

If reservation fails:

```text
InventoryReservationFailed
          |
          v
Order Service
          |
          +--> checkout/order creation fails
```

Every saga step MUST be idempotent.

---

# 15. Guest Cart → Authenticated Checkout

```text
Guest
 |
 v
Cart Service
 |
 +-- guest_session_id
 +-- cart_items
 |
 v
Login/Register
 |
 v
Auth Service
 |
 +-- user_id
 |
 v
Cart Service
 |
 +-- merge guest cart
 |
 v
Authenticated Cart
 |
 v
Checkout
 |
 v
Order Service
```

Guest users may:
- Browse products
- Search products
- View product details
- Add items to cart
- Update quantities
- Remove items

Authentication is required to:
- Checkout
- Place order
- View personal orders
- Manage profile
- Manage addresses

---

# 16. RBAC / Permission Matrix

Roles are implemented in Auth Service only.

| Permission | CUSTOMER | MANAGER | ADMIN |
|---|---:|---:|---:|
| product.read | YES | YES | YES |
| category.read | YES | YES | YES |
| cart.manage_own | YES | YES | YES |
| order.create | YES | NO* | YES |
| order.read_own | YES | NO | YES |
| order.read_all | NO | YES | YES |
| order.update_status | NO | YES | YES |
| product.create | NO | Optional | YES |
| product.update | NO | Optional | YES |
| product.delete | NO | NO | YES |
| inventory.read | NO | YES | YES |
| inventory.adjust | NO | NO/Optional | YES |
| customer.read | Own | YES | YES |
| customer.update | Own | YES | YES |
| user.manage_roles | NO | NO | YES |
| audit.read | NO | Optional | YES |

`*` Manager permissions are configurable through RBAC; they do not require a separate Manager API.

---

# 17. API Design Rules

APIs are resource-oriented and shared across roles.

Examples:

```http
GET    /api/v1/products
GET    /api/v1/products/:productId
POST   /api/v1/products
PATCH  /api/v1/products/:productId
DELETE /api/v1/products/:productId

GET    /api/v1/cart
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:itemId
DELETE /api/v1/cart/items/:itemId

POST   /api/v1/orders
GET    /api/v1/orders
GET    /api/v1/orders/:orderId
PATCH  /api/v1/orders/:orderId/status

POST   /api/v1/payments
GET    /api/v1/payments/:paymentId

GET    /api/v1/customers/me
GET    /api/v1/customers/me/addresses
POST   /api/v1/customers/me/addresses
PATCH  /api/v1/customers/me/addresses/:addressId
```

Authorization is evaluated after authentication.

Do NOT create:

```text
/admin/orders
/manager/orders
/customer/orders
```

unless there is a genuine resource boundary requiring separate routing. Prefer:

```text
/orders
```

with permission-aware behavior.

---

# 18. API Gateway Responsibilities

The Gateway is not a business-data owner.

It MUST handle:

- TLS termination
- Request ID / trace ID
- Authentication token validation or propagation
- Rate limiting
- CORS
- Request size limits
- Routing
- API versioning
- Basic request validation
- Security headers
- Service timeout/circuit-breaker policy

Business authorization MUST still be enforced by downstream services.

---

# 19. Security Rules

1. Passwords MUST use a modern adaptive password hash such as Argon2id or bcrypt with appropriate configuration.
2. Access tokens MUST be short-lived.
3. Refresh tokens MUST rotate and be revocable.
4. Refresh tokens MUST be stored hashed.
5. Rate-limit login, registration, password reset, and payment endpoints.
6. Validate all request payloads server-side.
7. Use parameterized SQL or a safe ORM/query builder.
8. Never trust client totals.
9. Never expose database credentials to frontend applications.
10. Never expose service databases directly to the internet.
11. Use service-to-service authentication.
12. Use TLS for external and internal network communication where applicable.
13. Never log passwords, tokens, payment secrets, or sensitive personal data.
14. Audit privileged actions.
15. Apply least-privilege database users per service.

---

# 20. Transactional Requirements

## Within one service

ACID transactions SHOULD be used for operations such as:

```text
Order Service:
  orders
  order_items
  order_status_history
  order_idempotency_keys
  outbox
```

and:

```text
Inventory Service:
  inventory
  inventory_reservations
  inventory_transactions
  outbox
```

## Across services

NEVER use:

```text
BEGIN
  Auth DB
  User DB
  Order DB
  Inventory DB
COMMIT
```

Instead use:

- Saga orchestration
- Events
- Transactional outbox
- Idempotent consumers
- Compensation actions

---

# 21. Database Rules

Each service owns its schema.

```text
auth_db
user_db
catalog_db
cart_db
inventory_db
order_db
payment_db
notification_db
audit_db
```

No shared tables.

No cross-database foreign keys.

No service may bypass another service's API/event contract to read its database.

Read models may be built from events when a screen needs combined data.

---

# 22. Recommended Read Model

For manager/admin order screens, do not create cross-service SQL joins.

Use:

```text
Order Service
     |
     | OrderCreated / OrderStatusChanged
     v
Message Broker
     |
     v
Order Query Projection
     |
     +-- order_id
     +-- order_number
     +-- customer_id
     +-- customer_name_snapshot
     +-- order_status
     +-- grand_total
     +-- payment_status_projection
     +-- item_count
     +-- created_at
```

This allows the Manager UI to display operational information without violating database ownership.

---

# 23. Observability

Every request/event SHOULD carry:

- `request_id`
- `trace_id`
- `correlation_id`
- `event_id`

Services SHOULD expose:

```text
/health
/ready
/metrics
```

Recommended observability stack:

```text
OpenTelemetry
      |
      +--> Logs
      +--> Metrics
      +--> Distributed Traces
```

---

# 24. High-Level ERD

```text
                           ┌───────────────────┐
                           │    API Gateway    │
                           └─────────┬─────────┘
                                     │
              ┌──────────────────────┼───────────────────────┐
              │                      │                       │
              v                      v                       v
       ┌────────────┐         ┌────────────┐          ┌─────────────┐
       │Auth Service│         │User Service│          │   Catalog   │
       │  auth_db   │         │  user_db   │          │ catalog_db  │
       │ users      │         │ profiles   │          │ categories  │
       │ roles      │         │ addresses  │          │ products    │
       │ permissions│         └────────────┘          │ prices      │
       └─────┬──────┘                                 │ images      │
             │                                        └──────┬──────┘
             │                                               │
             v                                               v
       ┌────────────┐                                  ┌────────────┐
       │Cart Service│                                  │ Inventory  │
       │  cart_db   │                                  │ inventory_db│
       │ carts      │                                  │ stock      │
       │ cart_items │                                  │ reservations│
       └─────┬──────┘                                  │ transactions│
             │                                         └─────┬──────┘
             │                                               │
             └──────────────────┬────────────────────────────┘
                                v
                         ┌───────────────┐
                         │ Order Service │
                         │   order_db    │
                         │ orders        │
                         │ order_items   │
                         │ status_history│
                         └───────┬───────┘
                                 │
                    ┌────────────┼─────────────┐
                    v            v             v
              ┌──────────┐ ┌────────────┐ ┌──────────────┐
              │ Payment  │ │Notification│ │    Audit     │
              │ Service  │ │  Service   │ │   Service    │
              │payment_db│ │notification│ │   audit_db   │
              └──────────┘ └────────────┘ └──────────────┘

                         ┌─────────────────┐
                         │ Message Broker  │
                         │ RabbitMQ/Kafka  │
                         └─────────────────┘
```

---

# 25. Implementation Order

Recommended implementation sequence:

1. API Gateway
2. Auth Service
3. User Service
4. Catalog Service
5. Cart Service
6. Inventory Service
7. Order Service
8. Payment Service
9. Notification Service
10. Audit Service
11. Message Broker / Outbox
12. Observability
13. Docker Compose
14. Kubernetes deployment

This ERD is intended to be the **canonical microservices data-model specification** for implementing the Food Application with Cursor.
