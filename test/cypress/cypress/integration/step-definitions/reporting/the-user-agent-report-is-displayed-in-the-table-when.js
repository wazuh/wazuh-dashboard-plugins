import { Then } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, elementTextIncludes, getSelector} from '../../utils/driver';
import { REPORTING_PAGE as pageName} from '../../utils/pages-constants';
const lastCreatedReport = getSelector('lastCreatedReport', pageName);
//const agentID = getSelector('lastCreatedReport', pageName);

Then('The agent report is displayed in the table', () => {
  elementIsVisible(lastCreatedReport);
  cy.wait(500);
  //elementTextIncludes(lastCreatedReport, "agent-"+agentID);
});
