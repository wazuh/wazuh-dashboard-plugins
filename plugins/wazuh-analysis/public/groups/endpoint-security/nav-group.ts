import { CoreSetup } from 'opensearch-dashboards/public';
import {
  CONFIGURATION_ASSESSMENT_ID,
  CONFIGURATION_ASSESSMENT_TITLE,
  FIM_ID,
  FIM_TITLE,
  MALWARE_DETECTION_ID,
  MALWARE_DETECTION_TITLE,
} from './applications';
import {
  ENDPOINT_SECURITY_DESCRIPTION,
  ENDPOINT_SECURITY_ID,
  ENDPOINT_SECURITY_TITLE,
} from './endpoint-security';

export const ENDPOINT_SECURITY_NAV_GROUP = {
  id: ENDPOINT_SECURITY_ID,
  title: ENDPOINT_SECURITY_TITLE,
  description: ENDPOINT_SECURITY_DESCRIPTION,
};

export const registerEndpointSecurityNavLinksToGroup = (core: CoreSetup) => {
  core.chrome.navGroup.addNavLinksToGroup(ENDPOINT_SECURITY_NAV_GROUP, [
    {
      // Configuration assessment
      id: CONFIGURATION_ASSESSMENT_ID,
      title: CONFIGURATION_ASSESSMENT_TITLE,
    },
    {
      // Malware detection
      id: MALWARE_DETECTION_ID,
      title: MALWARE_DETECTION_TITLE,
    },
    {
      // FIM
      id: FIM_ID,
      title: FIM_TITLE,
    },
  ]);
};
