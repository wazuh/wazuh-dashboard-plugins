/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { visitReportingLandingPage } from "../support/utils";

describe('Adding sample data', () => {
  it('Adds sample data', () => {
    cy.visit(`${Cypress.env('opensearchDashboards')}/app/home#/tutorial_directory/sampleData`);
    cy.get('div[data-test-subj="sampleDataSetCardflights"]').contains(/(Add|View) data/).click();
    cy.wait(3000);
    cy.visit(`${Cypress.env('opensearchDashboards')}/app/home#/tutorial_directory/sampleData`);
    cy.get('div[data-test-subj="sampleDataSetCardecommerce"]').contains(/(Add|View) data/).click();
    cy.wait(3000);
    cy.visit(`${Cypress.env('opensearchDashboards')}/app/home#/tutorial_directory/sampleData`);
    cy.get('div[data-test-subj="sampleDataSetCardlogs"]').contains(/(Add|View) data/).click();
    cy.wait(3000);
  });
});

describe('Cypress', () => {
  it('Visits Reporting homepage', () => {
    visitReportingLandingPage();
  });

  it('Visit Create page', () => {
    visitCreateReportDefinitionPage();
  });

  it('Create a new on-demand dashboard report definition', () => {
    visitCreateReportDefinitionPage();
    setReportDefinitionName('Cypress dashboard on-demand report');
    setReportDefinitionDescription('Description for cypress test');
    selectReportSourceComboBox();

    // // select drop-down option in report source list
    cy.contains('[Logs] Web Traffic').click();

    cy.wait(500);
    clickCreateReportDefinitionButton();
    cy.wait(3000);
    verifyOnReportingLandingPage();
  });

  it('Create a new on-demand visualization report definition', ()=> {
    visitCreateReportDefinitionPage();
    setReportDefinitionName('Cypress vis on-demand report');
    setReportDefinitionDescription('Description for cypress test');
    selectReportSource('#visualizationReportSource');
    selectReportSourceComboBox();
    cy.wait(500);
    clickCreateReportDefinitionButton();
    cy.wait(3000);
    verifyOnReportingLandingPage();
  });

  it('Create a new on-demand saved search report definition', () => {
    visitCreateReportDefinitionPage();
    setReportDefinitionName('Cypress saved search on-demand report');
    setReportDefinitionDescription('Description for cypress test');
    selectReportSource('#savedSearchReportSource');
    selectReportSourceComboBox();
    cy.wait(500);
    clickCreateReportDefinitionButton();
    cy.wait(3000);
    verifyOnReportingLandingPage();
  });

  it('Create a new dashboard daily recurring report definition', () => {
    visitCreateReportDefinitionPage();
    setReportDefinitionName('Cypress dashboard daily scheduled report');
    setReportDefinitionDescription('Description for cypress test');
    selectReportSourceComboBox();

    // select drop-down option in report source list
    cy.contains('[Logs] Web Traffic').click();

    cy.wait(500);
    setReportTriggerToSchedule();
    clickCreateReportDefinitionButton();
    cy.wait(3000);
    verifyOnReportingLandingPage();
  });

  it('Create a new visualization daily recurring report definition', () => {
    visitCreateReportDefinitionPage();
    setReportDefinitionName('Cypress vis daily scheduled report');
    setReportDefinitionDescription('Description for cypress test');
    selectReportSource('#visualizationReportSource');
    selectReportSourceComboBox();
    cy.wait(500);
    setReportTriggerToSchedule();
    clickCreateReportDefinitionButton();
    cy.wait(3000);
    verifyOnReportingLandingPage();
  });

  it('Create a new saved search daily recurring report definition', () => {
    visitCreateReportDefinitionPage();
    setReportDefinitionName('Cypress search daily scheduled report');
    setReportDefinitionDescription('Description for cypress test');
    selectReportSource('#savedSearchReportSource');
    selectReportSourceComboBox();
    setReportTriggerToSchedule();
    clickCreateReportDefinitionButton();
    cy.wait(3000);
    verifyOnReportingLandingPage();
  });

  it('Create a new dashboard interval recurring report definition', () => {
    visitCreateReportDefinitionPage();
    setReportDefinitionName('Cypress dashboard recurring report');
    setReportDefinitionDescription('Description for cypress test');
    selectReportSourceComboBox();

    // select drop-down option in report source list
    cy.contains('[Logs] Web Traffic').click();

    cy.wait(500);
    setReportTriggerToSchedule();
    selectIntervalScheduleFrequency();
    inputTextIntoField('#recurringByIntervalNumber', '5');
    clickCreateReportDefinitionButton();
    cy.wait(3000);
    verifyOnReportingLandingPage();
  });

  it('Create a new visualization interval recurring report definition', () => {
    visitCreateReportDefinitionPage();
    setReportDefinitionName('Cypress vis interval recurring report');
    selectReportSource('#visualizationReportSource');
    selectReportSourceComboBox();
    setReportTriggerToSchedule();
    selectIntervalScheduleFrequency();
    inputTextIntoField('#recurringByIntervalNumber', '5');
    clickCreateReportDefinitionButton();
    cy.wait(3000);
    verifyOnReportingLandingPage();
  });

  it('Create a new saved search interval recurring report definition', () => {
    visitCreateReportDefinitionPage();
    setReportDefinitionName('Cypress saved search interval recurring report');
    selectReportSource('#savedSearchReportSource');
    selectReportSourceComboBox();
    setReportTriggerToSchedule();
    selectIntervalScheduleFrequency();
    inputTextIntoField('#recurringByIntervalNumber', '5');
    clickCreateReportDefinitionButton();
    cy.wait(3000);
    verifyOnReportingLandingPage();
  });

  it('Create a dashboard cron-based report definition', () => {
    visitCreateReportDefinitionPage();
    setReportDefinitionName('Cypress dashboard cron definition');
    selectReportSourceComboBox();

    // select drop-down option in report source list
    cy.contains('[Logs] Web Traffic').click();
    cy.wait(500);
    setReportTriggerToSchedule();
    selectCronBasedRequestTime();
    inputTextIntoField('#cronExpressionFieldText', '0 12 * * *');
    clickCreateReportDefinitionButton();
    cy.wait(3000);
    verifyOnReportingLandingPage();
  });

  it('Create a visualization cron-based report definition', () => {
    visitCreateReportDefinitionPage();
    setReportDefinitionName('Cypress vis cron definition');
    selectReportSource('#visualizationReportSource');
    selectReportSourceComboBox();
    setReportTriggerToSchedule();
    selectCronBasedRequestTime();
    inputTextIntoField('#cronExpressionFieldText', '0 12 * * *');
    cy.wait(500);
    clickCreateReportDefinitionButton();
    cy.wait(3000);
    verifyOnReportingLandingPage();
  });

  it('Create a saved search cron-based report definition', () => {
    visitCreateReportDefinitionPage();
    setReportDefinitionName('Cypress search cron definition');
    selectReportSource('#savedSearchReportSource');
    selectReportSourceComboBox();
    setReportTriggerToSchedule();
    selectCronBasedRequestTime();
    inputTextIntoField('#cronExpressionFieldText', '0 12 * * *');
    cy.wait(500);
    clickCreateReportDefinitionButton();
    cy.wait(3000);
    verifyOnReportingLandingPage();
  });
});

