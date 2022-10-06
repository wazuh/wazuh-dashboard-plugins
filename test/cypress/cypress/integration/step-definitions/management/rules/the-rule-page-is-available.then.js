import { Then } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, getSelector } from '../../../utils/driver';
import { RULES_PAGE as pageName } from '../../../utils/pages-constants';
// const paginatorSelector = getSelector('paginatorSelector', pageName);
// const paginatorSecondSelector = getSelector('paginatorSecondSelector', pageName);
// const paginatorNextSelector = getSelector('paginatorNextSelector', pageName);
// const paginatorPreviousSelector = getSelector('paginatorPreviousSelector', pageName);
// const rulestableSelector = getSelector('rulestableSelector', pageName);
const paginatorFirstSelector = getSelector('paginatorFirstSelector', pageName);
const paginatorLastSelector = getSelector('paginatorLastSelector', pageName);


Then('The rule page is the {} available page', (page) => {
    (page == 'first') ? clickElement(paginatorFirstSelector) : clickElement(paginatorLastSelector);
    cy.wait(1500);
});