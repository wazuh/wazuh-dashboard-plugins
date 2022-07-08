import { When } from 'cypress-cucumber-preprocessor/steps';
import { xpathElementIsVisible, forceClickElementByXpath, getSelector} from '../../utils/driver';

import { BASIC_MODULES} from '../../utils/pages-constants';

When('The user goes to {}', (moduleName) => {
  xpathElementIsVisible(getSelector(moduleName, BASIC_MODULES));
  forceClickElementByXpath(getSelector(moduleName, BASIC_MODULES));
});
