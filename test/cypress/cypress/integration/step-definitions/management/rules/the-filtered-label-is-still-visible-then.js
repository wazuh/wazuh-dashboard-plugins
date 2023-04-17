import { Then } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, getSelector, getElement } from '../../../utils/driver';
import { RULES_PAGE as pageName} from '../../../utils/pages-constants';
const filterLabelSelector = getSelector('filterLabelSelector', pageName);

Then('The filtered label {} is still visible', (condition) => {
    elementIsVisible(filterLabelSelector);
    getElement(filterLabelSelector).then(($el) => {
        expect($el.text()).to.equal("level: "+condition);
    })
});
