import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector} from '../../utils/driver';

import { AGENTS_PAGE as pageName} from '../../utils/pages-constants';
const firstAgentList = getSelector('firstAgentList', pageName);
const statusChart = getSelector('statusChart', pageName);

When('The user navigates to the agent dashboard', () => {
  elementIsVisible(statusChart);
  elementIsVisible(firstAgentList);
  clickElement(firstAgentList);
});
