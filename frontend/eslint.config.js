import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Allow `any` type — commonly needed for error handlers and API responses
      '@typescript-eslint/no-explicit-any': 'off',
      // Allow unused vars with underscore prefix pattern
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Allow setState in effects — needed for data-sync patterns used throughout
      'react-hooks/set-state-in-effect': 'off',
      // Allow static component declarations inside render — warn only
      'react-hooks/static-components': 'off',
      // Allow purity issues in UI lib files (Math.random in sidebar, etc.)
      'react-hooks/purity': 'off',
      // Fast refresh — off for context/utility files that export both components and functions
      'react-refresh/only-export-components': 'off',
    },
  },
])
