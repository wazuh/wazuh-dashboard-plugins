import { Then } from 'cypress-cucumber-preprocessor/steps';
import { getElement, getSelector } from '../../../utils/driver';
import { RULES_PAGE as pageName} from '../../../utils/pages-constants';
const dropdownPaginationSelector = getSelector('dropdownPaginationSelector', pageName);
const listPagesSelector = getSelector('listPagesSelector', pageName);
const tableSelector = getSelector('tableSelector', pageName);
const titleSelector = getSelector('titleSelector', pageName);

Then('The user should see the rules', () => {
  getElement(titleSelector)
    .should('exist')
    .should('contain', 'Rules');
  getElement(tableSelector)
    .should('exist')
    .should('be.visible');
  getElement(dropdownPaginationSelector)
    .should('exist')
    .should('be.visible');
  getElement(listPagesSelector)
    .should('exist')
    .should('be.visible');
});
