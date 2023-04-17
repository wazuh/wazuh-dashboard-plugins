import { clickElement, getSelector } from '../../../utils/driver';

import { API_CONFIGURATION_PAGE as pageName} from '../../../utils/pages-constants';
const newConnectionModalCheckConnectionButton = getSelector('newConnectionModalCheckConnectionButton', pageName);

When('The user tests the API connection from the instructions', () => {
    cy.get('tbody tr td').then(($e) => {

      let index = $e.findIndex((i, element) => {
        return element.text().indexOf('wazuh-manage');
    });
    cy.get('tbody tr:nth-child('+index+') td:nth-child(9) button[aria-label="Check connection"]').click();
  });
  clickElement(newConnectionModalCheckConnectionButton);
});
