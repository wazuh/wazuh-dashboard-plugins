import { When } from 'cypress-cucumber-preprocessor/steps';
import { fillField, elementIsVisible, getSelector } from '../../../utils/driver';
import { DECODERS_PAGE as pageName} from '../../../utils/pages-constants';
const decoderTitleSelector = getSelector('decoderTitleSelector', pageName);
const codeEditorSelector = getSelector('codeEditorSelector', pageName);

When('The user writes a new decoder', () => {
  elementIsVisible(decoderTitleSelector);
  fillField(decoderTitleSelector,'Test');
  fillField(codeEditorSelector,'Test');
})
