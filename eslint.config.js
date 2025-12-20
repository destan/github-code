import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'playwright-report/**'],
  },
  {
    rules: {
      // Allow non-null assertions where we know elements exist
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Allow unused vars prefixed with underscore
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Allow numbers in template literals
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // Allow || for empty string fallbacks
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      // Browser API checks often trigger false positives
      '@typescript-eslint/no-unnecessary-condition': 'off',
      // Utility classes with only static methods are a valid pattern
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
  // Relaxed rules for test files
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    rules: {
      // Tests often use || for fallbacks with empty strings
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      // Tests may have intentional type assertions
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      // Tests may have intentionally broad conditions
      '@typescript-eslint/no-unnecessary-condition': 'off',
      // Tests often mock with any
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      // Tests may have empty functions for mocking
      '@typescript-eslint/no-empty-function': 'off',
      // Mock async functions may not need await
      '@typescript-eslint/require-await': 'off',
      // Deprecated APIs may be used in mocks
      '@typescript-eslint/no-deprecated': 'off',
      // Method binding warnings in mocks
      '@typescript-eslint/unbound-method': 'off',
      // Void expressions in callbacks are fine
      '@typescript-eslint/no-confusing-void-expression': 'off',
      // Tests may not await all promises (fire-and-forget patterns)
      '@typescript-eslint/no-floating-promises': 'off',
      // Tests may use unused catch params
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // Optional chain style preference
      '@typescript-eslint/prefer-optional-chain': 'off',
    },
  }
);
