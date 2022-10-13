import { When } from "cypress-cucumber-preprocessor/steps";
import { getSelector, elementIsVisible } from "../../../utils/driver";
import { RULES_PAGE as pageName } from '../../../utils/pages-constants';
const dropdownPaginationSelector = getSelector('dropdownPaginationSelector', pageName);
const rulesRowTableSelector = getSelector('rulesRowTableSelector', pageName);

When('The user see that the rule list is displayed with a limit per rows', () => {
    elementIsVisible(dropdownPaginationSelector);
    elementIsVisible(rulesRowTableSelector);
})