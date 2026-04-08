import pdfParse from 'pdf-parse'
import Tesseract from 'tesseract.js'

const MAX_OCR_TEXT_LENGTH = 15000

function normalizeExtractedText(text) {
  if (!text) {
    return ''
  }

  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_OCR_TEXT_LENGTH)
}

export async function extractTextFromDocument(buffer, mimeType) {
  if (!buffer || !mimeType) {
    return ''
  }

  try {
    if (mimeType === 'application/pdf') {
      const parsed = await pdfParse(buffer)
      return normalizeExtractedText(parsed.text)
    }

    if (mimeType.startsWith('image/')) {
      const result = await Tesseract.recognize(buffer, 'eng', {
        logger: () => {},
      })

      return normalizeExtractedText(result.data?.text)
    }
  } catch (error) {
    console.error('OCR extraction failed:', error.message)
  }

  return ''
}
