import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, fillField, elementIsVisible, getSelector, forceClickElement, forceEnter} from '../../utils/driver';
import { FILTERS_PAGE as pageName} from '../../utils/pages-constants';
const addFilterButton = getSelector('addFilterButton', pageName);
const filterSuggestionList = getSelector('filterSuggestionList', pageName);
const filterOperatorList = getSelector('filterOperatorList', pageName);
const filterParams = getSelector('filterParams', pageName);
const saveFilterButton = getSelector('saveFilterButton', pageName);
const selectedOperator = getSelector('selectedOperator', pageName);
const operatorList = getSelector('operatorList', pageName);

When('The user adds a new filter', () => {
  elementIsVisible(addFilterButton);
  clickElement(addFilterButton);
  fillField(filterSuggestionList,'rule.level');
  forceEnter(filterSuggestionList);
  forceClickElement(filterOperatorList);
  cy.wait(1000);
  elementIsVisible(operatorList);
  cy.wait(1000);
  forceClickElement(selectedOperator);
  elementIsVisible(filterParams);
  clickElement(filterParams);
  fillField(filterParams,'7')
  clickElement(saveFilterButton);

});
