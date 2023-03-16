import { Then } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, getSelector, elementIsVisible } from '../../../utils/driver';
import { RULES_PAGE as pageName } from '../../../utils/pages-constants';
const paginatorFirstSelector = getSelector('paginatorFirstSelector', pageName);
const paginatorLastSelector = getSelector('paginatorLastSelector', pageName);

Then('The rule page is the {} available page', (page) => {
    if (page == 'first') {
        elementIsVisible(paginatorFirstSelector)
        clickElement(paginatorFirstSelector)
    } else {
        elementIsVisible(paginatorLastSelector);
        clickElement(paginatorLastSelector);
    }
    cy.wait(2000);
});