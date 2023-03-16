import { elementIsVisible, elementTextIncludes, getSelector } from '../../../utils/driver';
import { logsTitleText } from '../../../utils/logs-constants';

import { LOGS_PAGE as pageName} from '../../../utils/pages-constants';
const logsContainer = getSelector('logsContainer', pageName);
const logsTitle = getSelector('logsTitle', pageName);

Then("The Logs are displayed", () => {
  elementIsVisible(logsTitle);
  elementTextIncludes(logsTitle, logsTitleText);
  elementIsVisible(logsContainer);
});
