import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, getSelector } from '../../../utils/driver';
import { GROUPS_PAGE as pageName} from '../../../utils/pages-constants';
const backButtonSelector = getSelector('backButtonSelector', pageName);

When('The user tries to exit edit groups page without saving data', () => {
  elementIsVisible(backButtonSelector);
  clickElement(backButtonSelector);
});
