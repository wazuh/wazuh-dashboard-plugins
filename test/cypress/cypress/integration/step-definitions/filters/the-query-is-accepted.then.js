import { Then } from "cypress-cucumber-preprocessor/steps";
import { elementIsNotVisible, getSelector } from '../../utils/driver';
import { FILTERS_PAGE as pageName} from '../../utils/pages-constants';
const noResultMessage = getSelector('noResultMessage', pageName);

Then('The query is accepted and the results should be displayed', () => {
    elementIsNotVisible(noResultMessage)
})