import { Then } from 'cypress-cucumber-preprocessor/steps';
import { getSelector } from '../../../utils/driver';
import { RULES_PAGE as pageName } from '../../../utils/pages-constants';
const listPagesSelector = getSelector('listPagesSelector', pageName);
const rulestableSelector = getSelector('rulestableSelector', pageName);
const titleSelector = getSelector('titleSelector', pageName);
const dropdownPaginationSelector = getSelector('dropdownPaginationSelector', pageName);
const customRulesButtonSelector = getSelector('customRulesButtonSelector', pageName);
const createNewRulesSelector = getSelector('createNewRulesSelector', pageName);
const refreshButtonSelector = getSelector('refreshButtonSelector', pageName);
const buttonListPageSelector = getSelector('buttonListPageSelector', pageName);

Then('The user should be able to see the rules page', () => {

  cy.get(titleSelector).then(($title) => {
    cy.get('@title').then(($e) => {
      expect($title.text()).to.be.eq($e);
    })
  })
  cy.get(rulestableSelector).then(($rules) => {
    cy.get('@rulesLength').then(($e) => {
      expect($rules.length).to.be.eq($e);
    })
  })
  cy.get(dropdownPaginationSelector).then(($pagination) => {
    cy.get('@paginationRows').then(($e) => {
      expect($pagination.text()).to.be.eq($e);
    })
  })
  cy.get(listPagesSelector).then(($paginationPages) => {
    cy.get('@paginationPages').then(($e) => {
      expect($paginationPages.text()).to.be.eq($e);
    })
  })
  cy.get(customRulesButtonSelector).then(($customRules) => {
    cy.get('@customRules').then(($e) => {
      expect($customRules.text()).to.be.eq($e);
    })
  })
  cy.get(createNewRulesSelector).then(($createNewRules) => {
    cy.get('@createNewRules').then(($e) => {
      expect($createNewRules.text()).to.be.eq($e);
    })
  })
  cy.get(refreshButtonSelector).then(($refreshButton) => {
    cy.get('@refreshButton').then(($e) => {
      expect($refreshButton.text()).to.be.eq($e);
    })
  })
  cy.get(buttonListPageSelector).then(($buttonLength) => {
    cy.get('@buttonLength').then(($e) => {
      expect($buttonLength.length).to.be.eq($e);
    })
  })
});