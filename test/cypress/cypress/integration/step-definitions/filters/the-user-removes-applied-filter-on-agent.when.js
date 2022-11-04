import { When } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, xpathElementIsVisible, clickElement, getSelector} from '../../utils/driver';
import { FILTERS_PAGE as pageName} from '../../utils/pages-constants';
const removeFilterButton = getSelector('removeFilterButton', pageName);
const stablishedFilter = getSelector('stablishedFilter', pageName);

When('The user removes the applied filter on the agent page', () => {
  elementIsVisible(stablishedFilter);
  clickElement(stablishedFilter);
  xpathElementIsVisible(removeFilterButton);
  clickElement(removeFilterButton);
})
