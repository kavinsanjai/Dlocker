import { Builder } from 'selenium-webdriver'

export function createDriver(browserName) {
  return new Builder().forBrowser(browserName).build()
}
