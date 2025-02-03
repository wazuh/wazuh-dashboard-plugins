import { ChromeNavGroup } from 'opensearch-dashboards/public';
import {
  SECURITY_OPERATIONS_ID,
  SECURITY_OPERATIONS_TITLE,
  SECURITY_OPERATIONS_DESCRIPTION,
} from './security-operations/security-operations';
import {
  THREAT_INTELLIGENCE_ID,
  THREAT_INTELLIGENCE_TITLE,
  THREAT_INTELLIGENCE_DESCRIPTION,
} from './threat-intelligence/threat-intelligence';
import { GroupsId } from './types';

export const NAV_GROUPS = Object.freeze({
  [THREAT_INTELLIGENCE_ID]: {
    id: THREAT_INTELLIGENCE_ID,
    title: THREAT_INTELLIGENCE_TITLE,
    description: THREAT_INTELLIGENCE_DESCRIPTION,
  },
  [SECURITY_OPERATIONS_ID]: {
    id: SECURITY_OPERATIONS_ID,
    title: SECURITY_OPERATIONS_TITLE,
    description: SECURITY_OPERATIONS_DESCRIPTION,
  },
} satisfies Partial<Record<GroupsId, ChromeNavGroup>>);
