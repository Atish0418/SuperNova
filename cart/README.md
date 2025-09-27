# Cart service - tests

Quick steps to run tests locally:

1. Install dev dependencies:

```bash
npm install --save-dev jest@^29 supertest@^6 cross-env@^7
```

2. Run tests:

```bash
npm test
```

Notes:
- The test file `tests/cart.test.js` contains skeletons. You need to mock your product/stock service and cart persistence (or provide an in-memory implementation) before tests will pass.
- `src/app.js` should export your Express app (already expected by the tests).
