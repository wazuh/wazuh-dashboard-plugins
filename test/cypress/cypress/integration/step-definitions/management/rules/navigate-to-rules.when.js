import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, validateURLIncludes, getSelector } from '../../../utils/driver';
import { WAZUH_MENU_PAGE as pageName} from '../../../utils/pages-constants';
const managementButton = getSelector('managementButton', pageName);
const wazuhMenuButton = getSelector('wazuhMenuButton', pageName);
const rulesLink = getSelector('rulesLink', pageName);

When('The user navigates to rules', () => {
  elementIsVisible(wazuhMenuButton);
  clickElement(wazuhMenuButton);
  elementIsVisible(managementButton);
  clickElement(managementButton);
  elementIsVisible(rulesLink);
  clickElement(rulesLink);
  validateURLIncludes('/manager/?tab=rules');
});
