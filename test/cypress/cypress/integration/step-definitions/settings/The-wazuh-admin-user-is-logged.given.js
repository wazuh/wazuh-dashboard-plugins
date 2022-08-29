import { Given } from 'cypress-cucumber-preprocessor/steps';
import { navigate, elementIsVisible, getSelector } from '../../utils/driver';
import { WAZUH_MENU_PAGE as pageName} from '../../utils/pages-constants';
const wazuhMenuButton = getSelector('wazuhMenuButton', pageName);

Given('The wazuh admin user is logged',  () => {
    if (Cypress.env('type') != 'wzd') {
    navigate("app/wazuh");}else{navigate("/")}
    elementIsVisible(wazuhMenuButton);
})
