import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector } from '../../utils/driver';
import { WAZUH_MENU_PAGE as pageName, SETTINGS_MENU_LINKS } from '../../utils/pages-constants';
const settingsButton = getSelector('settingsButton', pageName);
const wazuhMenuButton = getSelector('wazuhMenuButton', pageName);
const wazuhMenuLeft = getSelector('wazuhMenuLeft', pageName);
const wazuhMenuRight = getSelector('wazuhMenuRight', pageName);
const wazuhMenuSettingRight = getSelector('wazuhMenuSettingRight', pageName);

When('The user navigates to {} settings', (menuOption) => {
  elementIsVisible(wazuhMenuButton);
  clickElement(wazuhMenuButton);
  elementIsVisible(wazuhMenuLeft);
  elementIsVisible(wazuhMenuRight);
  elementIsVisible(settingsButton);
  clickElement(settingsButton);
  elementIsVisible(wazuhMenuSettingRight);
  cy.wait(800);
  elementIsVisible(getSelector(menuOption, SETTINGS_MENU_LINKS)).click();
});
