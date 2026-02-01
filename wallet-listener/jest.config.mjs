// wallet-listener/jest.config.mjs
export default {
  testEnvironment: 'node',

  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
      },
    ],
  },

  // Transform shared package
  transformIgnorePatterns: ['/node_modules/(?!@horizon/shared)'],

  // Map .js imports to .ts source files
  moduleNameMapper: {
    '^@horizon/shared/(.*)\\.js$': '<rootDir>/../shared/src/$1.ts',
    '^@horizon/shared$': '<rootDir>/../shared/src/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)', '**/*.test.[jt]s?(x)'],
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  setupFiles: ['dotenv/config'],
};
