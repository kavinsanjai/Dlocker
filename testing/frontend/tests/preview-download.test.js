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

export default async function previewAndDownloadTest() {
  const driver = createDriver(config.browser)

  try {
    const user = uniqueUser('preview')
    await registerUser(driver, config.appBaseUrl, user)
    await loginUser(driver, config.appBaseUrl, user)
    await uploadSampleDocument(driver, 'aadhaar_card')

    const previewButton = await waitForVisible(driver, By.css('[data-testid="preview-aadhaar_card"]'))
    await previewButton.click()

    const previewModal = await waitForVisible(driver, By.css('[data-testid="preview-modal"]'))
    assert.equal(await previewModal.isDisplayed(), true, 'Preview modal should open')

    await (await waitForVisible(driver, By.css('[data-testid="close-preview"]'))).click()

    const downloadButton = await waitForVisible(driver, By.css('[data-testid="download-aadhaar_card"]'))
    assert.equal(await downloadButton.isDisplayed(), true, 'Download action should be visible')
  } finally {
    await driver.quit()
  }
}
