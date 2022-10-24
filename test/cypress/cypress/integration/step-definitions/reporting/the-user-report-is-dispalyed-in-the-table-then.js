import { Then } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, elementTextIncludes, getSelector} from '../../utils/driver';
import {REPORT_NAME as reportName} from '../../utils/mappers/modules-mapper-report-data';
import { REPORTING_PAGE as pageName} from '../../utils/pages-constants';
const lastCreatedReport = getSelector('lastCreatedReport', pageName);

Then('The report is displayed in the table {}', (moduleName) => {
  elementIsVisible(lastCreatedReport);
  cy.wait(500);
  elementTextIncludes(lastCreatedReport, reportName[moduleName]);
});
