import { Then } from 'cypress-cucumber-preprocessor/steps';
import { getElement, getSelector } from '../../../utils/driver';
import { DECODERS_PAGE as pageName} from '../../../utils/pages-constants';
const titleSelector = getSelector('titleSelector', pageName);
const tableSelector = getSelector('tableSelector', pageName);
const dropdownPaginationSelector = getSelector('dropdownPaginationSelector', pageName);
const listPages = getSelector('listPages', pageName);

Then('The user should see the decoders', () => {
  getElement(titleSelector)
    .should('exist')
    .should('contain', 'Decoders');
  getElement(tableSelector)
    .should('exist');
  getElement(dropdownPaginationSelector)
    .should('exist')
    .should('be.visible');
  getElement(listPages)
    .should('exist')
    .should('be.visible');
});
