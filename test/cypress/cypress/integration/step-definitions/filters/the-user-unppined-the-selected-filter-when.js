import { When } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, clickElement, getSelector} from '../../utils/driver';
import { FILTERS_PAGE as pageName} from '../../utils/pages-constants';
const pinnedFilter = getSelector('pinnedFilter', pageName);
const pinFilterAction = getSelector('pinFilterAction', pageName);


When('The user unppined the selected filter', () => {
  elementIsVisible(pinnedFilter);
  clickElement(pinnedFilter);
  elementIsVisible(pinFilterAction);
  clickElement(pinFilterAction);

})
