import { When } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, getSelector, fillField, generateRandomName } from '../../../utils/driver';
import { RULES_PAGE as pageName} from '../../../utils/pages-constants';
const codeEditorSelector = getSelector('codeEditorSelector', pageName);
const rulesTitleSelector = getSelector('rulesTitleSelector', pageName);
const testXmlText = '<group name="windows,"><rule id="6" level="0" noalert="1">  <category>windows</category>  <description>Generic template for all windows rules.</description></rule></group>';

When('The user writes a new rule', () => {
  elementIsVisible(rulesTitleSelector);
  fillField(rulesTitleSelector,generateRandomName())
  elementIsVisible(codeEditorSelector);
  fillField(codeEditorSelector,testXmlText);
});
