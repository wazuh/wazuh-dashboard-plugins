import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector} from '../../utils/driver';

import { AGENTS_PAGE as pageName} from '../../utils/pages-constants';
const exploreAgentButton = getSelector('exploreAgentButton', pageName);
const firstAgentDisplayed = getSelector('firstAgentDisplayed', pageName);
const agentID = getSelector('agentID', pageName);

When('The user choose an agent to apply filter', () => {
  elementIsVisible(exploreAgentButton);
  clickElement(exploreAgentButton);
  cy.wait(500);
  elementIsVisible(firstAgentDisplayed);
  cy.get(agentID).then(($agentId) =>{
    const agentId = $agentId.text();
    cy.wrap(agentId).as('agentId');
  })
  clickElement(firstAgentDisplayed);
  });
