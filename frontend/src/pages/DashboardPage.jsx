import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_MAP,
} from '../constants/documentTypes'
import useAuth from '../hooks/useAuth'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState({})
  const [previewDocument, setPreviewDocument] = useState(null)
  const [error, setError] = useState('')

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data } = await api.get('/documents')
      setDocuments(data.documents)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load documents.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const handleFileSelection = (documentType, file) => {
    setSelectedFiles((previous) => ({
      ...previous,
      [documentType]: file || null,
    }))
  }

  const handleUpload = async (documentType, replaceExisting = false) => {
    const file = selectedFiles[documentType]
    if (!file) {
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('document', file)
      formData.append('documentType', documentType)
      formData.append('replaceExisting', String(replaceExisting))
      await api.post('/upload', formData)
      setSelectedFiles((previous) => ({
        ...previous,
        [documentType]: null,
      }))
      await loadDocuments()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (documentId) => {
    setError('')

    try {
      await api.delete(`/document/${documentId}`)
      await loadDocuments()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Delete failed.')
    }
  }

  const handleDownload = (downloadUrl) => {
    window.open(downloadUrl, '_blank', 'noopener,noreferrer')
  }

  const handlePreview = (document) => {
    setPreviewDocument(document)
  }

  const documentByType = documents.reduce((accumulator, document) => {
    if (!accumulator[document.document_type]) {
      accumulator[document.document_type] = document
    }

    return accumulator
  }, {})

  const visibleDocumentTypes = DOCUMENT_TYPES.filter((item) => item.value !== 'other')
  const requiredDocumentTypes = visibleDocumentTypes.filter((item) => item.required)
  const optionalDocumentTypes = visibleDocumentTypes.filter((item) => !item.required)

  const uploadedRequiredCount = requiredDocumentTypes.filter(
    (item) => Boolean(documentByType[item.value]),
  ).length

  const uploadedTotalCount = visibleDocumentTypes.filter(
    (item) => Boolean(documentByType[item.value]),
  ).length

  const progressPercent = Math.round(
    (uploadedRequiredCount / Math.max(requiredDocumentTypes.length, 1)) * 100,
  )

  const renderDocumentCards = (items) => (
    <div className="required-grid">
      {items.map((item) => {
        const existingDocument = documentByType[item.value]
        const selectedFile = selectedFiles[item.value]

        return (
          <article key={item.value} className="required-card" data-testid={`card-${item.value}`}>
            <div className="doc-image-wrap">
              <img
                className="doc-image"
                src={item.imagePath}
                alt={`${item.label} placeholder`}
                loading="lazy"
              />
            </div>

            <div className="doc-card-head">
              <p className="required-name">{item.label}</p>
              <span className={item.required ? 'doc-chip doc-chip-required' : 'doc-chip'}>
                {item.required ? 'Required' : 'Optional'}
              </span>
            </div>

            <p className="upload-type-description">{item.description}</p>

            {existingDocument ? (
              <p className="required-status">
                <span className="status-badge status-complete">Uploaded</span>
              </p>
            ) : (
              <p className="required-status">
                <span className="status-badge status-pending">Not uploaded</span>
              </p>
            )}

            <input
              id={`file-${item.value}`}
              className="doc-file-input"
              name={`file-${item.value}`}
              data-testid={`file-${item.value}`}
              type="file"
              accept="image/*,.pdf"
              onChange={(event) =>
                handleFileSelection(item.value, event.target.files?.[0] || null)
              }
            />

            <p className="file-selected-name">{selectedFile?.name || 'No file selected'}</p>

            {existingDocument ? (
              <p className="existing-file-meta">
                Current: {existingDocument.file_name}
              </p>
            ) : null}

            <div className="upload-actions">
              {!existingDocument ? (
                <button
                  type="button"
                  className="btn btn-primary btn-inline"
                  data-testid={`upload-${item.value}`}
                  disabled={uploading || !selectedFile}
                  onClick={() => handleUpload(item.value, false)}
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary btn-inline"
                    data-testid={`preview-${item.value}`}
                    onClick={() => handlePreview(existingDocument)}
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-inline"
                    data-testid={`download-${item.value}`}
                    onClick={() => handleDownload(existingDocument.download_url)}
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-inline"
                    data-testid={`reupload-${item.value}`}
                    disabled={uploading || !selectedFile}
                    onClick={() => handleUpload(item.value, true)}
                  >
                    Re-upload
                  </button>
                </>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )

  return (
    <section className="dashboard-card" data-testid="dashboard-page">
      <div className="dashboard-head">
        <div>
          <h1 className="page-title">Digital Document Locker</h1>
          <p className="page-subtitle">Signed in as {user?.email}</p>
        </div>
        <button
          className="btn btn-secondary"
          data-testid="logout-button"
          onClick={logout}
        >
          Logout
        </button>
      </div>

      <section className="dashboard-summary" data-testid="dashboard-summary">
        <article className="summary-card">
          <p className="summary-title">Required Completion</p>
          <p className="summary-value">{uploadedRequiredCount}/{requiredDocumentTypes.length}</p>
          <div className="progress-track" aria-label="Required document completion">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <p className="summary-note">{progressPercent}% complete</p>
        </article>

        <article className="summary-card">
          <p className="summary-title">Total Uploaded</p>
          <p className="summary-value">{uploadedTotalCount}/{visibleDocumentTypes.length}</p>
          <p className="summary-note">Across required and optional documents</p>
        </article>
      </section>

      <section className="required-documents" data-testid="required-documents">
        <h2 className="section-title">Required Documents</h2>
        {renderDocumentCards(requiredDocumentTypes)}

        <h2 className="section-title section-title-secondary">Optional Documents</h2>
        {renderDocumentCards(optionalDocumentTypes)}
      </section>

      {error ? <p className="error-text">{error}</p> : null}

      {loading ? (
        <p className="empty-state" data-testid="loading-indicator">
          Loading documents...
        </p>
      ) : null}

      <div className="documents-grid">
        {documents.length > 0 ? (
          <table className="documents-table" data-testid="documents-table">
            <thead>
              <tr>
                <th>Document Type</th>
                <th>File Name</th>
                <th>Uploaded At</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id} data-testid="document-row">
                  <td>{DOCUMENT_TYPE_MAP[document.document_type]?.label || 'Other Document'}</td>
                  <td>{document.file_name}</td>
                  <td>{new Date(document.created_at).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-inline"
                      data-testid={`delete-${document.id}`}
                      onClick={() => handleDelete(document.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="empty-state" data-testid="empty-documents">
            No documents uploaded yet.
          </p>
        )}
      </div>

      {previewDocument ? (
        <div className="preview-backdrop" data-testid="preview-modal">
          <div className="preview-card">
            <div className="preview-head">
              <h3 className="preview-title">Preview: {previewDocument.file_name}</h3>
              <button
                type="button"
                className="btn btn-secondary btn-inline"
                data-testid="close-preview"
                onClick={() => setPreviewDocument(null)}
              >
                Close
              </button>
            </div>
            <iframe
              title="Document Preview"
              src={previewDocument.download_url}
              className="preview-frame"
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}
