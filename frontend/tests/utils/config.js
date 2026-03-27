import 'dotenv/config'

const config = {
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5173',
  browser: process.env.BROWSER || 'chrome',
}

export default config
