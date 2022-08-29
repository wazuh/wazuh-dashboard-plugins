import { Then } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector} from '../../../utils/driver';
import { RULES_PAGE as pageName} from '../../../utils/pages-constants';
const saveRulesMessage = getSelector('saveRulesMessage', pageName);

Then('The save message its displayed', () => {
  elementIsVisible(saveRulesMessage);
  clickElement(saveRulesMessage);
});
