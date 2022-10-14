import { When } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, getSelector } from '../../../utils/driver';
import { RULES_PAGE as pageName } from '../../../utils/pages-constants';
const paginatorSelector = getSelector('paginatorSelector', pageName);


When('A new set of rules is displayed', () => {
    cy.wait(2500);
    elementIsVisible(paginatorSelector);
});
