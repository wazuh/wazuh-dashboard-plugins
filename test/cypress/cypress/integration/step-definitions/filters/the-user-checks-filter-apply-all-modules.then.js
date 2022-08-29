import { Then } from 'cypress-cucumber-preprocessor/steps';
import {getElement, getSelector} from '../../utils/driver';
import { FILTERS_PAGE as pageName} from '../../utils/pages-constants';
const pinnedFilter = getSelector('pinnedFilter', pageName);

Then('The user checks if the filter is displayed', () => {
     getElement(pinnedFilter)
     .should('exist')
     .should('be.visible');
  });
  