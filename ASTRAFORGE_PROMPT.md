# AstraForge Development Prompt - AgentNexus V1

## Project Context

We are building **AgentNexus V1**, a revolutionary decentralized agent marketplace platform. This project will test and demonstrate AstraForge's full capabilities including multi-LLM collaboration, parallel work streams, quantum decision-making, emergent behavior detection, and self-modifying code.

## Complete Project Specification

Please refer to `PROJECT_SPEC.md` for the complete technical specification including:
- Architecture components (Frontend, Backend, Smart Contracts, Agent Runtime, Database)
- Development phases and timeline
- Technical requirements and quality standards
- Integration requirements
- Success criteria and risk mitigation

## Development Approach

### Multi-LLM Collaborative Panel (5 Models)

**Model Configuration**:
1. **Grok-2**: Creative architecture design, innovative problem-solving, system design patterns
2. **Gemini-2.0-Flash**: Technical analysis, performance optimization, code efficiency
3. **Claude-3.5-Sonnet**: Implementation quality, comprehensive documentation, testing strategies
4. **Consensus Mechanism**: Majority voting on architectural decisions
5. **Parallel Execution**: Multiple components developed simultaneously

### Parallel Development Streams

**Stream A - Smart Contracts & Security**:
- Develop Escrow contract (Solidity)
- Develop Entitlements ERC-1155 contract
- Write comprehensive Foundry tests
- Security audit preparation
- Deploy to testnets

**Stream B - Backend Services**:
- Design PostgreSQL database schema
- Implement Express.js API endpoints
- Integrate Alchemy Account Abstraction SDK
- Create Docker container orchestration service
- Set up authentication and authorization

**Stream C - Frontend Application**:
- Build Next.js application structure
- Create agent marketplace UI components
- Implement wallet connection (Wagmi/Viem)
- Build agent execution interface
- Create user dashboard

**Stream D - Agent Runtime**:
- Design Docker-based agent execution environment
- Create agent API specification
- Implement container health monitoring
- Build sample agent templates
- Set up resource management

**Stream E - Infrastructure & DevOps**:
- Configure GitHub Actions CI/CD
- Set up monitoring and logging
- Create deployment scripts
- Configure database migrations
- Implement backup strategies

## Quality Requirements

### Code Quality Standards
- **Type Safety**: Strict TypeScript mode enabled
- **Test Coverage**: Minimum 85% coverage required
- **Documentation**: Comprehensive inline comments + external docs
- **Linting**: ESLint + Prettier configured
- **Security**: No high/critical vulnerabilities

### Testing Requirements
- **Unit Tests**: All functions and methods
- **Integration Tests**: API endpoints and services
- **E2E Tests**: Complete user journeys
- **Contract Tests**: 100% coverage with Foundry
- **Load Tests**: Performance benchmarks

### Documentation Requirements
- **API Documentation**: OpenAPI 3.0 specifications
- **Architecture Docs**: Component diagrams and data flows
- **Developer Guide**: Agent development SDK
- **User Guide**: Platform usage instructions
- **Code Comments**: Every file, class, and function

## Implementation Phases

### Phase 1: Foundation (Priority: HIGHEST)
**Objective**: Set up all base infrastructure and configurations

**Tasks**:
1. Initialize all workspace packages (frontend, backend, smart-contracts, agent-runtime)
2. Configure TypeScript for each workspace
3. Set up ESLint and Prettier
4. Create base Dockerfile for each service
5. Initialize database schema design
6. Set up testing frameworks (Jest, Forge)

**Success Criteria**:
- All packages build successfully
- Linting passes on all code
- Docker Compose starts all services
- Database migrations run successfully
- Basic health check endpoints respond

### Phase 2: Smart Contracts (Priority: HIGH)
**Objective**: Implement and test blockchain layer

**Tasks**:
1. Implement Escrow contract with payment logic
2. Implement Entitlements ERC-1155 contract
3. Write comprehensive Foundry tests
4. Deploy to Sepolia testnet
5. Verify contracts on Etherscan
6. Create deployment scripts

**Success Criteria**:
- 100% test coverage
- Gas optimization complete
- Security analysis passed
- Deployed and verified on testnet
- Integration tests with backend

