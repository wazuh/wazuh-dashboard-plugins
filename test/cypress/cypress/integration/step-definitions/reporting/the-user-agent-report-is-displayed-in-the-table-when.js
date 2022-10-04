import { Then } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, elementTextIncludes, getSelector} from '../../utils/driver';
import {REPORT_NAME as reportName} from '../../step-definitions/reporting/modules-report-data';
import { REPORTING_PAGE as pageName} from '../../utils/pages-constants';
const lastCreatedReport = getSelector('lastCreatedReport', pageName);

Then('The agent report is displayed in the table {}', (moduleName) => {
  elementIsVisible(lastCreatedReport);
  debugger;
  cy.wait(2000);
  cy.get('@agentId').then(($agentId) => {
    expect($agentId).to.be.eq($agentId);
    const agentID = $agentId;
    elementTextIncludes(lastCreatedReport, 'agents-' + agentID + '-' + reportName[moduleName]);
  });
});

