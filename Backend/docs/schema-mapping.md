# ShopEase schema mapping (synopsis §6.4–§6.5)

This is the implementation mapping for the submitted MERN project. It intentionally documents the schema that the application actually uses rather than claiming a non-existent field or migration. Application-facing IDs remain strings; MongoDB `_id` remains an internal Mongoose identifier.

## Field-by-field mapping

| Collection / synopsis concept | Implemented fields | Deliberate compatibility notes |
|---|---|---|
| **Users** — name, email, phone, password, address, pincode, gender, role, created date | `id`, `name`, `email`, `phone`, `password`, `address`, `pincode`, `gender`, `role`, `createdAt` | `password` is a bcrypt hash. New registration requires unique 10–15 digit phone; a partial unique index permits legacy empty phones. Gender is `Male`, `Female`, `Other`, or blank. `role` is `customer` or `admin`. |
| **Categories** — category identity, name, description, image | `id`, `name`, `slug`, `description`, `image`, `createdAt` | `slug` is the storefront/category URL key. |
| **Products** — code, name, description, price, MRP, discount, category, stock, images, status, tags/variants/flags | `id`, `code`, `title`, `description`, `price`, `mrp`, `discount`, `category`, `categorySlug`, `subcategory`, `brand`, `images: string[]`, `rating`, `reviewCount`, `stock`, `tags`, `variants`, `featured`, `trending`, `new`, `status`, `source`, `sourceId`, `createdAt` | Synopsis `name` maps to `title`; `mrpPrice` maps to `mrp`; image URLs stay a string array rather than `{url,isPrimary}` objects. `code` is unique and uppercase; `status` is `Active`/`Inactive`; missing metadata is backfilled without replacing existing values. `source`/`sourceId` identify optional DummyJSON imports. |
| **Cart** — customer, items, total price | `id`, `userId`, `items: [{productId, quantity, variant}]`, `updatedAt` | `totalPrice` is calculated from current product prices in the API response, not stored as a stale database field. Lines are identified by product plus variant. |
| **Orders** — order identity, customer, date, items, address, totals, status, payment link | `id`, `userId`, `orderDate`, `status`, `statusHistory`, `stockRestored`, `returnStatus`, `returnReason`, `returnRequestedAt`, `returnReviewedAt`, `returnAdminNote`, `shippingAddress`, `billingAddress`, `items`, `subtotal`, `shipping`, `tax`, `totalAmount`, `paymentMethod`, `paymentStatus`, `paymentId`, `cancelledAt` | Status history is additive for legacy orders. `stockRestored` guards one-time cancellation restoration. IDs and `paymentId` remain strings. Existing orders without the additive fields continue to be read. |
| **Payments** — payment identity, order, amount, method, transaction, status | `id`, `orderId`, `amount`, `method`, `provider`, `transactionId`, `status`, `paymentDate`, `note`, `cardLast4`, `cardBrand` | `orderId` remains a public string. Card PAN and CVV are never sent to the API or stored; digital transactions are simulated. Status values are `pending`, `success`, `failed`. |
| **Inquiries** — customer communication, status, response | `id`, `userId`, `subject`, `message`, `status`, `createdAt`, `updatedAt`, `reply`, `repliedAt` | Admin reply is optional and capped at 1000 characters. Customers can read only their own inquiries. |

## Indexes and validation

- Unique application `id` per collection; unique user email; partial unique phone index for non-empty strings; unique sparse product code; unique cart per user.
- Supporting indexes include product `categorySlug`/`brand`, order `userId + orderDate`, and payment `orderId`.
- Registration validates name/email/password/phone; product writes whitelist accepted fields and validate price/MRP/stock/status; order stock decrement uses a MongoDB `$gte` guard with `$inc`.

## Seed catalog audit

The bundled `src/data/products.json` has **194 products across 24 categories**:

| Category slug | Products | Category slug | Products |
|---|---:|---|---:|
| beauty | 5 | fragrances | 5 |
| furniture | 5 | groceries | 27 |
| home-decoration | 5 | kitchen-accessories | 30 |
| laptops | 5 | mens-shirts | 5 |
| mens-shoes | 5 | mens-watches | 6 |
| mobile-accessories | 14 | motorcycle | 5 |
| skin-care | 3 | smartphones | 16 |
| sports-accessories | 17 | sunglasses | 5 |
| tablets | 3 | tops | 5 |
| vehicle | 5 | womens-bags | 5 |
| womens-dresses | 5 | womens-jewellery | 3 |
| womens-shoes | 5 | womens-watches | 5 |

Fashion categories provide apparel coverage, but **there is no books category** in the bundled data. No hand-written book records have been added without owner confirmation. The live MongoDB category/product counts cannot be verified from the source archive because no database credentials are shipped.

## Deliberate deviations and future scope

- Keep string IDs, `title`/`mrp`, and `images: string[]` for compatibility with current API clients and seed data. No destructive ObjectId conversion or field rename was performed.
- Schemas remain `strict: false` for legacy JSON compatibility; product API input is explicitly whitelisted. Enabling strict mode should be a separately tested migration after all historic fields are enumerated.
- Cart totals are derived. `Payment.orderId` is a string. Real payment gateways, email verification, and email-based password reset are future scope because they require external providers not specified by the synopsis.
