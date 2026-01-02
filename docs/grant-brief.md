# Grant Brief

## Elevator Pitch
AgentNexus delivers a secure way for organizations to discover, purchase, and run autonomous AI agents on Base. We combine account abstraction, sandboxed execution, and cross-chain USDC flows so teams can trust, pay, and deploy agents without giving up custody or control.

## Problem Statement
Teams want to adopt AI agents but cannot safely expose wallets or infrastructure to third-party code. Traditional marketplaces are either custodial, too permissive, or lack compliant payment rails. AgentNexus solves this by pairing ERC-4337 smart accounts with hardened, audited execution sandboxes and verifiable payment bridges.

## Beneficiaries
- **Enterprise builders** who need controlled agent execution without compromising security or compliance.
- **AI developers** who want revenue and visibility without running their own infra or taking custody of user funds.
- **Ecosystem partners** (wallets, infra providers, L2s) who benefit from safer on-ramps for agent-driven transactions.

## Novelty
- **ERC-4337-native accounts** for non-custodial, programmable agent workflows with granular spending policies.
- **Sandboxed agents** that run in hardened Docker containers with seccomp profiles, read-only filesystems, and no direct wallet access.
- **CCTP-backed USDC settlement** so users can fund agent actions from other chains (Arbitrum/Optimism) while executions land on Base.
- **Compliance toggles** for geo/KYC filters and runtime isolation, enabling regulated teams to adopt agent automation with guardrails.

## Measurable Milestones
- **M1 (Weeks 1–4):** Ship reviewer walkthroughs for ERC-4337 flows, sandbox hardening report, and CCTP proof updates.
- **M2 (Weeks 5–8):** Deliver managed agent onboarding (whitelisted images, signed manifests) and automated settlement receipts.
- **M3 (Weeks 9–12):** Launch marketplace discovery beta with role-gated agent categories and per-request paywalls.

## 3–6 Month Roadmap
| Timeline | Feature | Funding Needs | Risks | Mitigations |
| --- | --- | --- | --- | --- |
| Months 1–2 | Harden agent runtime (seccomp profiles, egress controls), publish ERC-4337 policy templates | Security review budget; infra for isolated runners | Sandbox bypass or misconfigured policies | Automated policy tests; locked-down base images; recurring audits |
| Months 2–4 | Managed agent onboarding (signed images, provenance checks), payment receipts for every run | CI for image signing; storage for attestations; QA bandwidth | Supply-chain attack or unverified agents | Sigstore/cosign verification; allowlist manifests; manual review queue |
| Months 3–5 | Marketplace discovery beta with pay-per-request pricing (x402) and category gating | Frontend polish; uptime SLOs; support budget | Mispriced endpoints; UX confusion | Staged rollout; feature flags; guided pricing templates |
| Months 4–6 | Cross-chain funding expansion via CCTP relayers and fee simulation | Relayer incentives; monitoring; gas buffers | Bridge congestion or delayed mints | Multiple relayer options; alerting; fallback to Base-only path |

## Non-Technical FAQ (For Reviewers)
**How is this different from a typical dApp?** We use ERC-4337 smart accounts so users keep their own keys and can set spend limits for each agent run, instead of handing control to a custodial service.

**How do you keep agents from going rogue?** Every agent runs inside a locked-down container (sandboxed runtime) with no direct wallet access, restricted syscalls, and read-only filesystems, so even a bad agent cannot drain funds.

**How do payments work across chains?** Users can pay in USDC from other chains using Circle's CCTP; those funds are minted on Base and linked to the exact agent run, giving reviewers traceable, cross-chain settlement without trusting a centralized escrow.
