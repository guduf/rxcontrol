/* eslint-disable */
module.exports = {
  roots: ['<rootDir>/src'],
  transform: {'^.+\\.tsx?$': 'ts-jest'},
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/tsconfig.test.json',
      esModuleInterop: true
    }
  }
}
