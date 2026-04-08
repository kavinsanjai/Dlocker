import assert from 'node:assert/strict'
import test from 'node:test'

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://example.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'service-role-key'
process.env.SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'documents'
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'

const { signToken, verifyToken } = await import('../../../backend/src/utils/jwt.js')

test('signToken and verifyToken round-trip payload fields', () => {
  const token = signToken({ id: 'user-123', email: 'tester@example.com' })
  const payload = verifyToken(token)

  assert.equal(payload.sub, 'user-123')
  assert.equal(payload.email, 'tester@example.com')
})

test('verifyToken throws for invalid token string', () => {
  assert.throws(() => verifyToken('not-a-token'))
})
