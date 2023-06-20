import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector } from '../../../utils/driver';
import { MODULES_CARDS} from '../../../utils/pages-constants';

When('The user {} the modules with {}', (status, moduleName) => {
    elementIsVisible(getSelector(moduleName, MODULES_CARDS));
    clickElement(getSelector(moduleName, MODULES_CARDS));
    cy.wait(500)
});
