import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector } from '../../../utils/driver';
import { RULES_PAGE as pageName} from '../../../utils/pages-constants';
const firstCustomRule = getSelector('firstCustomRule', pageName);
const xmlRuleFile = getSelector('xmlRuleFile', pageName);

When('The user selects a custom rule to edit', () => {
  elementIsVisible(firstCustomRule);
  clickElement(firstCustomRule);
  elementIsVisible(xmlRuleFile);
  clickElement(xmlRuleFile);
});
