import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector} from '../../utils/driver';

import { REPORTING_PAGE as pageName} from '../../utils/pages-constants';
const generateReportButton = getSelector('generateReportButton', pageName);

When('The user generate a module report clicking on the generate report option', () => {
  elementIsVisible(generateReportButton);
  clickElement(generateReportButton);
  });
