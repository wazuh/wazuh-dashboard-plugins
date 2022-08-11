import { Then } from 'cypress-cucumber-preprocessor/steps';
import { getScreenshot, waitWebElementDisapear} from '../../utils/driver';

Then('The user can see default module list', () => {
    waitWebElementDisapear('[data-test-subj="globalToastList"] .euiToast [data-test-subj="toastCloseButton"]', 10000);
    getScreenshot(Cypress.env('type'), 'OVERVIEW_PAGE'.toLowerCase());
    });
  