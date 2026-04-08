import accessControlTest from './tests/access-control.test.js'
import authFlowTest from './tests/auth-flow.test.js'
import activityLogsTest from './tests/activity-logs.test.js'
import darkModeTest from './tests/dark-mode.test.js'
import deleteDocumentTest from './tests/delete-document.test.js'
import duplicateRegisterTest from './tests/duplicate-register.test.js'
import invalidLoginTest from './tests/invalid-login.test.js'
import invalidUploadTypeTest from './tests/invalid-upload-type.test.js'
import ocrSearchTest from './tests/ocr-search.test.js'
import previewAndDownloadTest from './tests/preview-download.test.js'
import protectedRouteTest from './tests/protected-route.test.js'
import searchNoResultsTest from './tests/search-no-results.test.js'
import shareLinkTest from './tests/share-link.test.js'
import uploadFlowTest from './tests/upload-flow.test.js'

const tests = [
  { name: 'Auth flow', run: authFlowTest },
  { name: 'Invalid login', run: invalidLoginTest },
  { name: 'Duplicate register', run: duplicateRegisterTest },
  { name: 'Protected route redirect', run: protectedRouteTest },
  { name: 'Upload flow', run: uploadFlowTest },
  { name: 'Invalid upload type', run: invalidUploadTypeTest },
  { name: 'OCR search', run: ocrSearchTest },
  { name: 'Search no results', run: searchNoResultsTest },
  { name: 'Preview and download', run: previewAndDownloadTest },
  { name: 'Delete document', run: deleteDocumentTest },
  { name: 'Share link', run: shareLinkTest },
  { name: 'Activity logs', run: activityLogsTest },
  { name: 'Dark mode persistence', run: darkModeTest },
  { name: 'Access control', run: accessControlTest },
]

async function runAll() {
  const results = []

  for (const test of tests) {
    const startedAt = Date.now()

    try {
      await test.run()
      results.push({
        name: test.name,
        status: 'PASS',
        durationMs: Date.now() - startedAt,
      })
    } catch (error) {
      results.push({
        name: test.name,
        status: 'FAIL',
        durationMs: Date.now() - startedAt,
        error: error.message,
      })
    }
  }

  for (const result of results) {
    if (result.status === 'PASS') {
      console.log(`PASS - ${result.name} (${result.durationMs} ms)`)
    } else {
      console.error(`FAIL - ${result.name} (${result.durationMs} ms)`)
      console.error(`  ${result.error}`)
    }
  }

  if (results.some((result) => result.status === 'FAIL')) {
    process.exitCode = 1
  }
}

runAll()
