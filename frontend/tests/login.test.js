import assert from 'node:assert/strict'
import config from './utils/config.js'
import { createDriver } from './utils/driver.js'
import { loginUser, registerUser, uniqueUser, waitForVisible } from './utils/helpers.js'
import { By } from 'selenium-webdriver'

export default async function loginTest() {
  const driver = createDriver(config.browser)

  try {
    const user = uniqueUser('login')
    await registerUser(driver, config.appBaseUrl, user)
    await loginUser(driver, config.appBaseUrl, user)

    const dashboard = await waitForVisible(driver, By.css('[data-testid="dashboard-page"]'))
    assert.ok(await dashboard.isDisplayed(), 'Dashboard should be visible after login')
  } finally {
    await driver.quit()
  }
}
