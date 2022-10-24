import { Then } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, getSelector} from '../../../utils/driver';
import { RULES_PAGE as pageName} from '../../../utils/pages-constants';
const paginatorSelector = getSelector('paginatorSelector', pageName);
const rulestableSelector = getSelector('rulestableSelector', pageName);

Then('The user sees that the rule list is paginated', () => {
  elementIsVisible(paginatorSelector);
  cy.get(rulestableSelector).then(($e) =>{
    const listRulesText = $e.text();
    cy.log(listRulesText);
    cy.wrap(listRulesText).as('listRulesText');
  })
  cy.wait(1500);
});
