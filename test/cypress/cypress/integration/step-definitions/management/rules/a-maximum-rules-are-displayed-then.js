import { Then } from "cypress-cucumber-preprocessor/steps";
import { getSelector, elementIsVisible } from "../../../utils/driver";
import { RULES_PAGE as pageName } from '../../../utils/pages-constants';
const dropdownPaginationSelector = getSelector('dropdownPaginationSelector', pageName);
const rulesRowTableSelector = getSelector('rulesRowTableSelector', pageName);

Then('a maximum of {} rows of rules are displayed per page', (countRulesPerPage) => {
    elementIsVisible(dropdownPaginationSelector);
    elementIsVisible(rulesRowTableSelector);
    cy.get(rulesRowTableSelector).then(($list) => {
        expect($list.length).to.equal(parseInt(countRulesPerPage));
    });
});