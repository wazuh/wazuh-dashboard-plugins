import { clickElement, getSelector } from '../../../utils/driver';
import { SAMPLE_DATA } from '../../../utils/pages-constants';
let toastLocator = '[data-test-subj="globalToastList"] div button';
let toastLocatorTitle = '[data-test-subj="globalToastList"] div span';

When('The user {} sample data for', (status,types) => {
  cy.get(toastLocator, { timeout: 8000 });
  clickElement(toastLocator);
  types.raw().forEach((sample) => {
    cy.wait(500)
    clickElement(getSelector(sample, SAMPLE_DATA));
    cy.wait(2000);
    cy.get(toastLocatorTitle, { timeout: 8000 })
      .then(($) => {
        const texts = $.map((i, el) => Cypress.$(el).text().replace('A new notification appears').replace('Date range for sample data is now-7 days ago'))
        const paragraphs = texts.get()
        let element = getSelector(sample + ' title', SAMPLE_DATA)
        let titles = Cypress.$(element).text()
        let titleStatus = 'added'
        if(status != 'adds') titleStatus =  'removed';
        expect(paragraphs.toString()).to.equals(titles + ' alerts '+ titleStatus)
        clickElement(toastLocator);
      })
  });
});
