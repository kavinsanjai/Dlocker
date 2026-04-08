import assert from 'node:assert/strict'
import test from 'node:test'
import asyncHandler from '../../../backend/src/utils/asyncHandler.js'

test('asyncHandler calls wrapped handler successfully', async () => {
  let called = false

  const handler = asyncHandler(async () => {
    called = true
  })

  await handler({}, {}, () => {})
  assert.equal(called, true)
})

test('asyncHandler forwards thrown errors to next()', async () => {
  const expectedError = new Error('boom')
  let receivedError = null

  const handler = asyncHandler(async () => {
    throw expectedError
  })

  await handler({}, {}, (error) => {
    receivedError = error
  })

  assert.equal(receivedError, expectedError)
})
