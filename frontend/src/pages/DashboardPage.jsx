import { useCallback, useEffect, useState } from 'react'
import api from '../api/client'
import ActivityLogTable from '../components/ActivityLogTable'
import DashboardInsights from '../components/DashboardInsights'
import UploadDocument from '../components/UploadDocument'
import {
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_MAP,
} from '../constants/documentTypes'
import useAuth from '../hooks/useAuth'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadingType, setUploadingType] = useState(null)
  const [uploadProgressByType, setUploadProgressByType] = useState({})
  const [uploadStatusByType, setUploadStatusByType] = useState({})
  const [selectedFiles, setSelectedFiles] = useState({})
  const [previewDocument, setPreviewDocument] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState(null)
  const [insights, setInsights] = useState(null)
  const [insightsLoading, setInsightsLoading] = useState(true)
  const [activityLogs, setActivityLogs] = useState([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [shareLinkByDocument, setShareLinkByDocument] = useState({})
  const [error, setError] = useState('')

  const loadDocuments = useCallback(async () => {
    setLoading(true)

    try {
      const { data } = await api.get('/documents')
      setDocuments(data.documents)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load documents.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadInsights = useCallback(async () => {
    setInsightsLoading(true)

    try {
      const { data } = await api.get('/dashboard/insights')
      setInsights(data)
    } catch {
      setInsights(null)
    } finally {
      setInsightsLoading(false)
    }
  }, [])

  const loadActivity = useCallback(async () => {
    setActivityLoading(true)

    try {
      const { data } = await api.get('/activity?limit=20')
      setActivityLogs(data.logs || [])
    } catch {
      setActivityLogs([])
    } finally {
      setActivityLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDocuments()
    loadInsights()
    loadActivity()
  }, [loadActivity, loadDocuments, loadInsights])

  useEffect(() => {
    // OCR-backed search query with a short debounce to avoid noisy API calls.
    const query = searchTerm.trim()

    if (query.length < 2) {
      setSearchResults(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      setSearching(true)

      try {
        const { data } = await api.get('/documents/search', {
          params: { q: query },
        })
        setSearchResults(data.documents || [])
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  const handleFileSelection = (documentType, file) => {
    setSelectedFiles((previous) => ({
      ...previous,
      [documentType]: file || null,
    }))
  }

  const handleUpload = async (documentType, file, replaceExisting = false) => {
    // Upload progress is tracked per document type to support multiple drop zones.
    if (!file) {
      return
    }

    setUploadingType(documentType)
    setError('')
    setUploadStatusByType((previous) => ({
      ...previous,
      [documentType]: { kind: '', message: '' },
    }))
    setUploadProgressByType((previous) => ({
      ...previous,
      [documentType]: 0,
    }))

    try {
      const formData = new FormData()
      formData.append('document', file)
      formData.append('documentType', documentType)
      formData.append('replaceExisting', String(replaceExisting))

      await api.post('/upload', formData, {
        onUploadProgress: (event) => {
          const total = event.total || file.size || 1
          const percent = Math.min(Math.round((event.loaded / total) * 100), 100)
          setUploadProgressByType((previous) => ({
            ...previous,
            [documentType]: percent,
          }))
        },
      })

      setSelectedFiles((previous) => ({
        ...previous,
        [documentType]: null,
      }))
      setUploadStatusByType((previous) => ({
        ...previous,
        [documentType]: { kind: 'success', message: 'Upload completed successfully.' },
      }))
      await loadDocuments()
      await loadInsights()
      await loadActivity()
    } catch (requestError) {
      const message = requestError.response?.data?.message || 'Upload failed.'
      setError(message)
      setUploadStatusByType((previous) => ({
        ...previous,
        [documentType]: { kind: 'error', message },
      }))
    } finally {
      setUploadingType(null)
      setTimeout(() => {
        setUploadProgressByType((previous) => ({
          ...previous,
          [documentType]: 0,
        }))
      }, 350)
    }
  }

  const handleDelete = async (documentId) => {
    setError('')

    try {
      await api.delete(`/document/${documentId}`)
      await loadDocuments()
      await loadInsights()
      await loadActivity()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Delete failed.')
    }
  }

  const handleDownload = async (documentId) => {
    try {
      const { data } = await api.get(`/document/${documentId}/download`)
      window.open(data.download_url, '_blank', 'noopener,noreferrer')
      await loadActivity()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Download failed.')
    }
  }

  const handlePreview = (document) => {
    setPreviewDocument(document)
  }

  const handleCreateShareLink = async (documentId, expiresInHours = 24) => {
    // Create a secure share token and copy the generated URL when possible.
    try {
      const { data } = await api.post(`/share/${documentId}`, { expiresInHours })
      setShareLinkByDocument((previous) => ({
        ...previous,
        [documentId]: data.share_url,
      }))
      await navigator.clipboard?.writeText(data.share_url)
      await loadActivity()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to create share link.')
    }
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

  const visibleDocuments =
    searchTerm.trim().length >= 2 ? searchResults || [] : documents

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

            {existingDocument ? (
              <p className="existing-file-meta">
                Current: {existingDocument.file_name}
              </p>
            ) : null}

            <div className="upload-actions">
              <UploadDocument
                compact
                hideTypeSelector
                dataTestIdPrefix={`upload-${item.value}`}
                file={selectedFile}
                onFileChange={(nextFile) => handleFileSelection(item.value, nextFile)}
                uploadProgress={uploadProgressByType[item.value] || 0}
                uploading={uploadingType === item.value}
                uploadLabel={existingDocument ? 'Re-upload' : 'Upload'}
                successMessage={
                  uploadStatusByType[item.value]?.kind === 'success'
                    ? uploadStatusByType[item.value]?.message
                    : ''
                }
                errorMessage={
                  uploadStatusByType[item.value]?.kind === 'error'
                    ? uploadStatusByType[item.value]?.message
                    : ''
                }
                onUpload={(file) => handleUpload(item.value, file, Boolean(existingDocument))}
              />

              {existingDocument ? (
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
                    onClick={() => handleDownload(existingDocument.id)}
                  >
                    Download
                  </button>
                </>
              ) : null}
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

      <DashboardInsights insights={insights} loading={insightsLoading} />

      <section className="required-documents" data-testid="search-documents">
        <h2 className="section-title">OCR Search</h2>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by file name or extracted text..."
          data-testid="search-input"
        />
        {searching ? <p className="summary-note">Searching...</p> : null}
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
        {visibleDocuments.length > 0 ? (
          <table className="documents-table" data-testid="documents-table">
            <thead>
              <tr>
                <th>Document Type</th>
                <th>File Name</th>
                <th>Uploaded At</th>
                <th>Share</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {visibleDocuments.map((document) => (
                <tr key={document.id} data-testid="document-row">
                  <td>{DOCUMENT_TYPE_MAP[document.document_type]?.label || 'Other Document'}</td>
                  <td>{document.file_name}</td>
                  <td>{new Date(document.created_at).toLocaleString()}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-inline"
                      data-testid={`share-${document.id}`}
                      onClick={() => handleCreateShareLink(document.id, 24)}
                    >
                      Share Link
                    </button>
                    {shareLinkByDocument[document.id] ? (
                      <p className="file-selected-name">
                        {shareLinkByDocument[document.id]}
                      </p>
                    ) : null}
                  </td>
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

      <section className="required-documents" data-testid="activity-section">
        <h2 className="section-title">Activity Logs</h2>
        <ActivityLogTable logs={activityLogs} loading={activityLoading} />
      </section>

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
            {previewDocument.mime_type?.includes('pdf') ? (
              <iframe
                title="Document Preview"
                src={previewDocument.preview_url || previewDocument.download_url}
                className="preview-frame"
              />
            ) : (
              <img
                className="preview-image"
                src={previewDocument.preview_url || previewDocument.download_url}
                alt={previewDocument.file_name}
              />
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}
