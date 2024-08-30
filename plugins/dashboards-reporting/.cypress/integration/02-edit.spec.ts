/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

describe('Cypress', () => {
  it('Visit edit page, update name and description', () => {
    cy.visit(`${Cypress.env('opensearchDashboards')}/app/reports-dashboards#/`);
    cy.location('pathname', { timeout: 60000 }).should(
      'include',
      '/reports-dashboards'
    );

    cy.wait(12500);

    cy.get('#reportDefinitionDetailsLink').first().click();

    cy.get('#editReportDefinitionButton').should('exist');

    cy.get('#editReportDefinitionButton').click();

    cy.url().should('include', 'edit');

    cy.wait(1000);

    // update the report name
    cy.get('#reportSettingsName').type(' update name');

    // update report description
    cy.get('#reportSettingsDescription').type(' update description');

    cy.get('#editReportDefinitionButton').click({ force: true });

    cy.wait(12500);
    
    // check that re-direct to home page
    cy.get('#reportDefinitionDetailsLink').should('exist');
  });

  it('Visit edit page, change report trigger', () => {
    cy.visit(`${Cypress.env('opensearchDashboards')}/app/reports-dashboards#/`);
    cy.location('pathname', { timeout: 60000 }).should(
      'include',
      '/reports-dashboards'
    );

    cy.wait(12500);

    cy.get('#reportDefinitionDetailsLink').first().click();

    cy.get('#editReportDefinitionButton').should('exist');

    cy.get('#editReportDefinitionButton').click();

    cy.url().should('include', 'edit');

    cy.wait(1000);
    cy.get('#reportDefinitionTriggerTypes > div:nth-child(2)').click({ force: true });

    cy.get('#Schedule').check({ force: true });
    cy.get('#editReportDefinitionButton').click({ force: true });

    cy.wait(12500);
    
    // check that re-direct to home page
    cy.get('#reportDefinitionDetailsLink').should('exist');
  });

  it('Visit edit page, change report trigger back', () => {
    cy.visit(`${Cypress.env('opensearchDashboards')}/app/reports-dashboards#/`);
    cy.location('pathname', { timeout: 60000 }).should(
      'include',
      '/reports-dashboards'
    );

    cy.wait(12500);

    cy.get('#reportDefinitionDetailsLink').first().click();

    cy.get('#editReportDefinitionButton').should('exist');

    cy.get('#editReportDefinitionButton').click();

    cy.url().should('include', 'edit');

    cy.wait(1000);

    cy.get('#reportDefinitionTriggerTypes > div:nth-child(1)').click({ force: true });

    cy.get('#editReportDefinitionButton').click({ force: true });

    cy.wait(12500);
    
    // check that re-direct to home page
    cy.get('#reportDefinitionDetailsLink').should('exist');
  });
});
