// Processed and loaded automatically before every spec (Cypress v10+ convention; the analogous
// file in plugins/main/test/cypress is cypress/support/index.js, the pre-v10 name/location).
import './commands';

// The dashboard app throws on some unrelated async warnings during hot-reload/dev builds; main's
// own support/index.js takes the same stance (`Cypress.on('uncaught:exception', () => false)`) so
// an unrelated in-page error doesn't fail a geometry assertion that never touched it.
Cypress.on('uncaught:exception', () => false);
