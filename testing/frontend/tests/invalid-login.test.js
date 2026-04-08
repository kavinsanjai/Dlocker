import assert from 'node:assert/strict'
import config from './utils/config.js'
import { createDriver } from './utils/driver.js'
import {
  getErrorText,
  loginWithCredentials,
  registerUser,
  uniqueUser,
} from './utils/helpers.js'

export default async function invalidLoginTest() {
  const driver = createDriver(config.browser)

  try {
    const user = uniqueUser('invalidlogin')
    await registerUser(driver, config.appBaseUrl, user)
    await loginWithCredentials(driver, config.appBaseUrl, user.email, 'WrongPass123!')

    const errorText = await getErrorText(driver)
    assert.equal(
      errorText.includes('Invalid email or password.'),
      true,
      'Invalid login should show authentication error',
    )
  } finally {
    await driver.quit()
  }
}
