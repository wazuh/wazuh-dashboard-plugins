import { defineConfig, globalIgnores } from 'eslint/config';
import cypress from 'eslint-plugin-cypress';

export default defineConfig([
  globalIgnores(['**/node_modules/']),
  cypress.configs.recommended,
  {
    plugins: {
      cypress,
    },

    rules: {
      'cypress/no-assigning-return-values': 'error',
      'cypress/no-unnecessary-waiting': 'error',
      'cypress/assertion-before-screenshot': 'warn',
      'cypress/no-force': 'warn',
      'cypress/no-async-tests': 'error',
    },
  },
]);
