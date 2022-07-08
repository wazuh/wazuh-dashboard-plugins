import { clickElement, getSelector } from '../../../utils/driver';

import { MISCELLANEOUS_PAGE as pageName} from '../../../utils/pages-constants';
const runHealthChecksButton = getSelector('runHealthChecksButton', pageName);

When('The user runs the health checks', () => {
  clickElement(runHealthChecksButton);
});
