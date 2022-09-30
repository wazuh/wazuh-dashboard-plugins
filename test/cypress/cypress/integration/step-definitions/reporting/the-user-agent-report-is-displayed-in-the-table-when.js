import { Then } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, elementTextIncludes, getSelector} from '../../utils/driver';
import { REPORTING_PAGE as pageName} from '../../utils/pages-constants';
const lastCreatedReport = getSelector('lastCreatedReport', pageName);

Then('The agent report is displayed in the table', () => {
  elementIsVisible(lastCreatedReport);
  debugger;
  cy.wait(2000);
  cy.get('@agentId').then(($agentId) => {
    expect($agentId).to.be.eq($agentId);
    const agentID = $agentId;
    elementTextIncludes(report, "agents-"+agentID);
  });
});

