import assert from 'node:assert/strict'
import config from './utils/config.js'
import { createDriver } from './utils/driver.js'
import {
  getDocumentRows,
  loginUser,
  openSearchAndType,
  registerUser,
  uniqueUser,
  uploadSampleDocument,
} from './utils/helpers.js'

export default async function ocrSearchTest() {
  const driver = createDriver(config.browser)

  try {
    const user = uniqueUser('search')
    await registerUser(driver, config.appBaseUrl, user)
    await loginUser(driver, config.appBaseUrl, user)
    await uploadSampleDocument(driver, 'aadhaar_card')

    await openSearchAndType(driver, 'aadhar')

    const rows = await getDocumentRows(driver)
    const texts = await Promise.all(rows.map((row) => row.getText()))

    assert.ok(
      texts.length > 0,
      'OCR search should return at least one row for aadhaar/aadhar query',
    )
  } finally {
    await driver.quit()
  }
}
