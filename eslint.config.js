// Server/eslint.config.js
import eslint from '@eslint/js';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // 1. Global Ignores
  {
    ignores: [
      'dist/',
      'node_modules/',
      '*.js', // Ignore root-level JS files
    ],
  },

  // 2. Base ESLint recommended config
  eslint.configs.recommended,

  // 3. Main TypeScript Configuration
  {
    files: ['src/**/*.ts'], // Only lint files in 'src' now
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'prettier': prettierPlugin,
    },
    languageOptions: {
      parser: typescriptParser, // Use the TS parser
      parserOptions: {
        project: './tsconfig.json', // Point to your tsconfig
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node, // Automatically adds all Node.js globals
        ...globals.es2021,
      },
    },
    rules: {
      ...typescriptEslint.configs['recommended'].rules, // Use TS-specific rules

      // Our Custom Rules
      'prettier/prettier': 'warn', // Show prettier errors as warnings
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // 4. Prettier Config (must be last to override styling)
  prettierConfig,
];
