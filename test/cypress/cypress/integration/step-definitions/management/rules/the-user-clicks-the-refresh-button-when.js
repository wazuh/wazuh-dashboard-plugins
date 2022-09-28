import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector } from '../../../utils/driver';
import { RULES_PAGE as pageName } from '../../../utils/pages-constants';
const refreshButtonSelector = getSelector('refreshButtonSelector', pageName);
const titleSelector = getSelector('titleSelector', pageName);
const rulestableSelector = getSelector('rulestableSelector', pageName);
const dropdownPaginationSelector = getSelector('dropdownPaginationSelector', pageName);
const listPagesSelector = getSelector('listPagesSelector', pageName);
const customRulesButtonSelector = getSelector('customRulesButtonSelector', pageName);
const createNewRulesSelector = getSelector('createNewRulesSelector', pageName);
const buttonListPageSelector = getSelector('buttonListPageSelector', pageName);


When('The user clicks the refresh button', () => {
  elementIsVisible(titleSelector);
  elementIsVisible(rulestableSelector);
  elementIsVisible(dropdownPaginationSelector);
  elementIsVisible(listPagesSelector);
  elementIsVisible(customRulesButtonSelector);
  elementIsVisible(createNewRulesSelector);
  elementIsVisible(refreshButtonSelector);
  elementIsVisible(buttonListPageSelector);
  cy.get(titleSelector).invoke('text').as('title');
  cy.get(rulestableSelector).then(($e) =>{
    cy.wrap($e.length).as('rulesLength');
  })
  cy.get(dropdownPaginationSelector).invoke('text').as('paginationRows');
  cy.get(listPagesSelector).invoke('text').as('paginationPages');
  cy.get(customRulesButtonSelector).invoke('text').as('customRules');
  cy.get(createNewRulesSelector).invoke('text').as('createNewRules');
  cy.get(refreshButtonSelector).invoke('text').as('refreshButton');
  cy.get(buttonListPageSelector).then(($e) =>{
    cy.wrap($e.length).as('buttonLength');
  });
  clickElement(refreshButtonSelector);
  cy.wait(1500);
});