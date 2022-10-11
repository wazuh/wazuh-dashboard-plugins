import { Then } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, getSelector } from '../../../utils/driver';
import { RULES_PAGE as pageName } from '../../../utils/pages-constants';
const paginatorFirstSelector = getSelector('paginatorFirstSelector', pageName);
const paginatorLastSelector = getSelector('paginatorLastSelector', pageName);

Then('The rule page is the {} available page', (page) => {
    (page == 'first') ? clickElement(paginatorFirstSelector) : clickElement(paginatorLastSelector);
    cy.wait(1500);
});