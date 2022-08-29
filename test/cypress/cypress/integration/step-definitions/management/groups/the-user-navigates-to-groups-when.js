import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector } from '../../../utils/driver';
import { WAZUH_MENU_PAGE as pageName} from '../../../utils/pages-constants';
const groupsLink = getSelector('groupsLink', pageName);
const wazuhMenuButton = getSelector('wazuhMenuButton', pageName);
const managementButton = getSelector('managementButton', pageName);

When('The user navigates to groups page', () => {
  elementIsVisible(wazuhMenuButton);
  clickElement(wazuhMenuButton);
  elementIsVisible(managementButton);
  clickElement(managementButton);
  elementIsVisible(groupsLink);
  clickElement(groupsLink);
});
