import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, getElement, getSelector} from '../../utils/driver';

import { FILTERS_PAGE as pageName} from '../../utils/pages-constants';
const stablishedFilter = getSelector('stablishedFilter', pageName);
const pinFilterAction = getSelector('pinFilterAction', pageName);
const pinnedFilter = getSelector('pinnedFilter', pageName);

When('The user pins a filter', () => {
    getElement(stablishedFilter)
     .should('exist')
     .should('be.visible');
    clickElement(stablishedFilter);
    getElement(pinFilterAction)
     .should('exist')
     .should('be.visible');
    clickElement(pinFilterAction)
    getElement(pinnedFilter)
     .should('exist')
     .should('be.visible');
  });
  