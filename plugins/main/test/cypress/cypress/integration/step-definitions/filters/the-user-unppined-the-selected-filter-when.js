import { When } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, clickElement, getSelector} from '../../utils/driver';
import { FILTERS_PAGE as pageName} from '../../utils/pages-constants';
const pinnedFilter = getSelector('pinnedFilter', pageName);
const unPinFilterAction = getSelector('unPinFilterAction', pageName);


When('The user unpins the selected filter', () => {
  elementIsVisible(pinnedFilter);
  cy.wait(1000);
  clickElement(pinnedFilter);
  cy.wait(1000);
  elementIsVisible(unPinFilterAction);
  clickElement(unPinFilterAction);
})
