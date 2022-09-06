import { When } from 'cypress-cucumber-preprocessor/steps';
import { fillField, elementIsVisible, getSelector } from '../../../utils/driver';
import { DECODERS_PAGE as pageName} from '../../../utils/pages-constants';
const decoderTitleSelector = getSelector('decoderTitleSelector', pageName);
const codeEditorSelector = getSelector('codeEditorSelector', pageName);
const testXmlText = '<decoder name="json"><prematch>^{\s*"</prematch><plugin_decoder>JSON_Decoder</plugin_decoder></decoder>';

When('The user writes a new decoder', () => {
  elementIsVisible(decoderTitleSelector);
  fillField(decoderTitleSelector,'Test');
  fillField(codeEditorSelector,testXmlText);
})
