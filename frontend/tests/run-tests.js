import accessControlTest from './access-control.test.js'
import loginTest from './login.test.js'
import logoutTest from './logout.test.js'
import uploadTest from './upload.test.js'

const tests = [
  { name: 'Login functionality test', run: loginTest },
  { name: 'File upload test', run: uploadTest },
  { name: 'Access control test', run: accessControlTest },
  { name: 'Logout test', run: logoutTest },
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

  const hasFailures = results.some((result) => result.status === 'FAIL')
  if (hasFailures) {
    process.exitCode = 1
  }
}

runAll()
