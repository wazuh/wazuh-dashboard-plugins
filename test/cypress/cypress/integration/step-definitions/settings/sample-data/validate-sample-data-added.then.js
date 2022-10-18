import { elementIsVisible, getSelector } from '../../../utils/driver';
import { SAMPLE_DATA_PAGE as pageName } from '../../../utils/pages-constants';
const dataAddedSuccessfullyToast = getSelector('dataAddedSuccessfullyToast', pageName);

Then('The add data success toasts are displayed', () => {
  elementIsVisible(dataAddedSuccessfullyToast);

  cy.get(dataAddedSuccessfullyToast)
    .should('have.length', 3)
    .each(($li, index, $lis) => {
      return 'something else'
    })
    .then(($lis) => {
      expect($lis).to.have.length(3)
    })
});
