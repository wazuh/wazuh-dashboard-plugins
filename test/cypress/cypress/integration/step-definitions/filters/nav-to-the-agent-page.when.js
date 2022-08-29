import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector} from '../../utils/driver';

import { WAZUH_MENU_PAGE as pageName} from '../../utils/pages-constants';
const wazuhMenuButton = getSelector('wazuhMenuButton', pageName);
const agentsButton = getSelector('agentsButton', pageName);

When('The user navigates to the agent page', () => {
  clickElement(wazuhMenuButton);
  elementIsVisible(agentsButton);
  clickElement(agentsButton);
});
