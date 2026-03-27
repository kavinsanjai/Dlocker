import { Router } from 'express'
import multer from 'multer'
import {
  deleteDocument,
  downloadDocument,
  getDocuments,
  uploadDocument,
} from '../controllers/documentController.js'
import { authenticateToken } from '../middleware/auth.js'

const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      callback(null, true)
      return
    }

    const error = new Error('Only PDF and image files are allowed.')
    error.statusCode = 400
    callback(error)
  },
})

const documentRoutes = Router()

documentRoutes.use(authenticateToken)
documentRoutes.post('/upload', upload.single('document'), uploadDocument)
documentRoutes.get('/documents', getDocuments)
documentRoutes.get('/document/:id/download', downloadDocument)
documentRoutes.delete('/document/:id', deleteDocument)

export default documentRoutes
