import assert from 'node:assert/strict'
import { By } from 'selenium-webdriver'
import config from './utils/config.js'
import { createDriver } from './utils/driver.js'
import {
  loginUser,
  registerUser,
  uniqueUser,
  uploadSampleDocument,
  waitForVisible,
} from './utils/helpers.js'

export default async function activityLogsTest() {
  const driver = createDriver(config.browser)

  try {
    const user = uniqueUser('activity')
    await registerUser(driver, config.appBaseUrl, user)
    await loginUser(driver, config.appBaseUrl, user)
    await uploadSampleDocument(driver, 'aadhaar_card')

    await waitForVisible(driver, By.css('[data-testid="activity-section"]'))
    await waitForVisible(driver, By.css('[data-testid="activity-logs"]'))
    await driver.wait(async () => {
      const rows = await driver.findElements(By.css('[data-testid="activity-logs"] tbody tr'))
      return rows.length > 0
    }, 20000)

    const activityText = await (await waitForVisible(driver, By.css('[data-testid="activity-logs"]'))).getText()
    const normalized = activityText.toLowerCase()

    assert.equal(
      normalized.includes('upload') || normalized.includes('login') || normalized.includes('share'),
      true,
      'Activity logs should include at least one tracked action',
    )
  } finally {
    await driver.quit()
  }
}
