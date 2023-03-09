const Module = require('module');
const path = require('path');

const sharedConfigAbsolute = path.join(__dirname,
    'build_tools', 'profiles', 'common', 'shared.config.js');

// This temporary hack prevents eslint from loading eslint-scope. After upgrading
// to Webpack 4 (which introduces a dependency on eslint-scope) its presence is
// causing babel-eslint to report false positives. babel-eslint only uses
// eslint-scope if present, so preventing it from being loaded restores the previous
// behavior. This hack can be removed once SPL-163059 is done.
const originalRequire = Module.prototype.require;
Module.prototype.require = function(name, ...args) {
    if (name === 'eslint-scope' && this.id.includes('eslint/lib/api')) {
        throw new Error();
    }
    return originalRequire.call(this, name, ...args);
};

module.exports = {
    extends: 'airbnb',
    parser: 'babel-eslint',
    plugins: [
        'react',
    ],
    rules: {
        // Set the required indent to 4 spaces
        indent: ['error', 4, { SwitchCase: 1 }],
        'react/jsx-indent': ['error', 4],
        'react/jsx-indent-props': ['error', 4],
        // Do not require a newline at the end of every file
        'eol-last': 'off',
        // A more generous max line length
        'max-len': ['error', 120],

        // Allow `console.log` statements, but not when they reference the global console.
        'no-console': 'off',
        'no-restricted-globals': ['error', 'console'],

        // Prevent errors for missing .es extensions in import statements (match shared.config)
        'import/extensions': ['error', 'always', { js: 'never', jsx: 'never', es: 'never' }],
        // No way to excluded packages (such as 'underscore' from our own contrib directory)
        'import/no-extraneous-dependencies': 'off',
    },
    env: {
        browser: true,
    },
    settings: {
        'import/resolver': {
            webpack: { config: sharedConfigAbsolute },
        },
    },
    root: true,
};
