import { When } from 'cypress-cucumber-preprocessor/steps';
import { clickElement, elementIsVisible, xpathElementIsVisible, clickElementByXpath, getSelector} from '../../utils/driver';

import { AGENTS_PAGE as pageName, AGENT_MODULES} from '../../utils/pages-constants';
const moreLink = getSelector('moreLink', pageName);

When('is navigates to agentModule {}', (moduleName) => {
  xpathElementIsVisible(moreLink);
  clickElementByXpath(moreLink);
  elementIsVisible(getSelector(moduleName, AGENT_MODULES));
  clickElement(getSelector(moduleName, AGENT_MODULES));
  });
  

  


  