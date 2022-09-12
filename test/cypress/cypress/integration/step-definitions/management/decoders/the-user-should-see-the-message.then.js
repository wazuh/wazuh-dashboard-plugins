import { Then } from 'cypress-cucumber-preprocessor/steps';
import { getElement, getSelector } from '../../../utils/driver';
import { DECODERS_PAGE as pageName} from '../../../utils/pages-constants';
const buttonRestartSelector = getSelector('buttonRestartSelector', pageName);
const messageConfirmSaveSelector = getSelector('messageConfirmSaveSelector', pageName);

Then('The user should see the message', () => {
  getElement(messageConfirmSaveSelector)
    .should('have.text', 'Changes will not take effect until a restart is performed.');
  getElement(buttonRestartSelector)
    .should('exist')
    .should('be.visible');
});
