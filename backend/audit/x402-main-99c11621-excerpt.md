# x402 integration failure on `main` @ `99c116213ca8724e8180b1d0173bfb96fa7080eb`

Command:

```bash
cd backend && pnpm install --ignore-workspace --frozen-lockfile
pnpm test tests/integration/x402-integration.test.ts
```

Excerpt (failure):

```
  ● x402 Integration Tests › x402 Hardening - Local Validation › should reject oversized X-Payment headers

    expect(received).toBe(expected) // Object.is equality

    Expected: 402
    Received: 431

      359 |             expect(response.status).toBe(402);

Test Suites: 1 failed, 1 total
Tests:       1 failed, 14 passed, 15 total
```

**Conclusion:** known pre-existing on `main` (not a regression from this PR).
