import { When } from 'cypress-cucumber-preprocessor/steps';
import { fillField, elementIsVisible, getSelector, forceEnter} from '../../utils/driver';
import { FILTERS_PAGE as pageName} from '../../utils/pages-constants';
const searchInputSelector = getSelector('searchInputSelector', pageName);

When('The user types a particular search {} on the search bar', (key) => {
    elementIsVisible(searchInputSelector);
    fillField(searchInputSelector, key);
    forceEnter(searchInputSelector);
});
