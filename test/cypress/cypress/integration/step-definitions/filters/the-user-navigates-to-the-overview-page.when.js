import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector} from '../../utils/driver';
import { WAZUH_MENU_PAGE as pageName} from '../../utils/pages-constants';
const wazuhMenuButton = getSelector('wazuhMenuButton', pageName);
const modulesDirectoryLink = getSelector('modulesDirectoryLink', pageName);
const modulesButton = getSelector('modulesButton', pageName);

When('The user navigates overview page', () => {
  elementIsVisible(wazuhMenuButton);
  clickElement(wazuhMenuButton);
  elementIsVisible(modulesButton);
  clickElement(modulesButton);
  elementIsVisible(modulesDirectoryLink);
  clickElement(modulesDirectoryLink);
});
