// main-api/jest.config.mjs
export default {
  testEnvironment: 'node',

  // 1. NO 'extensionsToTreatAsEsm' KEY.
  // This key was causing the Validation Error, which in turn
  // was breaking the transformer. Your "type": "module"
  // in package.json is sufficient.

  // 2. THIS IS THE TRANSFORMER.
  // This rule will now be loaded correctly because the
  // Validation Error is gone. It will find jest.setup.ts
  // and transform it before running it.
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
        diagnostics: {
          ignoreCodes: [1378, 151002], // Ignore top-level await and hybrid module warnings
        },
      },
    ],
  },

  // 3. This is correct for your monorepo.
  transformIgnorePatterns: ['/node_modules/(?!@horizon/shared)'],

  // 4. This is correct for your .js imports.
  moduleNameMapper: {
    '^@horizon/shared/(.*)\\.js$': '<rootDir>/../shared/src/$1.ts',
    '^@horizon/shared$': '<rootDir>/../shared/src/index.ts',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  // 5. This is all correct.
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  setupFiles: ['dotenv/config'],
};
