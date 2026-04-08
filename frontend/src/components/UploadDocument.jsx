import { useState } from 'react'
import { DOCUMENT_TYPES } from '../constants/documentTypes'

export default function UploadDocument({
  onUpload,
  uploading,
  uploadProgress = 0,
  successMessage = '',
  errorMessage = '',
  documentType: controlledDocumentType,
  onDocumentTypeChange,
  file: controlledFile,
  onFileChange,
  compact = false,
  hideTypeSelector = false,
  uploadLabel = 'Upload',
  dataTestIdPrefix = 'upload',
}) {
  const [internalFile, setInternalFile] = useState(null)
  const [internalDocumentType, setInternalDocumentType] = useState('aadhaar_card')
  const [isDragOver, setIsDragOver] = useState(false)

  const file = controlledFile === undefined ? internalFile : controlledFile
  const documentType =
    controlledDocumentType === undefined
      ? internalDocumentType
      : controlledDocumentType

  const setFile = (nextFile) => {
    if (typeof onFileChange === 'function') {
      onFileChange(nextFile)
      return
    }

    setInternalFile(nextFile)
  }

  const setDocumentType = (nextType) => {
    if (typeof onDocumentTypeChange === 'function') {
      onDocumentTypeChange(nextType)
      return
    }

    setInternalDocumentType(nextType)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!file) return

    await onUpload(file, documentType)

    if (typeof onFileChange !== 'function') {
      setInternalFile(null)
      event.target.reset()
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)

    const droppedFile = event.dataTransfer?.files?.[0]

    if (droppedFile) {
      setFile(droppedFile)
    }
  }

  const selectedType =
    DOCUMENT_TYPES.find((item) => item.value === documentType) || DOCUMENT_TYPES[0]

  return (
    <form
      className={`upload-box ${compact ? 'upload-box-compact' : ''}`}
      onSubmit={handleSubmit}
      data-testid={`${dataTestIdPrefix}-form`}
    >
      {!hideTypeSelector ? (
        <>
          <label htmlFor="upload-document-type">Document Type</label>
          <select
            id="upload-document-type"
            name="upload-document-type"
            data-testid="upload-document-type"
            value={documentType}
            onChange={(event) => setDocumentType(event.target.value)}
          >
            {DOCUMENT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <p className="upload-type-description">{selectedType.description}</p>
        </>
      ) : null}

      <label htmlFor={`${dataTestIdPrefix}-file`}>Choose an image or PDF</label>
      <div
        className={`dropzone ${isDragOver ? 'dropzone-active' : ''}`}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          id={`${dataTestIdPrefix}-file`}
          name={`${dataTestIdPrefix}-file`}
          data-testid={`${dataTestIdPrefix}-input`}
          type="file"
          accept="image/*,.pdf"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
        />
        <p className="dropzone-text">Drag and drop a file here, or click to browse.</p>
        <p className="file-selected-name">{file?.name || 'No file selected'}</p>
      </div>

      {uploading ? (
        <div className="upload-progress" data-testid={`${dataTestIdPrefix}-progress`}>
          <div className="progress-track" aria-label="Upload progress">
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
          </div>
          <p className="summary-note">Uploading... {uploadProgress}%</p>
        </div>
      ) : null}

      {successMessage ? <p className="success-text">{successMessage}</p> : null}
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      <div className="upload-actions">
        <button
          type="submit"
          className="btn btn-primary"
          data-testid={`${dataTestIdPrefix}-submit`}
          disabled={!file || uploading}
        >
          {uploading ? 'Uploading...' : uploadLabel}
        </button>
      </div>
    </form>
  )
}
