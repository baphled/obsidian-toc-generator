module.exports = {
  rootDir: __dirname,                         // <- lock root
  coverageDirectory: '<rootDir>/coverage',    // <- always write here
  coverageProvider: 'v8',                     // <- avoids Babel instrumentation pitfalls
  coverageReporters: ['json-summary', 'lcov', 'text', 'text-summary'],
  collectCoverage: true,
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
  verbose: true,
};
