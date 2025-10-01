// jest.config.js
module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  verbose: true,

  // Transform only our code; don't rewrite node_modules
  transform: { '^.+\\.jsx?$': ['babel-jest', { sourceMaps: 'inline' }] },
  transformIgnorePatterns: ['/node_modules/'],

  // ---- Coverage (V8) ----
  collectCoverage: true,
  coverageProvider: 'v8',
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['json-summary', 'lcov', 'text', 'text-summary'],
  collectCoverageFrom: [
    '<rootDir>/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!vetur.config.js',
    '!babel.config.js',
  ], // <- anchor to <rootDir>
  testMatch: [
    '**/tests/**/*.spec.js',
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',                 // use "@/..." in tests
  },
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  transform: { '^.+\\.jsx?$': 'babel-jest' },
  testEnvironment: 'jsdom',
  clearMocks: true,
};
