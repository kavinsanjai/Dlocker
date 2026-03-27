export const ALLOWED_DOCUMENT_TYPES = new Set([
  'aadhaar_card',
  'driving_license',
  'voter_id',
  'pan_card',
  'passport',
  'birth_certificate',
  'utility_bill',
  'other',
])

export function normalizeDocumentType(inputType) {
  if (!inputType || typeof inputType !== 'string') {
    return 'other'
  }

  const normalized = inputType.trim().toLowerCase()
  return ALLOWED_DOCUMENT_TYPES.has(normalized) ? normalized : 'other'
}

export function getDocumentTypeFromStoragePath(storagePath) {
  const segments = storagePath.split('/')

  if (segments.length >= 3 && ALLOWED_DOCUMENT_TYPES.has(segments[1])) {
    return segments[1]
  }

  return 'other'
}
