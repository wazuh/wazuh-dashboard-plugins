import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector } from '../../../utils/driver';
import { DECODERS_PAGE as pageName} from '../../../utils/pages-constants';
const createNewDecoderSelector = getSelector('createNewDecoderSelector', pageName);

When('The user clicks the new decoders button', () => {
  elementIsVisible(createNewDecoderSelector);
  clickElement(createNewDecoderSelector);
});
