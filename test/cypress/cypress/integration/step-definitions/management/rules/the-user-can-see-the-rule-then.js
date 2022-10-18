import { Then } from "cypress-cucumber-preprocessor/steps";


Then('The user can see the rules that match with the {}', (condition) => {
    cy.get('table tbody td:nth-child(5)')
    .should(($el) => {
        let values = Cypress._.map($el, 'innerText');
        expect(values).to.include(condition);
    }).then(($) => {
        expect($.length).to.be.greaterThan(0);
        
    })
})