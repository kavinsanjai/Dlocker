import path from 'node:path'
import crypto from 'node:crypto'
import {
  getDocumentTypeFromStoragePath,
  normalizeDocumentType,
} from '../constants/documentTypes.js'
import env from '../config/env.js'
import supabase from '../config/supabase.js'
import asyncHandler from '../utils/asyncHandler.js'
import { logActivity } from '../utils/activityLog.js'
import { extractTextFromDocument } from '../utils/ocr.js'

function normalizeFileName(originalName) {
  const extension = path.extname(originalName)
  const nameWithoutExtension = path.basename(originalName, extension)

  const safeName = nameWithoutExtension
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 50)

  return {
    extension: extension || '',
    safeName: safeName || 'document',
  }
}

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Document file is required.' })
  }

  const documentType = normalizeDocumentType(req.body.documentType)
  const replaceExisting = req.body.replaceExisting === 'true'

  let existingDocument = null

  if (replaceExisting) {
    const { data: existingDocuments, error: existingError } = await supabase
      .from('documents')
      .select('id, storage_path')
      .eq('user_id', req.user.id)
      .like('storage_path', `${req.user.id}/${documentType}/%`)
      .order('created_at', { ascending: false })
      .limit(1)

    if (existingError) {
      throw new Error(existingError.message)
    }

    existingDocument = existingDocuments?.[0] || null
  }

  const { safeName, extension } = normalizeFileName(req.file.originalname)
  const storagePath = `${req.user.id}/${documentType}/${Date.now()}_${safeName}${extension}`

  let ocrText = ''

  if (env.ocrEnabled) {
    ocrText = await extractTextFromDocument(req.file.buffer, req.file.mimetype)
  }

  const { error: uploadError } = await supabase.storage
    .from(env.storageBucket)
    .upload(storagePath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    })

  if (uploadError) {
    throw new Error(uploadError.message)
  }

  const { data: metadata, error: insertError } = await supabase
    .from('documents')
    .insert({
      user_id: req.user.id,
      file_name: req.file.originalname,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
      storage_path: storagePath,
      ocr_text: ocrText || null,
      ocr_extracted_at: ocrText ? new Date().toISOString() : null,
    })
    .select('id, file_name, mime_type, file_size, created_at')
    .single()

  if (insertError) {
    await supabase.storage.from(env.storageBucket).remove([storagePath])
    throw new Error(insertError.message)
  }

  if (existingDocument) {
    await supabase.storage.from(env.storageBucket).remove([existingDocument.storage_path])
    await supabase
      .from('documents')
      .delete()
      .eq('id', existingDocument.id)
      .eq('user_id', req.user.id)
  }

  await logActivity({
    userId: req.user.id,
    documentId: metadata.id,
    action: 'upload',
    metadata: {
      file_name: req.file.originalname,
      document_type: documentType,
      file_size: req.file.size,
      replaced_document_id: existingDocument?.id || null,
    },
  })

  return res.status(201).json({
    message: 'Document uploaded successfully.',
    document: {
      ...metadata,
      document_type: documentType,
    },
  })
})

export const getDocuments = asyncHandler(async (req, res) => {
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, file_name, mime_type, file_size, storage_path, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const documentsWithUrls = await Promise.all(
    documents.map(async (document) => {
      const { data: signed, error: urlError } = await supabase.storage
        .from(env.storageBucket)
        .createSignedUrl(document.storage_path, 60 * 10)

      if (urlError) {
        throw new Error(urlError.message)
      }

      return {
        id: document.id,
        document_type: getDocumentTypeFromStoragePath(document.storage_path),
        file_name: document.file_name,
        mime_type: document.mime_type,
        file_size: document.file_size,
        created_at: document.created_at,
        preview_url: signed.signedUrl,
        download_url: signed.signedUrl,
      }
    }),
  )

  return res.status(200).json({ documents: documentsWithUrls })
})

export const deleteDocument = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.id)

  if (!Number.isInteger(documentId)) {
    return res.status(400).json({ message: 'Invalid document id.' })
  }

  const { data: document, error: findError } = await supabase
    .from('documents')
    .select('id, storage_path')
    .eq('id', documentId)
    .eq('user_id', req.user.id)
    .maybeSingle()

  if (findError) {
    throw new Error(findError.message)
  }

  if (!document) {
    return res.status(404).json({ message: 'Document not found.' })
  }

  const { data: documentMeta } = await supabase
    .from('documents')
    .select('file_name, mime_type, file_size')
    .eq('id', document.id)
    .eq('user_id', req.user.id)
    .maybeSingle()

  const { error: storageError } = await supabase.storage
    .from(env.storageBucket)
    .remove([document.storage_path])

  if (storageError) {
    throw new Error(storageError.message)
  }

  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', document.id)
    .eq('user_id', req.user.id)

  if (deleteError) {
    throw new Error(deleteError.message)
  }

  await logActivity({
    userId: req.user.id,
    documentId: document.id,
    action: 'delete',
    metadata: {
      file_name: documentMeta?.file_name || null,
      mime_type: documentMeta?.mime_type || null,
      file_size: documentMeta?.file_size || null,
    },
  })

  return res.status(200).json({ message: 'Document deleted successfully.' })
})

