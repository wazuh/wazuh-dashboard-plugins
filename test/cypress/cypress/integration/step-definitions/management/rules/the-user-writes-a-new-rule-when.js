import { When } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, getSelector, fillField } from '../../../utils/driver';
import { RULES_PAGE as pageName} from '../../../utils/pages-constants';
const codeEditorSelector = getSelector('codeEditorSelector', pageName);
const rulesTitleSelector = getSelector('rulesTitleSelector', pageName);

When('The user writes a new rule', () => {
  elementIsVisible(rulesTitleSelector);
  fillField(rulesTitleSelector,'Test')
  elementIsVisible(codeEditorSelector);
  fillField(codeEditorSelector,'Test');
});
