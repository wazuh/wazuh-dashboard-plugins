import { Then } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, getSelector} from '../../utils/driver';

import { FILTERS_PAGE as pageName} from '../../utils/pages-constants';
const stablishedFilter = getSelector('stablishedFilter', pageName);

Then('The user check filter label is added', () => {
  elementIsVisible(stablishedFilter);
  });
