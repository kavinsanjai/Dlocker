import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { By, until } from 'selenium-webdriver'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const fixtureFilePath = path.resolve(__dirname, '../fixtures/sample-document.pdf')

export function uniqueUser(prefix) {
  const id = `${Date.now()}_${Math.floor(Math.random() * 10000)}`
  return {
    name: `${prefix} User`,
    email: `${prefix.toLowerCase()}_${id}@example.com`,
    password: 'Pass1234!',
  }
}

export async function waitForVisible(driver, locator, timeout = 15000) {
  const element = await driver.wait(until.elementLocated(locator), timeout)
  await driver.wait(until.elementIsVisible(element), timeout)
  return element
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

export async function logoutUser(driver) {
  await (await waitForVisible(driver, By.css('[data-testid="logout-button"]'))).click()
  await waitForVisible(driver, By.css('[data-testid="login-page"]'))
}

export async function uploadSampleDocument(driver) {
  const uploadInput = await waitForVisible(driver, By.id('file-aadhaar_card'))
  await uploadInput.sendKeys(fixtureFilePath)
  await (await waitForVisible(driver, By.css('[data-testid="upload-aadhaar_card"]'))).click()

  await driver.wait(async () => {
    const rows = await driver.findElements(By.css('[data-testid="document-row"]'))
    return rows.length > 0
  }, 20000)
}

export async function documentRowsText(driver) {
  const rows = await driver.findElements(By.css('[data-testid="document-row"]'))
  const texts = []

  for (const row of rows) {
    texts.push(await row.getText())
  }

  return texts
}
