
import { Then } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, getSelector, getElement } from '../../../utils/driver';
import { RULES_PAGE as pageName} from '../../../utils/pages-constants';
const filterLabelSelector = getSelector('filterLabelSelector', pageName);


Then('The filter label is displayed on the filter bar with the correct {}', (condition) => {
    elementIsVisible(filterLabelSelector);
    getElement(filterLabelSelector).then(($el) => {
        expect($el.text()).to.equal("level: "+condition);
    })

});