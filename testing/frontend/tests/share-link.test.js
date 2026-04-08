import assert from 'node:assert/strict'
import { By, until } from 'selenium-webdriver'
import config from './utils/config.js'
import { createDriver } from './utils/driver.js'
import {
  loginUser,
  registerUser,
  uniqueUser,
  uploadSampleDocument,
  waitForVisible,
} from './utils/helpers.js'

export default async function shareLinkTest() {
  const driver = createDriver(config.browser)

  try {
    const user = uniqueUser('share')
    await registerUser(driver, config.appBaseUrl, user)
    await loginUser(driver, config.appBaseUrl, user)
    await uploadSampleDocument(driver, 'aadhaar_card')

    const shareButtons = await driver.findElements(By.css('[data-testid^="share-"]'))
    assert.ok(shareButtons.length > 0, 'At least one share button should be available')

    await shareButtons[0].click()

    await driver.wait(async () => {
      const linkTexts = await driver.findElements(By.css('p.file-selected-name'))
      if (linkTexts.length === 0) {
        return false
      }

      const values = await Promise.all(linkTexts.map((item) => item.getText()))
      return values.some((value) => value.includes('/api/share/'))
    }, 15000)

    const links = await driver.findElements(By.css('p.file-selected-name'))
    const texts = await Promise.all(links.map((item) => item.getText()))

    assert.ok(
      texts.some((value) => value.includes('/api/share/')),
      'Generated share URL should be displayed in the row',
    )

    await driver.wait(until.urlContains('/dashboard'), 5000)
    await waitForVisible(driver, By.css('[data-testid="dashboard-page"]'))
  } finally {
    await driver.quit()
  }
}
