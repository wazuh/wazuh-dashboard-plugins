import { When } from 'cypress-cucumber-preprocessor/steps';
import { fillField, elementIsVisible, getSelector, generateRandomName } from '../../../utils/driver';
import { DECODERS_PAGE as pageName} from '../../../utils/pages-constants';
const decoderTitleSelector = getSelector('decoderTitleSelector', pageName);
const codeEditorSelector = getSelector('codeEditorSelector', pageName);
const testXmlText = '<decoder name="wazuh"><prematch>^wazuh2: </prematch></decoder>';

When('The user writes a new decoder', () => {
  elementIsVisible(decoderTitleSelector);
  fillField(decoderTitleSelector,generateRandomName());
  fillField(codeEditorSelector,testXmlText);
});