function visitCreateReportDefinitionPage() {
  cy.visit(`${Cypress.env('opensearchDashboards')}/app/reports-dashboards#/`);
  cy.location('pathname', { timeout: 60000 }).should(
    'include',
    '/reports-dashboards'
  );
  cy.wait(3000);
  cy.get('#createReportHomepageButton').click();
}

function setReportDefinitionName(name: string) {
  cy.get('#reportSettingsName').type(name);
}

function setReportDefinitionDescription(description: string) {
  cy.get('#reportSettingsDescription').type(description);
}

function selectReportSource(name: string) {
  cy.get(name).click({force: true});
}

function selectReportSourceComboBox() {
  cy.get('[data-test-subj="comboBoxInput"]').eq(0).click({ force: true });
}

function setReportTriggerToSchedule() {
  cy.get('#Schedule').check({ force: true });
}

function selectIntervalScheduleFrequency() {
  cy.get('#recurringFrequencySelect').select('By interval');
}

function selectCronBasedRequestTime() {
  cy.contains('Cron based').click({ force: true });
}

function inputTextIntoField(selector: string, text: string) {
  cy.get(selector).type(text);
}

function clickCreateReportDefinitionButton() {
  cy.get('#createNewReportDefinition').click({ force: true });
}

function verifyOnReportingLandingPage() {
  cy.get('#reportDefinitionDetailsLink').should('exist');
}