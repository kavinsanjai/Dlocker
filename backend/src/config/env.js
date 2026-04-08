import dotenv from 'dotenv'

dotenv.config()

const required = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_STORAGE_BUCKET',
  'JWT_SECRET',
]

required.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`)
  }
})

const env = {
  port: Number(process.env.PORT || 5000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  ocrEnabled: (process.env.OCR_ENABLED || 'true').toLowerCase() === 'true',
  storageQuotaMb: Number(process.env.STORAGE_QUOTA_MB || 100),
  defaultShareExpiryHours: Number(process.env.DEFAULT_SHARE_EXPIRY_HOURS || 24),
}

export default env
