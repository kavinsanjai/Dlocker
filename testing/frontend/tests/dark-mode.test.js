import assert from 'node:assert/strict'
import { By } from 'selenium-webdriver'
import config from './utils/config.js'
import { createDriver } from './utils/driver.js'
import { loginUser, registerUser, uniqueUser, waitForVisible } from './utils/helpers.js'

export default async function darkModeTest() {
  const driver = createDriver(config.browser)

  try {
    const user = uniqueUser('theme')
    await registerUser(driver, config.appBaseUrl, user)
    await loginUser(driver, config.appBaseUrl, user)

    const themeToggle = await waitForVisible(driver, By.css('.theme-toggle'))
    await themeToggle.click()

    const htmlElement = await driver.findElement(By.css('html'))
    const selectedTheme = await htmlElement.getAttribute('data-theme')
    assert.equal(selectedTheme, 'dark', 'Theme should switch to dark mode')

    await driver.navigate().refresh()
    await waitForVisible(driver, By.css('[data-testid="dashboard-page"]'))

    const persistedTheme = await (await driver.findElement(By.css('html'))).getAttribute('data-theme')
    assert.equal(persistedTheme, 'dark', 'Dark mode should persist after refresh')
  } finally {
    await driver.quit()
  }
}
