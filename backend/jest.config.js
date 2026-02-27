module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  roots: [
    '<rootDir>',
    '<rootDir>/../test',
  ],
  moduleNameMapper: {
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@database/(.*)$': '<rootDir>/database/$1',
    '^@middleware/(.*)$': '<rootDir>/middleware/$1',
    '^@guards/(.*)$': '<rootDir>/guards/$1',
    '^@filters/(.*)$': '<rootDir>/filters/$1',
    '^@interceptors/(.*)$': '<rootDir>/interceptors/$1',
    '^@decorators/(.*)$': '<rootDir>/decorators/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
    '^@queue/(.*)$': '<rootDir>/queue/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
  },
};
