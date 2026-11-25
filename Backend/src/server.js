import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import { repositories } from './repositories/index.js';
import { migrateLegacyJsonIfNeeded } from './services/legacyMigrationService.js';
import { syncDummyJsonProductsIfNeeded } from './services/dummyJsonProductService.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import inquiryRoutes from './routes/inquiryRoutes.js';

const app = express();
app.disable('x-powered-by');
const allowedClientOrigins = new Set(String(process.env.CLIENT_URL || env.clientUrl).split(',').map((value) => value.trim()).filter(Boolean));
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || allowedClientOrigins.has(origin)) return callback(null, true);
    // Vite may select the next available localhost port when 5173 is occupied.
    if (!env.isProduction && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return callback(null, true);
    return callback(new Error('This frontend origin is not allowed by CLIENT_URL.'));
  },
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.get('/api/health', (_req, res) => res.json({ success: true, service: 'ShopEase API', database: 'connected', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/inquiries', inquiryRoutes);

app.use((_req, res) => res.status(404).json({ success: false, message: 'API route not found.' }));
app.use((error, _req, res, _next) => {
  if (error?.name === 'SyntaxError' && Object.prototype.hasOwnProperty.call(error, 'body')) {
    return res.status(400).json({ success: false, message: 'Request body contains invalid JSON.' });
  }
  if (error?.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Validation failed.', details: Object.values(error.errors).map((item) => item.message) });
  console.error(error);
  const status = Number(error.status) || 500;
  return res.status(status).json({ success: false, message: status >= 500 ? 'Something went wrong on the server.' : error.message, ...(error.details ? { details: error.details } : {}) });
});

async function ensureAdmin() {
  if (!env.seedAdminEmail || !env.seedAdminPassword) {
    console.warn('No administrator configured. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in Backend_1/.env to create or configure an admin account.');
    return;
  }
  const email = env.seedAdminEmail.trim().toLowerCase();
  const password = await bcrypt.hash(env.seedAdminPassword, 12);
  const existingUser = await repositories.users.findOne({ email });
  if (existingUser) {
    // Explicit seed credentials are authoritative. This also repairs an older seeded
    // account whose password hash cannot be recovered from the source archive.
    await repositories.users.update(existingUser.id, { role: 'admin', password, emailVerified: true });
    console.log(`Configured administrator account: ${email}`);
    return;
  }
  await repositories.users.insert({ id: `u-admin-${Date.now()}`, name: 'ShopEase Admin', email, phone: '', password, address: '', pincode: '', gender: '', role: 'admin', emailVerified: true, createdAt: new Date().toISOString() });
  console.log(`Seeded administrator account: ${email}`);
}

async function backfillProductMetadata() {
  // Avoid loading the whole catalog and issuing one write per product on every boot.
  // Only legacy records missing the additive fields are fetched and updated.
  const products = await repositories.products.find({ $or: [
    { status: { $exists: false } }, { status: null }, { status: '' },
    { code: { $exists: false } }, { code: null }, { code: '' },
  ] }, { projection: { id: 1, code: 1, status: 1 } });
  if (!products.length) return;
  const seen = new Set((await repositories.products.find({}, { projection: { code: 1 } })).map((p) => String(p.code || '').toUpperCase()).filter(Boolean));
  const operations = [];
  for (const product of products) {
    const patch = {};
    if (!product.status) patch.status = 'Active';
    if (!product.code) {
      let code;
      do { code = `SE-${String(product.id).replace(/[^a-z0-9]/gi, '').slice(-8).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`; } while (seen.has(code));
      seen.add(code);
      patch.code = code;
    }
    if (Object.keys(patch).length) operations.push({ updateOne: { filter: { id: product.id }, update: { $set: patch } } });
  }
  if (operations.length) await repositories.products.bulkWrite(operations);
  console.log(`Backfilled catalog metadata for ${operations.length} legacy products.`);
}

async function bootstrap() {
  await connectDatabase();
  await migrateLegacyJsonIfNeeded();
  const syncResult = await syncDummyJsonProductsIfNeeded();
  if (syncResult.synced) console.log(`Synced ${syncResult.count} products from DummyJSON into MongoDB.`);
  await backfillProductMetadata();
  await ensureAdmin();
  const server = app.listen(env.port, '0.0.0.0', () => console.log(`ShopEase API running on http://0.0.0.0:${env.port}`));
  const shutdown = (signal) => server.close(() => process.exit(signal === 'SIGINT' ? 130 : 0));
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('Failed to start ShopEase API:', error.message);
  process.exit(1);
});
