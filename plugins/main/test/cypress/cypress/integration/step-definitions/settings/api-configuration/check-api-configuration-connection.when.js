import { clickElement, getSelector } from '../../../utils/driver';

import { API_CONFIGURATION_PAGE as pageName} from '../../../utils/pages-constants';
const checkConnectionButton = getSelector('checkConnectionButton', pageName);

When('The user checks API configuration connection', () => {
  clickElement(checkConnectionButton);
});
