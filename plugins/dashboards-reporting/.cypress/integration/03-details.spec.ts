/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { visitReportingLandingPage } from "../support/utils";

describe('Cypress', () => {
  it('Visit report definition details page', () => {
    visitReportingLandingPage();
    cy.wait(5000);
    visitReportDefinitionDetailsPage();
    verifyReportDefinitionDetailsURL();
    verifyDeleteDefinitionButtonExists();
    verifyGenerateReportFromFileFormatExists();
  });

  it('Go to edit report definition from report definition details', () => {
    visitReportingLandingPage();
    cy.wait(5000);
    visitReportDefinitionDetailsPage();
    verifyEditDefinitionButtonExists();
    clickEditReportDefinitionButton();
    verifyEditReportDefinitionURL();
  });

  it('Verify report source URL on report definition details', () => {
    visitReportingLandingPage();
    cy.wait(5000);
    visitReportDefinitionDetailsPage();
    verifyReportDefinitionSourceURLExists();
    
  });

  it('Delete report definition from details page', () => {
    visitReportingLandingPage();
    cy.wait(5000);
    visitReportDefinitionDetailsPage();
    verifyDeleteDefinitionButtonExists();
    deleteReportDefinition();
    verifyDeleteSuccess();
  });

  it('Visit report details page', () => {
    visitReportingLandingPage();
    cy.wait(5000);
    visitReportDetailsPage();
    verifyReportDetailsURL();
  });

  it('Verify report source URL on report details', () => {
    visitReportingLandingPage();
    cy.wait(5000);
    visitReportDetailsPage();
    verifyReportDetailsSourceURLExists();
  });
});

function visitReportDefinitionDetailsPage() {
  cy.get('#reportDefinitionDetailsLink').first().click();
}

function verifyReportDefinitionDetailsURL() {
  cy.url().should('include', 'report_definition_details');
}

function verifyDeleteDefinitionButtonExists() {
  cy.get('#deleteReportDefinitionButton').should('exist');
}

function verifyEditDefinitionButtonExists() {
  cy.get('#editReportDefinitionButton').should('exist');
}

function clickEditReportDefinitionButton() {
  cy.get('#editReportDefinitionButton').click({ force: true });
}

function verifyEditReportDefinitionURL() {
  cy.url().should('include', 'edit');
}

function verifyReportDefinitionSourceURLExists() {
  cy.get('#reportDefinitionSourceURL').should('exist');
}

function verifyReportDetailsSourceURLExists() {
  cy.get('#reportDetailsSourceURL').should('exist');
}

function verifyGenerateReportFromFileFormatExists() {
  cy.get('#generateReportFromDetailsFileFormat').should('exist');
}

function deleteReportDefinition() {
  cy.get('#deleteReportDefinitionButton').click();
  cy.wait(500);
  cy.get('button.euiButton:nth-child(2)').click({ force: true });
}

function verifyDeleteSuccess() {
  cy.get('#deleteReportDefinitionSuccessToast').should('exist');
}

function visitReportDetailsPage() {
  cy.get('#reportDetailsLink').first().click();
}

function verifyReportDetailsURL() {
  cy.url().should('include', 'report_details');
}
