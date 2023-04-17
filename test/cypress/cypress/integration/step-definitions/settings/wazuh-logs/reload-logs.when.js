import { clickElement, interceptAs, getSelector } from '../../../utils/driver';

import { LOGS_PAGE as pageName} from '../../../utils/pages-constants';
const reloadLogsLink = getSelector('reloadLogsLink', pageName);

When('The user reloads the logs', () => {
  interceptAs('GET', '/utils/logs', 'apiCheck');
  clickElement(reloadLogsLink);
  cy.wait(500);
});
