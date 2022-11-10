import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector } from '../../utils/driver';
import { WAZUH_MENU_PAGE as pageName } from '../../utils/pages-constants';
const wazuhMenuButton = getSelector('wazuhMenuButton', pageName);
const policiesLink = getSelector('policiesLink', pageName);
const securityButton = getSelector('securityButton', pageName);

When('the user navigates to the policy section', () => {
  elementIsVisible(wazuhMenuButton);
  clickElement(wazuhMenuButton);
  elementIsVisible(securityButton);
  clickElement(securityButton);
  elementIsVisible(policiesLink);
  clickElement(policiesLink);
});
