import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElementByXpath, xpathElementIsVisible, getSelector } from '../../utils/driver';

import { AGENTS_PAGE as pageName} from '../../utils/pages-constants';
const deployNewAgentButton = getSelector('deployNewAgentButton', pageName);

When('The user selects a deploy new agent', () => {
    xpathElementIsVisible(deployNewAgentButton);
    clickElementByXpath(deployNewAgentButton);
});