### Phase 3: Backend Core (Priority: HIGH)
**Objective**: Build API and business logic layer

**Tasks**:
1. Implement database models with Prisma
2. Create API routes (agents, users, payments, executions)
3. Integrate Alchemy Account Abstraction
4. Implement Docker container management
5. Set up authentication (JWT)
6. Create middleware (error handling, logging, rate limiting)

**Success Criteria**:
- All API endpoints functional
- Database queries optimized
- Authentication working
- Container orchestration operational
- API documentation complete

### Phase 4: Frontend (Priority: HIGH)
**Objective**: Build user-facing application

**Tasks**:
1. Set up Next.js with App Router
2. Create UI component library
3. Implement wallet connection
4. Build agent marketplace views
5. Create agent execution interface
6. Implement user dashboard

**Success Criteria**:
- All pages responsive
- Wallet connection working
- Agent browsing functional
- Execution interface operational
- User dashboard complete

### Phase 5: Agent Runtime (Priority: MEDIUM)
**Objective**: Create agent execution environment

**Tasks**:
1. Build Docker base images for agents
2. Implement container lifecycle management
3. Create agent communication protocol
4. Set up health monitoring
5. Implement resource constraints
6. Create sample agents

**Success Criteria**:
- Agents execute successfully
- Health checks operational
- Resource limits enforced
- Monitoring dashboards working
- Sample agents functional

### Phase 6: Integration & Testing (Priority: HIGH)
**Objective**: Connect all components and ensure quality

**Tasks**:
1. End-to-end integration testing
2. Load testing and performance optimization
3. Security testing and vulnerability scanning
4. User acceptance testing
5. Documentation review and completion

**Success Criteria**:
- All E2E tests passing
- Performance targets met
- No critical vulnerabilities
- Documentation complete
- Ready for deployment

## AstraForge-Specific Instructions

### Use Advanced AI Features

1. **Meta-Learning System**: Learn from development patterns and optimize workflow
2. **Emergent Behavior Detection**: Identify novel solutions and breakthrough approaches
3. **Quantum Decision Making**: Use quantum algorithms for complex optimization decisions
4. **Self-Modification**: Allow system to improve its own code generation strategies
5. **Agent Evolution**: Enable autonomous agent specialization for different tasks

### Collaboration Protocol

1. **Consensus Voting**: All architectural decisions require 3/5 LLM agreement
2. **Parallel Work**: Execute independent streams simultaneously
3. **Real-time Sync**: Use collaboration server for state sharing
4. **Error Recovery**: Automatic fallback and retry on failures
5. **Quality Gates**: Block progression until standards met

### Monitoring & Feedback

1. **Track Metrics**: Monitor development speed, code quality, test coverage
2. **User Feedback**: Incorporate supervisor feedback at each phase
3. **Self-Assessment**: Each LLM evaluates its own outputs
4. **Continuous Improvement**: Adapt strategies based on results
5. **Transparency**: Log all decisions and reasoning

## Expected Output

For each phase, provide:

1. **Implementation Code**: Complete, tested, documented code
2. **Test Suites**: Comprehensive tests with high coverage
3. **Documentation**: API docs, architecture diagrams, guides
4. **Migration Scripts**: Database and deployment automation
5. **Status Report**: Progress summary, issues, next steps

## Success Metrics

- **Development Speed**: Complete Phase 1-6 within reasonable timeframe
- **Code Quality**: 85%+ test coverage, zero critical issues
- **Documentation**: 100% API coverage, comprehensive guides
- **Performance**: Meet all benchmarks (< 200ms API, < 5s agent execution)
- **Security**: Pass security audit, no high/critical vulnerabilities

## Constraints & Guidelines

1. **Use Modern Practices**: Latest TypeScript features, modern React patterns
2. **Follow Conventions**: Established naming conventions, file structure
3. **Optimize for Maintainability**: Clear code > clever code
4. **Security First**: Input validation, error handling, rate limiting
5. **Performance Aware**: Efficient queries, caching, lazy loading

## Getting Started

Begin with **Phase 1: Foundation** and proceed sequentially through phases. Use parallel streams within each phase for maximum efficiency. Ensure all quality gates pass before proceeding to the next phase.

**Ready to begin! Let's build AgentNexus V1! 🚀**

