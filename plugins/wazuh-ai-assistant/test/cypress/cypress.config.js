const { defineConfig } = require('cypress');

module.exports = defineConfig({
  // Overridable at the CLI/CI level with the standard `CYPRESS_baseUrl` env var (Cypress maps
  // any `CYPRESS_*` env var onto the matching config key automatically) — no extra wiring needed.
  // Defaults to the live dev VM this spec suite was authored and hand-verified against
  // (docs/dev/run-sources.md's `docker/osd-dev` stack normally serves on :5601 instead; point
  // baseUrl there with `CYPRESS_baseUrl=https://localhost:5601` when running against that stack).
  e2e: {
    baseUrl: 'https://localhost:8444',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    // The dashboard's dev/VM certificate is self-signed; Cypress does not show the browser's own
    // interstitial warning for that (it accepts invalid certs on navigation by default), so no
    // special flag is needed here beyond documenting why `baseUrl` is `https://`.
    defaultCommandTimeout: 40000, // LLM-backed answers can take several seconds to a turn to render
    requestTimeout: 40000,
    responseTimeout: 40000,
    viewportWidth: 1440,
    viewportHeight: 900,
    video: false,
    retries: { runMode: 1, openMode: 0 },
  },
});
