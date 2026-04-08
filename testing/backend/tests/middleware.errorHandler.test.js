import assert from 'node:assert/strict'
import test from 'node:test'
import { errorHandler, notFoundHandler } from '../../../backend/src/middleware/errorHandler.js'

function createResponseMock() {
  const response = {
    statusCode: 200,
    body: null,
    headersSent: false,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }

  return response
}

test('notFoundHandler returns 404 with route not found message', () => {
  const response = createResponseMock()
  notFoundHandler({}, response)

  assert.equal(response.statusCode, 404)
  assert.equal(response.body.message, 'Route not found.')
})

test('errorHandler returns statusCode and message from error', () => {
  const response = createResponseMock()
  const error = new Error('Custom failure')
  error.statusCode = 422

  errorHandler(error, {}, response, () => {})

  assert.equal(response.statusCode, 422)
  assert.equal(response.body.message, 'Custom failure')
})

test('errorHandler defaults to 500 for unknown errors', () => {
  const response = createResponseMock()
  errorHandler({}, {}, response, () => {})

  assert.equal(response.statusCode, 500)
  assert.equal(response.body.message, 'Internal server error.')
})

test('errorHandler calls next when headers already sent', () => {
  const response = createResponseMock()
  response.headersSent = true

  let nextCalled = false
  errorHandler(new Error('late error'), {}, response, () => {
    nextCalled = true
  })

  assert.equal(nextCalled, true)
})
