import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector } from '../../../utils/driver';
import { WAZUH_MENU_PAGE as pageName} from '../../../utils/pages-constants';
const decodersLink = getSelector('decodersLink', pageName);
const wazuhMenuButton = getSelector('wazuhMenuButton', pageName);
const managementButton = getSelector('managementButton', pageName);

When('The user navigates to decoders', () => {
  elementIsVisible(wazuhMenuButton);
  clickElement(wazuhMenuButton);
  elementIsVisible(managementButton);
  clickElement(managementButton);
  elementIsVisible(decodersLink);
  clickElement(decodersLink);
});
