import { Then } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible,xpathElementIsVisible, xpathCheckInformationElement, checkInformationElement, getSelector } from '../../utils/driver';

import { DEPLOY_NEW_AGENT_PAGE as pageName} from '../../utils/pages-constants';
const agentToGroupSubTitle = getSelector('agentToGroupSubTitle', pageName);
const agentToGroupMessage = getSelector('agentToGroupMessage', pageName);
const agentToGroupSelector = getSelector('agentToGroupSelector', pageName);

Then('A third step {string} with the {string} are displayed and the following drop-down with Select group by default {string}', (title, discription, information) => {
    elementIsVisible(agentToGroupSubTitle);
    xpathElementIsVisible(agentToGroupMessage);
    elementIsVisible(agentToGroupSelector);
    checkInformationElement(agentToGroupSubTitle, title, 1);
    xpathCheckInformationElement(agentToGroupMessage, discription, 1);
    //TODO: skip WZD because on this UI the "agentToGroupSelector" is disable combo-box
    if (Cypress.env('type') != 'wzd') {checkInformationElement(agentToGroupSelector, information, 1)};
});
