import { Then } from 'cypress-cucumber-preprocessor/steps';
import { getSelector } from '../../../utils/driver';
import { RULES_PAGE as pageName } from '../../../utils/pages-constants';
const rulestableSelector = getSelector('rulestableSelector', pageName);

Then('The user should be redirected to the next rule page available',() => {
    cy.wait(1500);
    cy.get(rulestableSelector).then(($rules) => {
        const rulesText = $rules.text();
        cy.log(rulesText);
        cy.get('@listRulesText').then(($e) => {
            expect(rulesText).to.not.be.equals($e);
        })
    })
});
