import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, getSelector, getElement } from '../../../utils/driver';
import { DECODERS_PAGE as pageName} from '../../../utils/pages-constants';
const customDecodersButtonSelector = getSelector('customDecodersButtonSelector', pageName);

When('The user clicks the custom decoders button', () => {
  if(Cypress.env('type') == 'wzd'){
    getElement(customDecodersButtonSelector).check()
  }
  else {
    clickElement(customDecodersButtonSelector);
  }
  
});
