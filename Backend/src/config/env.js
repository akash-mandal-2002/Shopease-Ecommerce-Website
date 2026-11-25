import dotenv from 'dotenv';
dotenv.config();
const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || '';
if (jwtSecret.length < 32) throw new Error('JWT_SECRET is required in every environment and must be at least 32 characters long. Set it in Backend_1/.env.');
const seedAdminEmail = process.env.SEED_ADMIN_EMAIL || '';
const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD || '';
if (seedAdminPassword && seedAdminPassword.length < 8) throw new Error('SEED_ADMIN_PASSWORD must be at least 8 characters long.');
export const env = {
 nodeEnv: process.env.NODE_ENV || 'development', isProduction, port: Number(process.env.PORT || 5000),
 clientUrl: process.env.CLIENT_URL || 'http://localhost:5173', jwtSecret,
 mongoUri: process.env.MONGODB_URI || '', seedAdminEmail, seedAdminPassword,
 useDummyJsonProducts: String(process.env.USE_DUMMYJSON_PRODUCTS ?? 'false').toLowerCase() === 'true',
 dummyJsonPriceMultiplier: Number(process.env.DUMMYJSON_PRICE_MULTIPLIER || 85),
 // SMTP (read directly in emailService.js; documented here for completeness)
 smtpHost: process.env.SMTP_HOST || '',
 smtpPort: Number(process.env.SMTP_PORT || 587),
 smtpUser: process.env.SMTP_USER || '',
 smtpPass: process.env.SMTP_PASS || '',
 emailFrom: process.env.EMAIL_FROM || process.env.SMTP_USER || '',
};
