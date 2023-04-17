import { When } from 'cypress-cucumber-preprocessor/steps';
import { getSelector } from '../../../utils/driver';
import { RULES_PAGE as pageName } from '../../../utils/pages-constants';
const paginatorFirstSelector = getSelector('paginatorFirstSelector', pageName);
const paginatorLastSelector = getSelector('paginatorLastSelector', pageName);

When('The rule page is not the {} available', (page) => {
    (page == 'first') ? cy.get(paginatorFirstSelector).should('not.have.attr', 'disabled') : cy.get(paginatorLastSelector).should('not.have.attr', 'disabled');
})