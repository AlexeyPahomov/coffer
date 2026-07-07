import path from 'node:path'
import { fileURLToPath } from 'node:url'

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url))

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
      parserOptions: {
        tsconfigRootDir,
      },
      globals: globals.browser,
    },
    rules: {
      // eslint-plugin-react-hooks@7 включил react-compiler-правила как ошибки.
      // Они валят рабочие паттерны (сброс формы в effect по смене id, latest-ref) —
      // держим выключенными, код не рефакторим.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      // '_'-префикс — принятая в проекте пометка намеренно неиспользуемого.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // shadcn-компоненты co-export варианты/хуки рядом с компонентом —
    // HMR-правило тут неприменимо, разбивать файлы не нужно.
    files: ['src/shared/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
