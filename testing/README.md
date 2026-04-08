# Testing Workspace

This folder contains dedicated test suites split by layer:

- `testing/backend`: unit tests for backend logic (JUnit-style for JS projects)
- `testing/frontend`: Selenium end-to-end browser tests

## Run backend suite

```bash
npm --prefix testing/backend test
```

## Run Selenium suite

Start frontend and backend first, then run:

```bash
npm --prefix testing/frontend test
```

You can configure Selenium with environment variables in `testing/frontend/.env`:

```env
APP_BASE_URL=http://localhost:5173
BROWSER=chrome
```
