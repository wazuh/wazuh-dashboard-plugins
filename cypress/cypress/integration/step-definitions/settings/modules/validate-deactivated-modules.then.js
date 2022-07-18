import { clickElement, elementIsNotVisible, elementIsVisible, getSelector } from '../../../utils/driver';
import { WAZUH_MENU_PAGE as pageName, MODULES_CARDS } from '../../../utils/pages-constants';
const modulesButton = getSelector('modulesButton', pageName);
const modulesDirectoryLink = getSelector('modulesDirectoryLink', pageName);
const wazuhMenuButton = getSelector('wazuhMenuButton', pageName);
const wazuhMenuLeft = getSelector('wazuhMenuLeft', pageName);
const wazuhMenuRight = getSelector('wazuhMenuRight', pageName);
const wazuhMenuSettingRight = getSelector('wazuhMenuSettingRight', pageName);

Then('The deactivated modules with {} are not displayed on home page', (moduleName) => {
  elementIsVisible(wazuhMenuButton);
  clickElement(wazuhMenuButton);
  elementIsVisible(wazuhMenuLeft);
  elementIsVisible(wazuhMenuRight);
  elementIsVisible(modulesButton);
  clickElement(modulesButton);
  cy.wait(1000)
  elementIsVisible(wazuhMenuSettingRight);
  elementIsVisible(modulesDirectoryLink);
  clickElement(modulesDirectoryLink);
  cy.get('react-component[name="OverviewWelcome"]', { timeout: 15000 });
  elementIsNotVisible(getSelector(moduleName, MODULES_CARDS));
});
