import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector} from '../../../utils/driver';
import { RULES_PAGE as pageName} from '../../../utils/pages-constants';
const createNewRulesSelector = getSelector('createNewRulesSelector', pageName);

When('The user clicks the new rules button', () => {
  elementIsVisible(createNewRulesSelector);
  clickElement(createNewRulesSelector);
});
