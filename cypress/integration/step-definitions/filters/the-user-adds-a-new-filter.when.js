import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, fillField, elementIsVisible, getAvailableElement, getSelector, forceClickElement, forceEnter} from '../../utils/driver';

import { FILTERS_PAGE as pageName} from '../../utils/pages-constants';
const addFilterButton = getSelector('addFilterButton', pageName);
const filterSuggestionList = getSelector('filterSuggestionList', pageName);
const filterOperatorList = getSelector('filterOperatorList', pageName);
const filterParams = getSelector('filterParams', pageName);
const saveFilterButton = getSelector('saveFilterButton', pageName);
const selectedOperator = getSelector('selectedOperator', pageName);

When('The user adds a new filter', () => {
  cy.wait(500);
  elementIsVisible(addFilterButton);
  clickElement(addFilterButton);
  cy.wait(500);
  fillField(filterSuggestionList,'rule.level');
  forceEnter(filterSuggestionList);
  cy.wait(500);
  getAvailableElement(filterOperatorList);
  elementIsVisible(filterOperatorList);
  forceClickElement(filterOperatorList);
  cy.wait(500);
  elementIsVisible(selectedOperator);
  forceClickElement(selectedOperator);
  fillField(filterParams,'7');
  clickElement(saveFilterButton);
});
