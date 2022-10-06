import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector} from '../../utils/driver';

import { WAZUH_MENU_PAGE as pageName} from '../../utils/pages-constants';
const wazuhMenuButton = getSelector('wazuhMenuButton', pageName);
const managementButton = getSelector('managementButton', pageName);
const reportingLink = getSelector('reportingLink', pageName);

When('The user navigates to management-reporting', () => {
  elementIsVisible(wazuhMenuButton);
  clickElement(wazuhMenuButton);
  cy.wait(500);
  elementIsVisible(managementButton);
  clickElement(managementButton);
  elementIsVisible(reportingLink);
  clickElement(reportingLink);
  });
