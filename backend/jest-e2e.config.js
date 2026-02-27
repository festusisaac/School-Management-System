module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@guards/(.*)$': '<rootDir>/src/guards/$1',
    '^@filters/(.*)$': '<rootDir>/src/filters/$1',
    '^@interceptors/(.*)$': '<rootDir>/src/interceptors/$1',
    '^@decorators/(.*)$': '<rootDir>/src/decorators/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1',
    '^@queue/(.*)$': '<rootDir>/src/queue/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
  ],
  coverageDirectory: './coverage',
};
