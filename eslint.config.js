import eslintPluginTs from '@typescript-eslint/eslint-plugin';
import parserTs from '@typescript-eslint/parser';

const restrictedEnvRule = {
  'no-restricted-properties': [
    'error',
    {
      object: 'process',
      property: 'env',
      message: 'Use @packages/config instead of accessing process.env directly.'
    }
  ]
};

export default [
  {
    ignores: ['**/dist/**', 'node_modules/**']
  },
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: parserTs,
      sourceType: 'module',
      ecmaVersion: 2022
    },
    plugins: {
      '@typescript-eslint': eslintPluginTs
    },
    rules: restrictedEnvRule
  },
  {
    files: ['packages/config/src/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-properties': 'off'
    }
  }
];
