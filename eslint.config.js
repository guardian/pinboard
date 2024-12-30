import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import nodePlugin from 'eslint-plugin-n';
import flowtypePlugin from 'eslint-plugin-flowtype';

export default tseslint.config(

    // Load in recommended eslint configs
    eslint.configs.recommended,

    // Load in recommended tslint configs
    tseslint.configs.recommended,

    // Plugins and rules overrides
    {
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            'react': reactPlugin,
            'node': nodePlugin,
            'flowtype': flowtypePlugin,
        },
        rules: {

            // Change 'off' to 'warn' to work out where cleanup is required
            // Change 'off' to 'error' for show-stopper issues

            '@/no-undef': 'off',

            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-this-alias': 'off',
            '@typescript-eslint/no-unused-expressions': 'off',
            '@typescript-eslint/no-unused-vars': 'off',

            'no-cond-assign': 'off',
            'no-constant-binary-expression': 'off',
            'no-constant-condition': 'off',
            'no-empty': 'off',
            'no-fallthrough': 'off',
            'no-func-assign': 'off',
            'no-prototype-builtins': 'off',
            'no-redeclare': 'off',
            'no-undef': 'off',
            'no-unsafe-finally': 'off',
            'no-unsafe-optional-chaining': 'off',
            'no-useless-escape': 'off',

            'node/no-unsupported-features/node-builtins': 'off',

            'react/display-name': 'off',
        }
    }
);
