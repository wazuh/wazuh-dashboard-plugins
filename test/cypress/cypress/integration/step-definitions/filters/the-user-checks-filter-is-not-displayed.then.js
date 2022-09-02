import { Then } from 'cypress-cucumber-preprocessor/steps';
import { elementIsNotVisible, getSelector} from '../../utils/driver';
import { FILTERS_PAGE as pageName} from '../../utils/pages-constants';
const stablishedFilter = getSelector('stablishedFilter', pageName);

Then('The user checks filter label is not added', () => {
  elementIsNotVisible(stablishedFilter);
  });