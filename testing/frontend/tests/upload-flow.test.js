import assert from 'node:assert/strict'
import config from './utils/config.js'
import { createDriver } from './utils/driver.js'
import {
  getDocumentRows,
  loginUser,
  registerUser,
  uniqueUser,
  uploadSampleDocument,
} from './utils/helpers.js'

export default async function uploadFlowTest() {
  const driver = createDriver(config.browser)

  try {
    const user = uniqueUser('upload')
    await registerUser(driver, config.appBaseUrl, user)
    await loginUser(driver, config.appBaseUrl, user)
    await uploadSampleDocument(driver, 'aadhaar_card')

    const rows = await getDocumentRows(driver)
    const texts = await Promise.all(rows.map((row) => row.getText()))
    const hasUploadedFile = texts.some((text) => text.includes('sample-document.pdf'))

    assert.equal(hasUploadedFile, true, 'Uploaded file should be listed in documents table')
  } finally {
    await driver.quit()
  }
}
