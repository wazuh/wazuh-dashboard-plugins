// Custom commands for the wazuh-ai-assistant Cypress suite.
//
// Login selectors mirror plugins/main/test/cypress/cypress/integration/pageobjects/login/wzd-login.page.js
// (`input[data-test-subj="user-name"]`, `input[data-test-subj="password"]`,
// `button[data-test-subj="submit"]`) — this plugin runs inside the same OSD/Wazuh-dashboard host
// shell as `main`, so the security login form is the identical component; there is no
// AI-assistant-specific login page to build a new selector set for.

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'admin';

Cypress.Commands.add('wzLogin', () => {
  const username = Cypress.env('username') || DEFAULT_USERNAME;
  const password = Cypress.env('password') || DEFAULT_PASSWORD;

  cy.visit('/');
  cy.get('body').then($body => {
    // Already-authenticated session (cookie reused across specs/runs): skip the login form.
    if ($body.find('input[data-test-subj="user-name"]').length === 0) {
      return;
    }
    cy.get('input[data-test-subj="user-name"]', { timeout: 20000 }).type(username);
    cy.get('input[data-test-subj="password"]').type(password, { log: false });
    cy.get('button[data-test-subj="submit"]').click();
  });
});

// Opens a brand-new AI Assistant conversation so geometry assertions start from a clean
// transcript with no leftover turns from a previous spec/run.
Cypress.Commands.add('wzOpenFreshAssistantConversation', () => {
  cy.visit('/app/wazuhAiAssistant');
  cy.contains('button', 'New conversation', { timeout: 20000 }).click();
});

// Types a question into the composer and sends it, then waits for the assistant's row to finish
// streaming (`.wzMessageRow` count increases by 2: the user turn + the assistant turn).
//
// The "before" count is read via `cy.document()` + a plain synchronous `querySelectorAll`, NOT
// `cy.get('.wzMessageRow')`: on the very first message of a fresh conversation there are zero
// rows yet, and `cy.get()` retries until timeout for a selector to match at least one element —
// it would hang for the full `defaultCommandTimeout` waiting for a row that only appears once
// this command has gone on to type+send. `cy.document()` just yields the live document, with no
// such existence requirement, so a legitimate zero-rows baseline resolves immediately.
Cypress.Commands.add('wzSendMessage', text => {
  cy.document().then(doc => {
    const before = doc.querySelectorAll('.wzMessageRow').length;
    cy.get('.wzComposerTextarea').click().type(text);
    cy.get('.wzComposerSendButton').click();
    // `defaultCommandTimeout` (40s, cypress.config.js) covers a live LLM turn's latency; the
    // assertion just waits for the new pair of rows to exist, not for any particular content.
    cy.get('.wzMessageRow', { timeout: 40000 }).should('have.length', before + 2);
    // Let the last row's streamed content (and its results-card measurement effect, if any)
    // settle before any geometry read — a mid-stream read would measure a growing box.
    cy.wait(1500);
  });
});

