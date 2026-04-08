import assert from 'node:assert/strict'
import { By } from 'selenium-webdriver'
import config from './utils/config.js'
import { createDriver } from './utils/driver.js'
import { loginUser, logoutUser, registerUser, uniqueUser, waitForVisible } from './utils/helpers.js'

export default async function authFlowTest() {
  const driver = createDriver(config.browser)

  try {
    const user = uniqueUser('authflow')
    await registerUser(driver, config.appBaseUrl, user)
    await loginUser(driver, config.appBaseUrl, user)

    const dashboard = await waitForVisible(driver, By.css('[data-testid="dashboard-page"]'))
    assert.ok(await dashboard.isDisplayed(), 'Dashboard should be visible after login')

    await logoutUser(driver)
    const loginPage = await waitForVisible(driver, By.css('[data-testid="login-page"]'))
    assert.ok(await loginPage.isDisplayed(), 'Login page should be visible after logout')
  } finally {
    await driver.quit()
  }
}
