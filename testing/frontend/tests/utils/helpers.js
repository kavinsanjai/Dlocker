import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { By, Key, until } from 'selenium-webdriver'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const fixtureFilePath = path.resolve(__dirname, '../../../../frontend/tests/fixtures/sample-document.pdf')
export const invalidFixtureFilePath = path.resolve(__dirname, '../fixtures/invalid-document.txt')

export function uniqueUser(prefix) {
  const id = `${Date.now()}_${Math.floor(Math.random() * 10000)}`

  return {
    name: `${prefix} User`,
    email: `${prefix.toLowerCase()}_${id}@example.com`,
    password: 'Pass1234!',
  }
}

export async function waitForVisible(driver, locator, timeout = 20000) {
  const element = await driver.wait(until.elementLocated(locator), timeout)
  await driver.wait(until.elementIsVisible(element), timeout)
  return element
}

export async function waitForAny(driver, locator, timeout = 20000) {
  await driver.wait(async () => {
    const elements = await driver.findElements(locator)
    return elements.length > 0
  }, timeout)

  return driver.findElements(locator)
}

export async function registerUser(driver, appBaseUrl, user) {
  await driver.get(`${appBaseUrl}/register`)

  await (await waitForVisible(driver, By.id('register-name'))).sendKeys(user.name)
  await (await waitForVisible(driver, By.id('register-email'))).sendKeys(user.email)
  await (await waitForVisible(driver, By.id('register-password'))).sendKeys(user.password)
  await (await waitForVisible(driver, By.id('register-submit'))).click()

  await waitForVisible(driver, By.id('login-email'))
}

export async function loginUser(driver, appBaseUrl, user) {
  await driver.get(`${appBaseUrl}/login`)

  const emailInput = await waitForVisible(driver, By.id('login-email'))
  await emailInput.clear()
  await emailInput.sendKeys(user.email)

  const passwordInput = await waitForVisible(driver, By.id('login-password'))
  await passwordInput.clear()
  await passwordInput.sendKeys(user.password)

  await (await waitForVisible(driver, By.id('login-submit'))).click()
  await waitForVisible(driver, By.css('[data-testid="dashboard-page"]'))
}

export async function loginWithCredentials(driver, appBaseUrl, email, password) {
  await driver.get(`${appBaseUrl}/login`)

  const emailInput = await waitForVisible(driver, By.id('login-email'))
  await emailInput.clear()
  await emailInput.sendKeys(email)

  const passwordInput = await waitForVisible(driver, By.id('login-password'))
  await passwordInput.clear()
  await passwordInput.sendKeys(password)

  await (await waitForVisible(driver, By.id('login-submit'))).click()
}

export async function logoutUser(driver) {
  await (await waitForVisible(driver, By.css('[data-testid="logout-button"]'))).click()
  await waitForVisible(driver, By.css('[data-testid="login-page"]'))
}

export async function uploadSampleDocument(driver, documentType = 'aadhaar_card') {
  const input = await waitForVisible(driver, By.id(`upload-${documentType}-file`))
  await input.sendKeys(fixtureFilePath)

  const submit = await waitForVisible(driver, By.css(`[data-testid="upload-${documentType}-submit"]`))
  await submit.click()

  await driver.wait(async () => {
    const rows = await driver.findElements(By.css('[data-testid="document-row"]'))
    return rows.length > 0
  }, 30000)
}

export async function uploadInvalidDocument(driver, documentType = 'aadhaar_card') {
  const input = await waitForVisible(driver, By.id(`upload-${documentType}-file`))
  await input.sendKeys(invalidFixtureFilePath)

  const submit = await waitForVisible(driver, By.css(`[data-testid="upload-${documentType}-submit"]`))
  await submit.click()
}

export async function openSearchAndType(driver, text) {
  const searchInput = await waitForVisible(driver, By.css('[data-testid="search-input"]'))
  await searchInput.click()
  await searchInput.sendKeys(Key.CONTROL, 'a')
  await searchInput.sendKeys(Key.BACK_SPACE)
  await searchInput.sendKeys(text)
}

export async function getDocumentRows(driver) {
  return waitForAny(driver, By.css('[data-testid="document-row"]'))
}

export async function getErrorText(driver) {
  const error = await waitForVisible(driver, By.css('.error-text'))
  return error.getText()
}

export async function getSuccessText(driver) {
  const success = await waitForVisible(driver, By.css('.success-text'))
  return success.getText()
}
