module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.spec.ts'], // Only match .spec.ts files
  roots: ['<rootDir>/src'], // Look for tests inside the src directory
  moduleFileExtensions: ['ts', 'js'], // Recognize both TypeScript and JavaScript files
  transform: {
    '^.+\\.ts$': 'ts-jest', // Use ts-jest to transform .ts files
  },
  coverageDirectory: 'coverage', // Directory where coverage reports are generated
  collectCoverageFrom: ['src/**/*.{ts,js}', '!src/**/*.spec.ts'], // Collect coverage, excluding .spec.ts files
  transformIgnorePatterns: [
    'node_modules/(?!(execa)/)', // Add execa to be transformed
  ],
};
