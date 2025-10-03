import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import nodePlugin from 'eslint-plugin-n';
import unicorn from 'eslint-plugin-unicorn';
import yml from 'eslint-plugin-yml';

export default [
  // Global ignores for files/folders that should not be linted
  {
    ignores: ['dist/**', 'coverage/**', '**/*.min.js', '**/node_modules/**'],
  },

  // Base JavaScript recommended rules
  js.configs.recommended,

  // Node.js rules
  ...nodePlugin.configs['flat/mixed-esm-and-cjs'],

  // Unicorn rules (modern best practices)
  unicorn.configs.recommended,

  // YAML linting
  ...yml.configs['flat/recommended'],

  // Place Prettier last to disable conflicting stylistic rules
  eslintConfigPrettier,

  // Project-specific tweaks
  {
    rules: {
      // Allow console for CLI tools in this repo
      'no-console': 'off',
      // Enforce .yaml file extension for consistency
      'yml/file-extension': [
        'error',
        {
          extension: 'yaml',
          caseSensitive: true,
        },
      ],
      // Prefer double quotes in YAML wherever quoting is used, but allow the other to avoid escapes
      'yml/quotes': [
        'error',
        {
          prefer: 'double',
          avoidEscape: true,
        },
      ],
      // Relax some Unicorn rules that are too opinionated for this codebase
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/no-null': 'off',
    },
  },

  // CLI/CommonJS scripts under tools/** and lib/**
  {
    files: ['tools/**/*.js', 'lib/**/*.js', 'hooks/**/*.js', 'bin/**/*.js'],
    rules: {
      // Allow CommonJS patterns for Node CLI scripts and MCP integration
      'unicorn/prefer-module': 'off',
      'unicorn/import-style': 'off',
      'unicorn/no-process-exit': 'off',
      'n/no-process-exit': 'off',
      'unicorn/no-await-expression-member': 'off',
      'unicorn/prefer-top-level-await': 'off',
      // Avoid failing CI on incidental unused vars in internal scripts
      'no-unused-vars': 'off',
      // Reduce style-only churn in internal tools
      'unicorn/prefer-ternary': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'n/no-extraneous-require': 'off',
      'n/no-extraneous-import': 'off',
      'n/no-unpublished-require': 'off',
      'n/no-unpublished-import': 'off',
      // Some scripts intentionally use globals provided at runtime
      'no-undef': 'off',
      // Additional relaxed rules for legacy/internal scripts
      'no-useless-catch': 'off',
      'unicorn/prefer-number-properties': 'off',
      'no-unreachable': 'off',
    },
  },

  // Jest test files
  {
    files: ['test/**/*.js', 'test/**/*.ts'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      // Allow CommonJS in tests
      'unicorn/prefer-module': 'off',
      // Tests may use abbreviated names
      'unicorn/prevent-abbreviations': 'off',
      // Allow @jest/globals dev dependency in tests
      'n/no-extraneous-require': 'off',
      // Allow unused vars in placeholder tests
      'no-unused-vars': 'off',
      // Allow useless spread in test fixtures
      'unicorn/no-useless-fallback-in-spread': 'off',
    },
  },

  // ESLint config file should not be checked for publish-related Node rules
  {
    files: ['eslint.config.mjs'],
    rules: {
      'n/no-unpublished-import': 'off',
    },
  },

  // YAML workflow templates allow empty mapping values intentionally
  {
    files: ['bmad-core/workflows/**/*.yaml'],
    rules: {
      'yml/no-empty-mapping-value': 'off',
    },
  },

  // GitHub workflow files in this repo may use empty mapping values
  {
    files: ['.github/workflows/**/*.yaml'],
    rules: {
      'yml/no-empty-mapping-value': 'off',
    },
  },

  // Other GitHub YAML files may intentionally use empty values and reserved filenames
  {
    files: ['.github/**/*.yaml'],
    rules: {
      'yml/no-empty-mapping-value': 'off',
      'unicorn/filename-case': 'off',
    },
  },
];
