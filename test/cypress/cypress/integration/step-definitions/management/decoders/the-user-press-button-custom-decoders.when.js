import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, getSelector, getElement, elementIsVisible } from '../../../utils/driver';
import { DECODERS_PAGE as pageName} from '../../../utils/pages-constants';
const customDecodersButtonSelector = getSelector('customDecodersButtonSelector', pageName);

When('The user clicks the custom decoders button', () => {
  if(Cypress.env('type') == 'wzd'){
    cy.wait(1500);
    getElement(customDecodersButtonSelector).check()
  }
  else {
    elementIsVisible(customDecodersButtonSelector);
    clickElement(customDecodersButtonSelector);
  }
});
