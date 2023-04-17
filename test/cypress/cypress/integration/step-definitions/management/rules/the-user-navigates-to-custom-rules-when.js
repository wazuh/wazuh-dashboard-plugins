import { When } from 'cypress-cucumber-preprocessor/steps';
import "cypress-real-events/support";
import { clickElement, elementIsVisible, getSelector } from '../../../utils/driver';
import { RULES_PAGE as pageName} from '../../../utils/pages-constants';
const customRulesButtonSelector = getSelector('customRulesButtonSelector', pageName);

When('The user clicks the custom rules button', () => {
  elementIsVisible(customRulesButtonSelector);
  cy.get(customRulesButtonSelector).realHover().realClick();
});
