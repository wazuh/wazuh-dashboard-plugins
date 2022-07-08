import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement , elementIsVisible, getSelector} from '../../utils/driver';

import { WAZUH_MENU_PAGE as pageName, SETTINGS_MENU_LINKS} from '../../utils/pages-constants';
const settingsButton = getSelector('settingsButton', pageName);
const wazuhMenuButton = getSelector('wazuhMenuButton', pageName);

When('The user navigates to {} settings', (menuOption) => {
  elementIsVisible(wazuhMenuButton);
  clickElement(wazuhMenuButton);
  elementIsVisible(settingsButton);
  clickElement(settingsButton);
  elementIsVisible(getSelector(menuOption, SETTINGS_MENU_LINKS));
  clickElement(getSelector(menuOption, SETTINGS_MENU_LINKS));
});
