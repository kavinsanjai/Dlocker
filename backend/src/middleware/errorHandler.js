export function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Route not found.' })
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  const status = error.statusCode || 500
  const message = error.message || 'Internal server error.'

  return res.status(status).json({
    message,
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  })
}
