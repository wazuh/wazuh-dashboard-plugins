/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

describe('Cypress', () => {
  it('Download from reporting homepage', () => {
    cy.visit(`${Cypress.env('opensearchDashboards')}/app/reports-dashboards#/`);
    cy.location('pathname', { timeout: 60000 }).should(
      'include',
      '/reports-dashboards'
    );

    cy.wait(12500);
    cy.get('[id="landingPageOnDemandDownload"]')
      .contains('CSV')
      .click({ force: true });
    cy.get('.euiToastHeader__title')
      .contains('Successfully downloaded report')
      .should('exist');
  });

  it('Download pdf from in-context menu', () => {
    cy.visit(`${Cypress.env('opensearchDashboards')}/app/dashboards#`);
    cy.wait(5000);

    // click first entry in dashboards page
    cy.get('tr.euiTableRow:nth-child(1) > td:nth-child(2) > div:nth-child(2) > a:nth-child(1)').click({ force: true });

    // click Reporting in-context menu
    cy.get('#downloadReport > span:nth-child(1) > span:nth-child(1)').click({ force: true });

    // download PDF
    cy.get('#generatePDF > span:nth-child(1) > span:nth-child(2)').click({ force: true });

    cy.get('#reportGenerationProgressModal');
  });

  it('Download png from in-context menu', () => {
    cy.visit(`${Cypress.env('opensearchDashboards')}/app/dashboards#`);
    cy.wait(5000);

    // click first entry in dashboards page
    cy.get('tr.euiTableRow:nth-child(1) > td:nth-child(2) > div:nth-child(2) > a:nth-child(1)').click({ force: true });

    // click Reporting in-context menu
    cy.get('#downloadReport > span:nth-child(1) > span:nth-child(1)').click({ force: true });

    cy.get('#generatePNG').click({ force: true });

    cy.get('#reportGenerationProgressModal');
  });

  it('Download csv from saved search in-context menu', () => {
    cy.visit(`${Cypress.env('opensearchDashboards')}/app/discover#`);
    cy.wait(5000);

    // open saved search list
    cy.get('[data-test-subj="discoverOpenButton"]').click({ force: true });
    cy.wait(5000);

    // click first entry
    cy.get('li.euiListGroupItem:nth-child(1) > button:nth-child(1)').click({ force: true });

    // open reporting menu
    cy.get('#downloadReport').click({ force: true });

    cy.get('#generateCSV').click({ force: true });
  });

  it('Download from Report definition details page', () => {
    // create an on-demand report definition

    cy.visit(`${Cypress.env('opensearchDashboards')}/app/reports-dashboards#/`);
    cy.location('pathname', { timeout: 60000 }).should(
      'include',
      '/reports-dashboards'
    );
    cy.wait(10000);

    cy.get('tr.euiTableRow-isSelectable:nth-child(1) > td:nth-child(1) > div:nth-child(2) > button:nth-child(1)').first().click();

    cy.url().should('include', 'report_definition_details');

    cy.wait(5000);

    cy.get('#generateReportFromDetailsFileFormat').should('exist');

    cy.get('#generateReportFromDetailsFileFormat').click({ force: true });

    cy.get('.euiToastHeader__title')
      .contains('Successfully generated report')
      .should('exist');
  });
});
