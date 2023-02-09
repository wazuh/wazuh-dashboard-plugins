import { When } from 'cypress-cucumber-preprocessor/steps';
import { elementIsVisible, xpathElementIsVisible, clickElementByXpath, forceClickElement, getSelector} from '../../utils/driver';

import { AGENTS_PAGE as pageName, AGENT_MODULES} from '../../utils/pages-constants';
const moreLink = getSelector('moreLink', pageName);

When('The user navigates to agentModule {}', (moduleName) => {
  xpathElementIsVisible(moreLink);
  clickElementByXpath(moreLink);
  elementIsVisible(getSelector(moduleName, AGENT_MODULES));
  forceClickElement(getSelector(moduleName, AGENT_MODULES));
  });
  