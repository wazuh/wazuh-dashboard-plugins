import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector} from '../../utils/driver';
import { FILTERS_PAGE as pageName} from '../../utils/pages-constants';
const stablishedFilter = getSelector('stablishedFilter', pageName);
const pinFilterAction = getSelector('pinFilterAction', pageName);
const pinnedFilter = getSelector('pinnedFilter', pageName);

When('The user pins a filter', () => {
    cy.wait(500);
    elementIsVisible(stablishedFilter);
    clickElement(stablishedFilter);
    elementIsVisible(pinFilterAction);
    clickElement(pinFilterAction);
    elementIsVisible(pinnedFilter);
  });
  