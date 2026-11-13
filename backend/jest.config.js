export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  verbose: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^\\.\\./utils/runtimePaths\\.js$': '<rootDir>/src/utils/runtimePaths.jest-mock.ts',
    '^\\./eliza/ElizaAgentService\\.js$': '<rootDir>/src/services/eliza/ElizaAgentService.jest-mock.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.jest.json',
        diagnostics: { ignoreCodes: [1343] },
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@alchemy|@wagmi|wagmi|viem|@elizaos)/)',
  ],
};

