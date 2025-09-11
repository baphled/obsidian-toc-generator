// jest.config.js
module.exports = {
  testMatch: [
    "**/__tests__/**/*.spec.js",
    "**/__tests__/**/*.test.js",
    "**/?(*.)+(spec|test).js",
  ],
  testEnvironment: "node",
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  transformIgnorePatterns: ["/node_modules/"],
  collectCoverage: true,
  collectCoverageFrom: ["lib/**/*.js"],
  clearMocks: true,
  verbose: true,
};
