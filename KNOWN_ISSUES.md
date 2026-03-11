# Known Issues

## npm Security Vulnerabilities (No Available Fix)

### bigint-buffer (backend)
- **Severity:** High
- **CVE:** Related to prototype pollution
- **Status:** No upstream fix available. The package is unmaintained.
- **Mitigation:** `bigint-buffer` is a transitive dependency of Solana-related packages (`@solana/spl-token`, `@elizaos/plugin-solana`). It is not used directly in production API paths. Avoid exposing Solana wallet operations to untrusted input until a maintained alternative is available.
- **Tracking:** Monitor https://github.com/nicholasgasior/gsfmt/issues for updates.

### @alchemy/aa-core / @alchemy/aa-accounts (backend + frontend)
- **Severity:** High (via bundled viem ws dependency)
- **Status:** The fix requires a semver-major upgrade to `@alchemy/aa-alchemy@3.7.3` which introduced breaking API changes in the smart account client interface. Upgrading was deferred to avoid runtime breakage.
- **Resolution path:** Refactor `src/routes/wallet.ts` to use the new `@alchemy/aa-alchemy` v3.7+ API, then upgrade.

### @elizaos/plugin-discord / @elizaos/plugin-solana (backend)
- **Severity:** High
- **Status:** No fix available from upstream ElizaOS. These are runtime agent plugins.
- **Mitigation:** Do not expose these plugin endpoints to untrusted external traffic without an authentication layer.

## Last Updated
2026-03-11 — After `npm audit fix --force` runs. Remaining: 12 high (backend), 4 high (frontend).
