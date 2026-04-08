import assert from 'node:assert/strict'
import { By } from 'selenium-webdriver'
import config from './utils/config.js'
import { createDriver } from './utils/driver.js'
import { waitForVisible } from './utils/helpers.js'

export default async function protectedRouteTest() {
  const driver = createDriver(config.browser)

  try {
    await driver.get(`${config.appBaseUrl}/dashboard`)
    const loginPage = await waitForVisible(driver, By.css('[data-testid="login-page"]'))

    assert.equal(
      await loginPage.isDisplayed(),
      true,
      'Unauthenticated user should be redirected to login page',
    )
  } finally {
    await driver.quit()
  }
}
