import { Then } from 'cypress-cucumber-preprocessor/steps';
import { getScreenshot, waitWebElementDisapear } from '../../utils/driver';
import { elementIsVisible, getSelector } from '../../utils/driver';
import { ABOUT_PAGE as pageName } from '../../utils/pages-constants';
const appVersionNumber = getSelector('appVersionNumber', pageName);
const appVersionTitle = getSelector('appVersionTitle', pageName);

Then('The user can see the wazuh information', () => {
    elementIsVisible(appVersionTitle);
    elementIsVisible(appVersionNumber);
    waitWebElementDisapear('[data-test-subj="globalToastList"]', 1000);
    getScreenshot(Cypress.env('type'), pageName.toLowerCase());
});