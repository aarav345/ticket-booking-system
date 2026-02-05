import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
    {
        ignores: [
            'node_modules/**',
            'dist/**',
        ],
    },

    js.configs.recommended,

    ...tseslint.configs.recommendedTypeChecked.map(config => ({
        ...config,
        files: ['src/**/*.ts'],
    })),

    {
        files: ['src/**/*.ts'],
        languageOptions: {
        parserOptions: {
            project: './tsconfig.json',
            tsconfigRootDir: import.meta.dirname,
            ecmaVersion: 'latest',
            sourceType: 'module',
        },
        },
        plugins: {
            'unused-imports': unusedImports,
            prettier: prettier
        },
        rules: {
            'unused-imports/no-unused-imports': 'error',
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/consistent-type-imports': 'error',
            '@typescript-eslint/prefer-nullish-coalescing': 'warn',
            '@typescript-eslint/prefer-optional-chain': 'warn',
            '@typescript-eslint/no-misused-promises': [
                'error',
                { checksVoidReturn: false },
            ],
            'prettier/prettier': 'error',
        },
    },

    prettierConfig,
];