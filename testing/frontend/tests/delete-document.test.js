import assert from 'node:assert/strict'
import { By } from 'selenium-webdriver'
import config from './utils/config.js'
import { createDriver } from './utils/driver.js'
import {
  loginUser,
  registerUser,
  uniqueUser,
  uploadSampleDocument,
} from './utils/helpers.js'

export default async function deleteDocumentTest() {
  const driver = createDriver(config.browser)

  try {
    const user = uniqueUser('delete')
    await registerUser(driver, config.appBaseUrl, user)
    await loginUser(driver, config.appBaseUrl, user)
    await uploadSampleDocument(driver, 'aadhaar_card')

    const deleteButtons = await driver.findElements(By.css('[data-testid^="delete-"]'))
    assert.ok(deleteButtons.length > 0, 'Delete button should be visible after upload')
    await deleteButtons[0].click()

    await driver.wait(async () => {
      const rows = await driver.findElements(By.css('[data-testid="document-row"]'))
      return rows.length === 0
    }, 20000)

    const emptyState = await driver.findElements(By.css('[data-testid="empty-documents"]'))
    assert.equal(emptyState.length > 0, true, 'Document table should be empty after delete')
  } finally {
    await driver.quit()
  }
}
