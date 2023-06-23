import { Then } from 'cypress-cucumber-preprocessor/steps';
import {
  elementIsVisible,
  xpathElementIsVisible,
  checkInformationElement,
  getSelector,
} from '../../utils/driver';

import { DEPLOY_NEW_AGENT_PAGE as pageName} from '../../utils/pages-constants';
const operationSystemTitle = getSelector('operationSystemTitle', pageName);
const operationSystemOption = getSelector('operationSystemOption', pageName);
const closeButton = getSelector('closeButton', pageName);

Then('A first step {string} is displayed and the following {string} options', (title, option) => {
  elementIsVisible(operationSystemTitle);
  elementIsVisible(operationSystemOption);
  checkInformationElement(operationSystemTitle, title, 1);
  checkInformationElement(operationSystemOption, option, 4);
});

Then('An X button in the top right is displayed', () => {
  xpathElementIsVisible(closeButton);
});
