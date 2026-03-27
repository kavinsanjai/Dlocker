import cors from 'cors'
import express from 'express'
import env from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/authRoutes.js'
import documentRoutes from './routes/documentRoutes.js'

const app = express()

app.use(
  cors({
    origin: env.corsOrigin,
  }),
)
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'Backend is running.' })
})

app.use('/api', authRoutes)
app.use('/api', documentRoutes)

app.use(notFoundHandler)
app.use(errorHandler)

app.listen(env.port, () => {
  console.log(`Backend running on http://localhost:${env.port}`)
})
