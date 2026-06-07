import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-config-prettier'

// Flat config (ESLint 9). React 19 + Vite, dependency-light.
// `eslint-config-prettier` is last so it disables stylistic rules that would
// fight Prettier — ESLint catches bugs, Prettier owns formatting.
export default [
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      // Browser globals for the app; Node globals for vite.config.js / eslint.config.js.
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // `^[A-Z_]` covers JSX component/React imports (espree doesn't track JSX usage
      // without eslint-plugin-react); `_` prefix marks intentionally-unused args.
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // Empty catch blocks are an intentional pattern here: localStorage / storage
      // access is wrapped in try/catch and safely ignored (ENGINEERING.md INV-6).
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    // These files intentionally co-locate a Provider (component) with its hook /
    // Context / small helpers — splitting them would only marginally help Fast
    // Refresh. The rule stays on everywhere else.
    files: ['src/*-context.jsx', 'src/lang.jsx', 'src/hooks.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  prettier,
]
