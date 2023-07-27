module.exports = {
  testEnvironment: 'node',
  verbose: true,
  testRegex: ['/*.spec.js$', '/*.test.js$'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.js', '!**/node_modules/**'],
  coverageReporters: ['lcov', 'text'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  setupFiles: ['./jest.setup.js'],
  moduleDirectories: ['node_modules'],
};
