import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector, fillField } from '../../../utils/driver';
import { GROUPS_PAGE as pageName} from '../../../utils/pages-constants';
const codeEditorSelector = getSelector('codeEditorSelector', pageName);

When('The user modify the selected group', () => {
  elementIsVisible(codeEditorSelector);
  clickElement(codeEditorSelector);
  fillField(codeEditorSelector,"Test");
});
