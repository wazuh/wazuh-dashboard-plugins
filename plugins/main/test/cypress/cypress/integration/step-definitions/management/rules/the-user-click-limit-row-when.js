import { When } from 'cypress-cucumber-preprocessor/steps';
import { getSelector, elementIsVisible, clickElement } from "../../../utils/driver";
import { RULES_PAGE as pageName } from '../../../utils/pages-constants';
const dropdownPaginationSelector = getSelector('dropdownPaginationSelector', pageName);

When('The user click the limit selector for {} rows', (countRulesPerPage) => {
    clickElement(dropdownPaginationSelector);
    let locator = '.euiContextMenuPanel [data-test-subj="tablePagination-'+countRulesPerPage+'-rows"]';
    elementIsVisible(locator);
    clickElement(locator);
    cy.wait(2000);
    cy.get(dropdownPaginationSelector).find('.euiButtonEmpty__text').then(($list) => {
        cy.wrap($list).contains('Rows per page: ' + countRulesPerPage);
    });
  });