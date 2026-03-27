import assert from 'node:assert/strict'
import config from './utils/config.js'
import { createDriver } from './utils/driver.js'
import {
  loginUser,
  logoutUser,
  registerUser,
  uniqueUser,
  waitForVisible,
} from './utils/helpers.js'
import { By } from 'selenium-webdriver'

export default async function logoutTest() {
  const driver = createDriver(config.browser)

  try {
    const user = uniqueUser('logout')
    await registerUser(driver, config.appBaseUrl, user)
    await loginUser(driver, config.appBaseUrl, user)
    await logoutUser(driver)

    await driver.get(`${config.appBaseUrl}/dashboard`)
    const loginPage = await waitForVisible(driver, By.css('[data-testid="login-page"]'))

    assert.ok(loginPage, 'User should be redirected to login page after logout')
  } finally {
    await driver.quit()
  }
}
