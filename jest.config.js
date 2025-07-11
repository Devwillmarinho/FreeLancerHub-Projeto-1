/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // A preset that is used as a base for Jest's configuration
  preset: "ts-jest",

  // The test environment that will be used for testing
  testEnvironment: "node",

  // A map from regular expressions to module names that allow to stub out resources
  // with a single module. This is the correct property name.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "<rootDir>/tests/**/*.test.js",
    "<rootDir>/tests/**/*.test.ts",
  ],

  // Automatically clear mock calls and instances between every test
  clearMocks: true,
};