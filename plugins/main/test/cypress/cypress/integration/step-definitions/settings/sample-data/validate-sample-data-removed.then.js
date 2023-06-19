import { getSelector } from '../../../utils/driver';
import { SAMPLE_DATA_PAGE as pageName} from '../../../utils/pages-constants';
const dataAddedSuccessfullyToast = getSelector('dataAddedSuccessfullyToast', pageName);

Then('The remove data success toasts are displayed', () => {
  cy.get(dataAddedSuccessfullyToast).should('have.length', 0);
});
