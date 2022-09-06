import { Then } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, getSelector } from '../../../utils/driver';
import { DECODERS_PAGE as pageName} from '../../../utils/pages-constants';
const saveDecoderMessage = getSelector('saveDecoderMessage', pageName);
const buttonRestartSelector = getSelector('buttonRestartSelector', pageName);

Then('The save message its displayed', () => {
  elementIsVisible(saveDecoderMessage);
  elementIsVisible(buttonRestartSelector);
});
