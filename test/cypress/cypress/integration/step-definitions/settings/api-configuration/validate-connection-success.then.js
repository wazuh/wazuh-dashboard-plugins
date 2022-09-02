import { elementTextIncludes, getSelector } from '../../../utils/driver';

import { API_CONFIGURATION_PAGE as pageName} from '../../../utils/pages-constants';
const connectionSuccessToast = getSelector('connectionSuccessToast', pageName);

Then('The connection success toast is displayed', () => {
  elementTextIncludes(connectionSuccessToast, 'Settings. Connection success');
});
