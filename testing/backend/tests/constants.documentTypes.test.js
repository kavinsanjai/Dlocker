import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ALLOWED_DOCUMENT_TYPES,
  getDocumentTypeFromStoragePath,
  normalizeDocumentType,
} from '../../../backend/src/constants/documentTypes.js'

test('ALLOWED_DOCUMENT_TYPES contains supported values', () => {
  assert.equal(ALLOWED_DOCUMENT_TYPES.has('aadhaar_card'), true)
  assert.equal(ALLOWED_DOCUMENT_TYPES.has('passport'), true)
  assert.equal(ALLOWED_DOCUMENT_TYPES.has('other'), true)
})

test('normalizeDocumentType returns normalized allowed value', () => {
  assert.equal(normalizeDocumentType(' PAN_CARD '), 'pan_card')
})

test('normalizeDocumentType returns other for invalid values', () => {
  assert.equal(normalizeDocumentType('xyz'), 'other')
  assert.equal(normalizeDocumentType(''), 'other')
  assert.equal(normalizeDocumentType(null), 'other')
  assert.equal(normalizeDocumentType(undefined), 'other')
})

test('getDocumentTypeFromStoragePath extracts known type from storage path', () => {
  const path = 'user-id/aadhaar_card/17111111_file.pdf'
  assert.equal(getDocumentTypeFromStoragePath(path), 'aadhaar_card')
})

test('getDocumentTypeFromStoragePath falls back to other for malformed path', () => {
  assert.equal(getDocumentTypeFromStoragePath('bad-path'), 'other')
  assert.equal(getDocumentTypeFromStoragePath('u/unknown_type/f.pdf'), 'other')
})
