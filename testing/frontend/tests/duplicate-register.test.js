import assert from 'node:assert/strict'
import { By } from 'selenium-webdriver'
import config from './utils/config.js'
import { createDriver } from './utils/driver.js'
import {
  getErrorText,
  registerUser,
  uniqueUser,
  waitForVisible,
} from './utils/helpers.js'

export default async function duplicateRegisterTest() {
  const driver = createDriver(config.browser)

  try {
    const user = uniqueUser('dupreg')
    await registerUser(driver, config.appBaseUrl, user)

    await driver.get(`${config.appBaseUrl}/register`)
    await (await waitForVisible(driver, By.id('register-name'))).sendKeys(user.name)
    await (await waitForVisible(driver, By.id('register-email'))).sendKeys(user.email)
    await (await waitForVisible(driver, By.id('register-password'))).sendKeys(user.password)
    await (await waitForVisible(driver, By.id('register-submit'))).click()

    const errorText = await getErrorText(driver)
    assert.equal(
      errorText.includes('Email already registered.'),
      true,
      'Duplicate registration should be rejected',
    )
  } finally {
    await driver.quit()
  }
}
