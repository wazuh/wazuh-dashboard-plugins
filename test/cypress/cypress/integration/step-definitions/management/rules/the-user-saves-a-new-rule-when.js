import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector} from '../../../utils/driver';
import { RULES_PAGE as pageName} from '../../../utils/pages-constants';
const saveRulesButtonSelector = getSelector('saveRulesButtonSelector', pageName);

When('The user saves the rule', () => {
  elementIsVisible(saveRulesButtonSelector);
  clickElement(saveRulesButtonSelector);
});