export const downloadDocument = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.id)

  if (!Number.isInteger(documentId)) {
    return res.status(400).json({ message: 'Invalid document id.' })
  }

  const { data: document, error } = await supabase
    .from('documents')
    .select('id, storage_path, file_name, mime_type, file_size')
    .eq('id', documentId)
    .eq('user_id', req.user.id)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!document) {
    return res.status(404).json({ message: 'Document not found.' })
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(env.storageBucket)
    .createSignedUrl(document.storage_path, 60 * 10)

  if (signedError) {
    throw new Error(signedError.message)
  }

  await logActivity({
    userId: req.user.id,
    documentId: document.id,
    action: 'download',
    metadata: {
      file_name: document.file_name,
      mime_type: document.mime_type,
      file_size: document.file_size,
    },
  })

  return res.status(200).json({ download_url: signed.signedUrl })
})

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeLooseSearchText(value) {
  return normalizeSearchText(value).replace(/(.)\1+/g, '$1')
}

function buildQueryVariants(query) {
  const base = query.toLowerCase()
  const variants = new Set([base])

  if (base.includes('aadhar')) {
    variants.add(base.replaceAll('aadhar', 'aadhaar'))
  }

  if (base.includes('aadhaar')) {
    variants.add(base.replaceAll('aadhaar', 'aadhar'))
  }

  return Array.from(variants)
}

export const searchDocuments = asyncHandler(async (req, res) => {
  // Search across both filename and OCR-extracted text while keeping user isolation.
  const query = String(req.query.q || '').trim()

  if (query.length < 2) {
    return res.status(200).json({ documents: [] })
  }

  const variants = buildQueryVariants(query)

  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, file_name, mime_type, file_size, storage_path, ocr_text, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    throw new Error(error.message)
  }

  const filteredDocuments = documents.filter((document) => {
    const documentType = getDocumentTypeFromStoragePath(document.storage_path)
    const searchable = [
      document.file_name,
      document.ocr_text,
      documentType,
      documentType.replaceAll('_', ' '),
    ]
      .filter(Boolean)
      .join(' ')

    const strictHaystack = normalizeSearchText(searchable)
    const looseHaystack = normalizeLooseSearchText(searchable)

    return variants.some((variant) => {
      const strictVariant = normalizeSearchText(variant)
      const looseVariant = normalizeLooseSearchText(variant)

      if (!strictVariant) {
        return false
      }

      return (
        strictHaystack.includes(strictVariant) ||
        looseHaystack.includes(looseVariant)
      )
    })
  })

  const limitedDocuments = filteredDocuments.slice(0, 25)

  const documentsWithUrls = await Promise.all(
    limitedDocuments.map(async (document) => {
      const { data: signed, error: signedError } = await supabase.storage
        .from(env.storageBucket)
        .createSignedUrl(document.storage_path, 60 * 10)

      if (signedError) {
        throw new Error(signedError.message)
      }

      return {
        id: document.id,
        document_type: getDocumentTypeFromStoragePath(document.storage_path),
        file_name: document.file_name,
        mime_type: document.mime_type,
        file_size: document.file_size,
        created_at: document.created_at,
        preview_url: signed.signedUrl,
        download_url: signed.signedUrl,
      }
    }),
  )

  return res.status(200).json({ documents: documentsWithUrls })
})

export const getDashboardInsights = asyncHandler(async (req, res) => {
  // Aggregate smart dashboard metrics from existing documents table data.
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, file_name, mime_type, file_size, storage_path, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const totalDocuments = documents.length
  const totalStorageBytes = documents.reduce((accumulator, document) => {
    return accumulator + Number(document.file_size || 0)
  }, 0)

  const storageQuotaBytes = Math.max(env.storageQuotaMb, 1) * 1024 * 1024
  const usagePercent = Math.min(
    Math.round((totalStorageBytes / storageQuotaBytes) * 100),
    100,
  )

  const recentDocuments = documents.slice(0, 5).map((document) => ({
    id: document.id,
    file_name: document.file_name,
    mime_type: document.mime_type,
    file_size: document.file_size,
    document_type: getDocumentTypeFromStoragePath(document.storage_path),
    created_at: document.created_at,
  }))

  const fileTypeDistribution = Object.values(
    documents.reduce((accumulator, document) => {
      const typeLabel = document.mime_type.includes('pdf')
        ? 'PDF'
        : document.mime_type.startsWith('image/')
          ? 'Image'
          : 'Other'

      if (!accumulator[typeLabel]) {
        accumulator[typeLabel] = {
          name: typeLabel,
          value: 0,
        }
      }

      accumulator[typeLabel].value += 1
      return accumulator
    }, {}),
  )

  return res.status(200).json({
    total_documents: totalDocuments,
    total_storage_bytes: totalStorageBytes,
    storage_quota_bytes: storageQuotaBytes,
    storage_usage_percent: usagePercent,
    recent_documents: recentDocuments,
    file_type_distribution: fileTypeDistribution,
  })
})

function getRequestBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http'
  const host = req.get('host')
  return `${protocol}://${host}`
}

export const createShareLink = asyncHandler(async (req, res) => {
  // Share links are token-based and generated only by authenticated document owners.
  const documentId = Number(req.params.id)

  if (!Number.isInteger(documentId)) {
    return res.status(400).json({ message: 'Invalid document id.' })
  }

  const { data: document, error: documentError } = await supabase
    .from('documents')
    .select('id, file_name')
    .eq('id', documentId)
    .eq('user_id', req.user.id)
    .maybeSingle()

  if (documentError) {
    throw new Error(documentError.message)
  }

  if (!document) {
    return res.status(404).json({ message: 'Document not found.' })
  }

  const rawHours = Number(req.body?.expiresInHours)
  const expiresInHours = Number.isFinite(rawHours) && rawHours > 0
    ? Math.min(Math.floor(rawHours), 7 * 24)
    : env.defaultShareExpiryHours

  const expiresAt = expiresInHours
    ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
    : null

  const shareToken = crypto.randomBytes(24).toString('hex')

  const { error: shareError } = await supabase.from('document_shares').insert({
    document_id: document.id,
    user_id: req.user.id,
    share_token: shareToken,
    expires_at: expiresAt?.toISOString() || null,
  })

  if (shareError) {
    throw new Error(shareError.message)
  }

  await logActivity({
    userId: req.user.id,
    documentId: document.id,
    action: 'share',
    metadata: {
      file_name: document.file_name,
      expires_at: expiresAt?.toISOString() || null,
    },
  })

  return res.status(201).json({
    share_token: shareToken,
    expires_at: expiresAt?.toISOString() || null,
    share_url: `${getRequestBaseUrl(req)}/api/share/${shareToken}`,
  })
})

export const accessSharedDocument = asyncHandler(async (req, res) => {
  // Public read-only access by token with expiry enforcement.
  const shareToken = String(req.params.token || '').trim()

  if (!shareToken) {
    return res.status(400).json({ message: 'Share token is required.' })
  }

  const { data: share, error: shareError } = await supabase
    .from('document_shares')
    .select(
      'id, document_id, user_id, expires_at, documents(id, file_name, mime_type, file_size, storage_path, created_at)',
    )
    .eq('share_token', shareToken)
    .maybeSingle()

  if (shareError) {
    throw new Error(shareError.message)
  }

  if (!share || !share.documents) {
    return res.status(404).json({ message: 'Shared document not found.' })
  }

  if (share.expires_at && new Date(share.expires_at).getTime() < Date.now()) {
    return res.status(410).json({ message: 'Share link has expired.' })
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(env.storageBucket)
    .createSignedUrl(share.documents.storage_path, 60 * 10)

  if (signedError) {
    throw new Error(signedError.message)
  }

  await supabase
    .from('document_shares')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('id', share.id)

  await logActivity({
    userId: share.user_id,
    documentId: share.document_id,
    action: 'share_access',
    metadata: {
      share_token: shareToken,
      file_name: share.documents.file_name,
    },
  })

  return res.status(200).json({
    id: share.documents.id,
    file_name: share.documents.file_name,
    mime_type: share.documents.mime_type,
    file_size: share.documents.file_size,
    created_at: share.documents.created_at,
    preview_url: signed.signedUrl,
    download_url: signed.signedUrl,
    expires_at: share.expires_at,
  })
})

export const getActivityLogs = asyncHandler(async (req, res) => {
  const requestedLimit = Number(req.query.limit)
  const limit = Number.isInteger(requestedLimit)
    ? Math.max(1, Math.min(requestedLimit, 100))
    : 25

  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('id, document_id, action, metadata, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(error.message)
  }

  const documentIds = Array.from(
    new Set(logs.map((entry) => entry.document_id).filter(Boolean)),
  )

  let documentNameMap = {}

  if (documentIds.length > 0) {
    const { data: documents, error: documentError } = await supabase
      .from('documents')
      .select('id, file_name')
      .eq('user_id', req.user.id)
      .in('id', documentIds)

    if (documentError) {
      throw new Error(documentError.message)
    }

    documentNameMap = documents.reduce((accumulator, item) => {
      accumulator[item.id] = item.file_name
      return accumulator
    }, {})
  }

  const enrichedLogs = logs.map((entry) => ({
    ...entry,
    file_name:
      documentNameMap[entry.document_id] || entry.metadata?.file_name || 'Unknown document',
  }))

  return res.status(200).json({ logs: enrichedLogs })
})
