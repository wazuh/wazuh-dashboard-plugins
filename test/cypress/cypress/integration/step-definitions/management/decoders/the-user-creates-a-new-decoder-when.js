import { When } from 'cypress-cucumber-preprocessor/steps';
import { fillField, elementIsVisible, getSelector } from '../../../utils/driver';
import { DECODERS_PAGE as pageName} from '../../../utils/pages-constants';
const decoderTitleSelector = getSelector('decoderTitleSelector', pageName);
const codeEditorSelector = getSelector('codeEditorSelector', pageName);
const testXmlText = '<decoder name="wazuh"><prematch>^wazuh2: </prematch></decoder>';

When('The user writes a new decoder', () => {
  elementIsVisible(decoderTitleSelector);
  fillField(decoderTitleSelector,'Example decoder');
  fillField(codeEditorSelector,testXmlText);
})

//Test comments:
//To the correct execution of this test, the decoder that is going to be created must not exist in the decoders list.
// If the decoder already exists, the test will fail.