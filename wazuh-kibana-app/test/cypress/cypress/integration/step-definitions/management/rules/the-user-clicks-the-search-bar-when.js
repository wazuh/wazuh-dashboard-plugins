
import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector, fillField } from '../../../utils/driver';
import { RULES_PAGE as pageName} from '../../../utils/pages-constants';
const rulesFilterSelector = getSelector('rulesFilterSelector', pageName);
const dropdownFilterSelector = getSelector('dropdownFilterSelector', pageName);
const filterLevelSelector = getSelector('filterLevelSelector', pageName);
const filterNumberSelector = getSelector('filterNumberSelector', pageName);

When('The user search a rule by Level {}', (condition) => {
    let value = parseInt(condition) + 1;
    let filterNumberSelectorNew = filterNumberSelector.replace('0', value);
    elementIsVisible(rulesFilterSelector);
    clickElement(rulesFilterSelector);
    elementIsVisible(dropdownFilterSelector);
    clickElement(dropdownFilterSelector+' '+filterLevelSelector);
    cy.wait(500);
    elementIsVisible(dropdownFilterSelector+' '+filterNumberSelectorNew);
    clickElement(dropdownFilterSelector+' '+filterNumberSelectorNew);
    cy.wait(500);
});