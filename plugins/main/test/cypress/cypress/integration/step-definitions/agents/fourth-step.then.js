import { Then } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, checkInformationElement, getSelector } from '../../utils/driver';

import { DEPLOY_NEW_AGENT_PAGE as pageName} from '../../utils/pages-constants';
const installAndEnrollAgentSubTitle = getSelector('installAndEnrollAgentSubTitle', pageName);
const installAndEnrollAgentDefaultLabel = getSelector('installAndEnrollAgentDefaultLabel', pageName);

Then('A fourth step {string} with the {string} by default is displayed', (title, message) => {
    elementIsVisible(installAndEnrollAgentSubTitle);
    elementIsVisible(installAndEnrollAgentDefaultLabel);
    checkInformationElement(installAndEnrollAgentSubTitle, title, 1);
    checkInformationElement(installAndEnrollAgentDefaultLabel, message, 1);
});
