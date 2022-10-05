import { Then, When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector } from '../../../utils/driver';
import { RULES_PAGE as pageName } from '../../../utils/pages-constants';
const paginatorSelector = getSelector('paginatorSelector', pageName);
const paginatorSecondSelector = getSelector('paginatorSecondSelector', pageName);
const paginatorNextSelector = getSelector('paginatorNextSelector', pageName);
const paginatorPreviousSelector = getSelector('paginatorPreviousSelector', pageName);
const rulestableSelector = getSelector('rulestableSelector', pageName);

When('The user clicks on the {} page button', (page) => {
    let selector;
    elementIsVisible(paginatorSelector);
    switch (page) {
        case 'first':
            selector = paginatorSelector;
            break;
        case 'second':
            selector = paginatorSecondSelector;
            break;
        case 'next':
            selector = paginatorNextSelector;
            break;
        case 'previous':
            selector = paginatorPreviousSelector;
            break;
        default:
            throw new Error(`The page ${page} is not defined`);
    }
    elementIsVisible(selector);
    clickElement(selector)
    cy.wait(1500);
});

When('A new set of rules it\'s displayed', () => {
    cy.wait(1500);
    elementIsVisible(paginatorSelector);
});

Then('The first page of rules it displayed', () => {
    cy.wait(1500);
    cy.get(rulestableSelector).then(($rules) => {
        cy.get('@listRulesText').then(($e) => {
            expect($rules).to.be.equals($e);
        })
    })

});