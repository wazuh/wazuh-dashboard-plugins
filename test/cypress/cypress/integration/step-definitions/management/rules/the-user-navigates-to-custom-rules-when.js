import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector } from '../../../utils/driver';
import { RULES_PAGE as pageName} from '../../../utils/pages-constants';
const customRulesButtonSelector = getSelector('customRulesButtonSelector', pageName);

When('The user clicks the custom rules button', () => {
  elementIsVisible(customRulesButtonSelector);
  clickElement(customRulesButtonSelector);
});
