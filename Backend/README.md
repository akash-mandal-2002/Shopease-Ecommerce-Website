# ShopEase Backend — MongoDB edition

Express 5 REST API for the ShopEase MERN academic project. MongoDB/Mongoose remains the persistence layer and application-facing IDs remain strings.

## Setup

1. Use Node.js 20.19+ (or the version required by the installed dependencies).
2. Run `npm install` in `Backend_1`.
3. Copy `.env.example` to `.env` and set a random `JWT_SECRET` of at least 32 characters plus a reachable `MONGODB_URI`. The example URI targets local MongoDB; it will not connect unless MongoDB is running locally. Never commit `.env`.
4. To enable admin login, set **both** `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` to credentials you choose (password at least 8 characters). These explicit credentials create/promote the admin on startup and reset that configured account's password to the supplied value. There are intentionally no built-in admin credentials.
5. From `Backend_1`, run `npm install`, then `npm run seed` against an empty development database to import bundled JSON data, then `npm run dev`.
6. In `Frontend_1`, copy `.env.example` to `.env` and confirm `VITE_API_URL=http://localhost:5000/api`. Run `npm install` and `npm run dev` in that folder. Use the Vite URL printed in the terminal.
7. Check `http://localhost:5000/api/health` before testing registration/login. If it does not return JSON, the API/database configuration must be fixed before auth can work.

**Credential hygiene:** the supplied archive previously contained a live MongoDB URI and JWT secret. Those values were removed from the deliverable, but must be rotated manually in MongoDB Atlas and in your local `.env`; never paste the values into source control or reports.

### Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 5000) |
| `CLIENT_URL` | Allowed frontend origin(s), comma-separated; default `http://localhost:5173` (development also allows localhost/127.0.0.1 Vite ports) |
| `NODE_ENV` | Runtime mode |
| `JWT_SECRET` | Required in all environments; at least 32 characters |
| `MONGODB_URI` | MongoDB connection string |
| `SEED_ADMIN_EMAIL` | Admin email; must be paired with password to enable admin login |
| `SEED_ADMIN_PASSWORD` | Admin password, minimum 8 characters; configured account is synchronized at startup |
| `USE_DUMMYJSON_PRODUCTS` | Opt-in external DummyJSON catalog sync; default `false` |
| `DUMMYJSON_PRICE_MULTIPLIER` | Optional demo price multiplier (default 85) |

## Seeding and migration

`npm run seed` and startup migration use `src/services/legacyMigrationService.js`. Each JSON source is imported only when its corresponding collection is empty; non-empty collections are not wiped or overwritten. Re-running the command is safe for already populated collections. The bundled image URLs still depend on external CDNs. Product `status` and `code` are backfilled without overwriting existing values. The bundled seed currently has 194 products across 24 categories; fashion categories cover apparel, but no books category is present. Books were not invented as seed records without owner approval. Back up the database before first migration.

## Order status transitions

| Current status | Allowed next status | Actor |
|---|---|---|
| `confirmed` | `dispatched`, `cancelled` | Admin; customer may cancel only while confirmed |
| `dispatched` | `delivered`, `cancelled` | Admin |
| `delivered` | none (terminal) | — |
| `cancelled` | none (terminal) | — |

Inventory decrements use an atomic stock guard. Cancellation restores stock once, tracked by `stockRestored`. COD cancellation marks payment `failed`; COD delivery marks it `success`. Digital payment and refund notes are simulated; no real gateway is connected. Order `statusHistory` supports customer tracking.

## API overview

- Auth: register/login/me/profile/change-password. Register/login are throttled to 10 attempts per IP per 15 minutes.
- Products: search, filtering, sorting and pagination are applied before results are returned; admin can view inactive products.
- Cart: variant-aware update/remove and `DELETE /api/cart` clear-cart endpoint.
- Orders: checkout, history, cancellation, return requests, invoice JSON; admin order/payment/return review.
- Admin: user/customer management, reports, product/category management and inquiry replies.
- Inquiries: authenticated customer support with persisted admin replies.

## Reports

Reports are generated on demand by an authenticated admin, not sent by scheduled email. Sales use orders/payments; inventory uses products; customer activity uses users/orders. Suggested review cadence: sales daily, inventory weekly, customer activity monthly. CSV export is generated in the browser.

## Schema mapping

See `docs/schema-mapping.md` for synopsis-to-code mapping and deliberate backward-compatible deviations. String IDs, `title`/`mrp` and `images: string[]` remain unchanged to preserve existing frontend and stored records.

## Payment and future scope

UPI, card and net-banking are simulated for the academic demonstration. Card number/CVV are not sent to the API or stored; only card brand, expiry and last four digits are submitted/retained for the simulated authorization. Luhn validation happens in the browser because the server deliberately never receives the full PAN; this is not a real payment authorization mechanism. A real gateway, email-based password reset and email verification require separate provider configuration and remain future scope.
