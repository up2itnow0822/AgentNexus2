# Changelog

## [1.0.0] - 2026-03-23

### Added
- Initial release of AgentNexus2 agent-to-agent infrastructure
- Backend API with Prisma ORM and Express
- x402 payment middleware
- Account abstraction via Alchemy AA
- Smart contracts for agent entitlements
- Agent Zero integration

### Fixed
- x402 middleware: typed `response.json()` result as `{ valid?: boolean; error?: string }` to resolve TS18046
- Backend: installed missing `@alchemy/aa-alchemy@^3.0.0` dependency
- Backend: ran `prisma generate` to produce Prisma client enums (AgentCategory, AgentStatus, BuildMethod, etc.)
