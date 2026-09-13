import js from '@eslint/js';
import globals from 'globals';

export default [
    {
        ignores: ['node_modules/**']
    },
    js.configs.recommended,
    {
        // Browser code: classic scripts sharing the window.DD namespace.
        files: ['assets/js/**/*.js', 'studio/js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                DD: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }],
            'no-var': 'error',
            'prefer-const': 'error',
            eqeqeq: ['error', 'always'],
            strict: ['error', 'function']
        }
    },
    {
        files: ['scripts/**/*.mjs', 'eslint.config.mjs'],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            globals: globals.node
        }
    },
    {
        // Code evaluated inside the page by Puppeteer.
        files: ['scripts/smoke-test.mjs', 'scripts/build-social-card.mjs'],
        languageOptions: {
            globals: { ...globals.browser, DD: 'readonly' }
        }
    }
];
