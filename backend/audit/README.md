# Backend production audit artifacts (pnpm 10.28.2)

Registry: **https://registry.npmjs.org/**

Method (same settings for both runs):

1. Isolated directory with `package.json`, `pnpm-lock.yaml`, and `backend/.npmrc` (`node-linker=hoisted`)
2. `pnpm install --frozen-lockfile --ignore-workspace`
3. `pnpm audit --prod`

| Artifact | Lockfile source |
|----------|-----------------|
| `audit-prod-main-99c11621.{txt,json}` | `main` @ `99c116213ca8724e8180b1d0173bfb96fa7080eb` |
| `audit-prod-pr59-branch.{txt,json}` | PR branch head at generation time |

**Note:** Auditing from the repo workspace with an existing hoisted `node_modules` (without a fresh frozen install in an isolated tree) can under-count; Ops reconciliation uses the isolated lockfile install above.
