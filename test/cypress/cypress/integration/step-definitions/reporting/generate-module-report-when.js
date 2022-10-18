import { When } from 'cypress-cucumber-preprocessor/steps';
import { forceClickElement, elementIsVisible, getSelector} from '../../utils/driver';

import { REPORTING_PAGE as pageName} from '../../utils/pages-constants';
const generateReportButton = getSelector('generateReportButton', pageName);
const reportGeneratedToast = getSelector('reportGeneratedToast', pageName);

When('The user generate a module report clicking on the generate report option', () => {
  elementIsVisible(generateReportButton);
  forceClickElement(generateReportButton);
  cy.wait(500);
  elementIsVisible(reportGeneratedToast);
  });
