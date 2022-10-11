import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, fillField, elementIsVisible, getSelector, forceClickElement, forceEnter} from '../../utils/driver';
import { FILTERS_PAGE as pageName} from '../../utils/pages-constants';
const addFilterButton = getSelector('addFilterButton', pageName);
const filterSuggestionList = getSelector('filterSuggestionList', pageName);
const filterOperatorList = getSelector('filterOperatorList', pageName);
const filterParams = getSelector('filterParams', pageName);
const saveFilterButton = getSelector('saveFilterButton', pageName);
const selectedOperator = getSelector('selectedOperator', pageName);
const SelectedOperatorIs = getSelector('SelectedOperatorIs', pageName);
const operatorList = getSelector('operatorList', pageName);
const filterCard = getSelector('filterCard', pageName);
const filterOperatorListObject = getSelector('filterOperatorListObject', pageName);


When('The user adds a new filter', () => {
  //+ Add Filter
  elementIsVisible(addFilterButton);
  clickElement(addFilterButton);
  //Card
  elementIsVisible(filterCard);
  elementIsVisible(filterSuggestionList);
  fillField(filterSuggestionList,'rule.level');
  forceEnter(filterSuggestionList);
  elementIsVisible(filterOperatorList);
  forceClickElement(filterOperatorList);
  cy.wait(100);
  elementIsVisible(operatorList);
  elementIsVisible(filterOperatorListObject);
  cy.wait(150);
  cy.get(SelectedOperatorIs).click({force:true});
  elementIsVisible(filterParams);
  clickElement(filterParams);
  fillField(filterParams,'7')
  clickElement(saveFilterButton);
});
