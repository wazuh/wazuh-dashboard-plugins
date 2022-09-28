import { Then } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector} from '../../utils/driver';

import { REPORTING_PAGE as pageName} from '../../utils/pages-constants';
const lastCreatedReport = getSelector('lastCreatedReport', pageName);

Then('The report is displayed in the table', () => {
  elementIsVisible(lastCreatedReport);
 /*if(lastCreatedReport.contains(""))
     {

     }*/
  });
