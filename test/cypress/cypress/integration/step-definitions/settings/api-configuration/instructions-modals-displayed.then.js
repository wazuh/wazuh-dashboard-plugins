import { elementIsVisible, elementTextIncludes, getSelector } from '../../../utils/driver';

import { API_CONFIGURATION_PAGE as pageName} from '../../../utils/pages-constants';
const addNewConnectionModal = getSelector('addNewConnectionModal', pageName);
const addNewConnectionModalTitle = getSelector('addNewConnectionModalTitle', pageName);

Then('The instructions modal is displayed', () => {
  elementIsVisible(addNewConnectionModal);
  elementTextIncludes(addNewConnectionModalTitle, 'Getting started');
});
