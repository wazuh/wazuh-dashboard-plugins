import { Then } from 'cypress-cucumber-preprocessor/steps';
import { getElement, getSelector } from '../../utils/driver';

import { DEPLOY_NEW_AGENT_PAGE as pageName} from '../../utils/pages-constants';
const deployNewAgentSections = getSelector('deployNewAgentSections', pageName);

Then('A box with four steps to the different settings is displayed', () => {
    getElement(deployNewAgentSections).its('length').should('eq', 4)
});
