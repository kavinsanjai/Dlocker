import assert from 'node:assert/strict'
import config from './utils/config.js'
import { createDriver } from './utils/driver.js'
import {
  documentRowsText,
  loginUser,
  registerUser,
  uniqueUser,
  uploadSampleDocument,
} from './utils/helpers.js'

export default async function uploadTest() {
  const driver = createDriver(config.browser)

  try {
    const user = uniqueUser('upload')
    await registerUser(driver, config.appBaseUrl, user)
    await loginUser(driver, config.appBaseUrl, user)
    await uploadSampleDocument(driver)

    const rowsText = await documentRowsText(driver)
    const hasUploadedFile = rowsText.some((text) => text.includes('sample-document.pdf'))
    assert.ok(hasUploadedFile, 'Uploaded document should be listed on the dashboard')
  } finally {
    await driver.quit()
  }
}
