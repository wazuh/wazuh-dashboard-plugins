import { clickElement, getSelector } from '../../../utils/driver';

import { API_CONFIGURATION_PAGE as pageName} from '../../../utils/pages-constants';
const addNewConnectionButton = getSelector('addNewConnectionButton', pageName);

When('The user tries to add new API configuration', () => {
  clickElement(addNewConnectionButton);
});
