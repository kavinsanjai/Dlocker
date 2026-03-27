import path from 'node:path'
import {
  getDocumentTypeFromStoragePath,
  normalizeDocumentType,
} from '../constants/documentTypes.js'
import env from '../config/env.js'
import supabase from '../config/supabase.js'
import asyncHandler from '../utils/asyncHandler.js'

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
    })
    .select('id, file_name, created_at')
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
    .select('id, file_name, storage_path, created_at')
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
        created_at: document.created_at,
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

  return res.status(200).json({ message: 'Document deleted successfully.' })
})

export const downloadDocument = asyncHandler(async (req, res) => {
  const documentId = Number(req.params.id)

  if (!Number.isInteger(documentId)) {
    return res.status(400).json({ message: 'Invalid document id.' })
  }

  const { data: document, error } = await supabase
    .from('documents')
    .select('id, storage_path')
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

  return res.status(200).json({ download_url: signed.signedUrl })
})
