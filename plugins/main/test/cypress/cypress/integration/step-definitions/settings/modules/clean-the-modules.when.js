import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getAttributeElement } from '../../../utils/driver';

When('All modules are {}', (status) => {
    //activates/deactivates
    let activates = 0;
        if (elementIsVisible('react-component button[aria-checked="true"]')) {
            cy.get('react-component button[aria-checked="true"]').as('elementTrue').then(($el) => {
                activates = $el.length;
                if (activates != 0) {
                    cy.get('@elementTrue').each(($el) => {
                        elementIsVisible($el);
                        clickElement($el);
                    })
                }
            });
        }
});