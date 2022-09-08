import { clickElement, getSelector, forceClickElement } from '../../../utils/driver';
import { SAMPLE_DATA } from '../../../utils/pages-constants';
let toastLocator = '[data-test-subj="globalToastList"] div button';
let toastLocatorTitle = '[data-test-subj="globalToastList"] div';

When('The user {} sample data for', (status,types) => {
  let titleStatus = 'added'
  let buttonLabel = 'Remove data'
  if(status != 'adds'){titleStatus =  'removed'; buttonLabel = 'Add data';}
  types.raw().forEach((sample) => {
    cy.get(getSelector(sample, SAMPLE_DATA), { timeout: 15000 })
    forceClickElement(getSelector(sample, SAMPLE_DATA));
    cy.wait(500);
    cy.get(getSelector(sample, SAMPLE_DATA), { timeout: 15000 }).should('have.text',buttonLabel)
    cy.get(toastLocatorTitle, { timeout: 15000 })
      .then(($) => {
        const texts = $.map((i, el) => Cypress.$(el).text().replace('A new notification appears').replace('Date range for sample data is now-7 days ago'))
        const paragraphs = texts.get()
        let element = getSelector(sample + ' title', SAMPLE_DATA)
        let titles = Cypress.$(element).text()
        expect(paragraphs.toString()).to.contains(titles + ' alerts '+ titleStatus)
      })
  });
});
