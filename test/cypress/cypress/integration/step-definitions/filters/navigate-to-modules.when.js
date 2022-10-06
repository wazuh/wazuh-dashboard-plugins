import { When } from 'cypress-cucumber-preprocessor/steps';
import { xpathElementIsVisible, forceClickElementByXpath, getSelector, forceClickElement, elementIsVisible} from '../../utils/driver';

import { BASIC_MODULES} from '../../utils/pages-constants';
import { WAZUH_MENU_PAGE as pageName} from '../../utils/pages-constants';
const wazuhMenuButton = getSelector('wazuhMenuButton', pageName);
When('The user goes to {}', (moduleName) => {
  
  cy.wait(500);
  elementIsVisible(wazuhMenuButton);
  cy.wait(500);
  forceClickElement(wazuhMenuButton);
  xpathElementIsVisible(getSelector(moduleName, BASIC_MODULES));
  forceClickElementByXpath(getSelector(moduleName, BASIC_MODULES));
});
