import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement ,elementIsVisible, getSelector } from '../../../utils/driver';
import { DECODERS_PAGE as pageName} from '../../../utils/pages-constants';
const editDecoderButtonSelector = getSelector('editDecoderButtonSelector', pageName);
const manageDecodersFilesButtonSelector = getSelector('manageDecodersFilesButtonSelector', pageName);
const saveDecoderButtonSelector = getSelector('saveDecoderButtonSelector', pageName);

When('The user presses the edit decoders button and edits it', () => {
  elementIsVisible(manageDecodersFilesButtonSelector);
  clickElement(manageDecodersFilesButtonSelector);
  elementIsVisible(editDecoderButtonSelector);
  clickElement(editDecoderButtonSelector);
  elementIsVisible(saveDecoderButtonSelector);
  clickElement(saveDecoderButtonSelector);
});
