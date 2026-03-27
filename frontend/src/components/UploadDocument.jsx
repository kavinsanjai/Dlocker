import { useState } from 'react'
import { DOCUMENT_TYPES } from '../constants/documentTypes'

export default function UploadDocument({ onUpload, uploading }) {
  const [file, setFile] = useState(null)
  const [documentType, setDocumentType] = useState('aadhaar_card')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!file) return

    await onUpload(file, documentType)
    setFile(null)
    event.target.reset()
  }

  const selectedType =
    DOCUMENT_TYPES.find((item) => item.value === documentType) || DOCUMENT_TYPES[0]

  return (
    <form className="upload-box" onSubmit={handleSubmit} data-testid="upload-form">
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

      <label htmlFor="upload-file">Choose an image or PDF</label>
      <input
        id="upload-file"
        name="upload-file"
        data-testid="upload-input"
        type="file"
        accept="image/*,.pdf"
        onChange={(event) => setFile(event.target.files?.[0] || null)}
        required
      />
      <div className="upload-actions">
        <button
          type="submit"
          className="btn btn-primary"
          data-testid="upload-submit"
          disabled={!file || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </form>
  )
}
