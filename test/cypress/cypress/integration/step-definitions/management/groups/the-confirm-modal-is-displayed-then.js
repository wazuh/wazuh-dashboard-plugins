import { Then } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector } from '../../../utils/driver';
import { GROUPS_PAGE as pageName} from '../../../utils/pages-constants';
const confirmModalSelector = getSelector('confirmModalSelector', pageName);

Then('The informative modal is displayed', () => {
  elementIsVisible(confirmModalSelector);
  clickElement(confirmModalSelector);
});
