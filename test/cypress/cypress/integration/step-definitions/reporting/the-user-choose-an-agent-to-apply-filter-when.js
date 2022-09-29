import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector} from '../../utils/driver';

import { AGENTS_PAGE as pageName} from '../../utils/pages-constants';
const exploreAgentButton = getSelector('exploreAgentButton', pageName);
const firstAgentDisplayed = getSelector('firstAgentDisplayed', pageName);

When('The user choose an agent to apply filter', () => {
  elementIsVisible(exploreAgentButton);
  clickElement(exploreAgentButton);
  cy.wait(500);
  elementIsVisible(firstAgentDisplayed);
  clickElement(firstAgentDisplayed);
  });
