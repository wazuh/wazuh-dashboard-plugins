import { elementIsVisible, getSelector } from '../../../utils/driver';

import { API_CONFIGURATION_PAGE as pageName} from '../../../utils/pages-constants';
const testConnectionCheckBox = getSelector('newConnectionModalCheckConnectionButton', pageName);
const testConnectionCheckBoxMarked = getSelector('newConnectionModalCheckConnectionButton', pageName);

Then('The connection success check box is filled', () => {
  elementIsVisible(testConnectionCheckBox);
  elementIsVisible(testConnectionCheckBoxMarked);
});
