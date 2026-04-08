import assert from 'node:assert/strict'
import config from './utils/config.js'
import { createDriver } from './utils/driver.js'
import {
  getErrorText,
  loginUser,
  registerUser,
  uniqueUser,
  uploadInvalidDocument,
} from './utils/helpers.js'

export default async function invalidUploadTypeTest() {
  const driver = createDriver(config.browser)

  try {
    const user = uniqueUser('badupload')
    await registerUser(driver, config.appBaseUrl, user)
    await loginUser(driver, config.appBaseUrl, user)
    await uploadInvalidDocument(driver, 'aadhaar_card')

    const errorText = await getErrorText(driver)
    assert.equal(
      errorText.includes('Only PDF and image files are allowed.'),
      true,
      'Invalid file type upload should be rejected by backend',
    )
  } finally {
    await driver.quit()
  }
}
