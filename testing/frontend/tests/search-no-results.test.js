import assert from 'node:assert/strict'
import { By } from 'selenium-webdriver'
import config from './utils/config.js'
import { createDriver } from './utils/driver.js'
import {
  loginUser,
  openSearchAndType,
  registerUser,
  uniqueUser,
  uploadSampleDocument,
} from './utils/helpers.js'

export default async function searchNoResultsTest() {
  const driver = createDriver(config.browser)

  try {
    const user = uniqueUser('searchnone')
    await registerUser(driver, config.appBaseUrl, user)
    await loginUser(driver, config.appBaseUrl, user)
    await uploadSampleDocument(driver, 'aadhaar_card')

    await openSearchAndType(driver, 'zzzzzz_no_match_query')

    await driver.wait(async () => {
      const empty = await driver.findElements(By.css('[data-testid="empty-documents"]'))
      return empty.length > 0
    }, 20000)

    const emptyState = await driver.findElements(By.css('[data-testid="empty-documents"]'))
    assert.equal(emptyState.length > 0, true, 'No-match query should show empty result state')
  } finally {
    await driver.quit()
  }
}
