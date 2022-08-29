import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector } from '../../../utils/driver';
import { DECODERS_PAGE as pageName} from '../../../utils/pages-constants';
const saveDecoderButtonSelector = getSelector('saveDecoderButtonSelector', pageName);

When('The user saves the decoder', () => {
  elementIsVisible(saveDecoderButtonSelector);
  clickElement(saveDecoderButtonSelector);
});
