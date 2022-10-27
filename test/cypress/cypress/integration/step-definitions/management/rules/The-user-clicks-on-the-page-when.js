import { Then, When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector } from '../../../utils/driver';
import { RULES_PAGE as pageName } from '../../../utils/pages-constants';
const paginatorSelector = getSelector('paginatorSelector', pageName);
const paginatorSecondSelector = getSelector('paginatorSecondSelector', pageName);
const paginatorNextSelector = getSelector('paginatorNextSelector', pageName);
const paginatorPreviousSelector = getSelector('paginatorPreviousSelector', pageName);
const paginatorFirstSelector = getSelector('paginatorFirstSelector', pageName);

When('The user clicks on the {} page button', (page) => {
    let selector;
    elementIsVisible(paginatorSelector);
    switch (page) {
        case 'first':
            selector = paginatorFirstSelector;
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
    clickElement(selector);
    cy.wait(3000);
});









