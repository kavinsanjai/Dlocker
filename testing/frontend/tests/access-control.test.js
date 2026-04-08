import assert from 'node:assert/strict'
import { By } from 'selenium-webdriver'
import config from './utils/config.js'
import { createDriver } from './utils/driver.js'
import {
  getDocumentRows,
  loginUser,
  logoutUser,
  registerUser,
  uniqueUser,
  uploadSampleDocument,
} from './utils/helpers.js'

export default async function accessControlTest() {
  const driver = createDriver(config.browser)

  try {
    const owner = uniqueUser('owner')
    const other = uniqueUser('other')

    await registerUser(driver, config.appBaseUrl, owner)
    await loginUser(driver, config.appBaseUrl, owner)
    await uploadSampleDocument(driver, 'aadhaar_card')

    const ownerRows = await getDocumentRows(driver)
    assert.ok(ownerRows.length > 0, 'Owner should see uploaded documents')

    await logoutUser(driver)

    await registerUser(driver, config.appBaseUrl, other)
    await loginUser(driver, config.appBaseUrl, other)

    const otherRows = await driver.findElements(By.css('[data-testid="document-row"]'))
    const texts = await Promise.all(otherRows.map((row) => row.getText()))
    const ownerFileVisible = texts.some((text) => text.includes('sample-document.pdf'))

    assert.equal(ownerFileVisible, false, 'Second user must not see first user documents')
  } finally {
    await driver.quit()
  }
}
