import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElementByXpath, xpathElementIsVisible, getSelector} from '../../utils/driver';
import { FILTERS_PAGE as pageName} from '../../utils/pages-constants';
const eventsButton = getSelector('eventsButton', pageName);

When('The user moves to events page', () => {
  xpathElementIsVisible(eventsButton);
  clickElementByXpath(eventsButton);
});

