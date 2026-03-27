import assert from 'node:assert/strict'
import config from './utils/config.js'
import { createDriver } from './utils/driver.js'
import {
  documentRowsText,
  loginUser,
  logoutUser,
  registerUser,
  uniqueUser,
  uploadSampleDocument,
} from './utils/helpers.js'

export default async function accessControlTest() {
  const driver = createDriver(config.browser)

  try {
    const userA = uniqueUser('owner')
    const userB = uniqueUser('other')

    await registerUser(driver, config.appBaseUrl, userA)
    await loginUser(driver, config.appBaseUrl, userA)
    await uploadSampleDocument(driver)

    const ownerRows = await documentRowsText(driver)
    assert.ok(ownerRows.length > 0, 'Owner should see at least one document')

    await logoutUser(driver)

    await registerUser(driver, config.appBaseUrl, userB)
    await loginUser(driver, config.appBaseUrl, userB)

    const otherRows = await documentRowsText(driver)
    const containsOwnerFile = otherRows.some((text) => text.includes('sample-document.pdf'))

    assert.equal(
      containsOwnerFile,
      false,
      'Second user must not see first user documents',
    )
  } finally {
    await driver.quit()
  }
}
