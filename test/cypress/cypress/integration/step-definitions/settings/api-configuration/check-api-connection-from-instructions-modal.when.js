import { clickElement, getSelector } from '../../../utils/driver';

import { API_CONFIGURATION_PAGE as pageName} from '../../../utils/pages-constants';
const newConnectionModalCheckConnectionButton = getSelector('newConnectionModalCheckConnectionButton', pageName);

When('The user tests the API connection from the instructions', () => {
  clickElement(newConnectionModalCheckConnectionButton);
});
