import { Then } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, getSelector } from '../../utils/driver';

import { DEPLOY_NEW_AGENT_PAGE as pageName} from '../../utils/pages-constants';
const deployNewAgentSections = getSelector('deployNewAgentSections', pageName);

Then('The browser is on the new deploy agent page', () => {
    elementIsVisible(deployNewAgentSections);
});