import { ChromeNavGroup } from 'opensearch-dashboards/public';
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
} satisfies Partial<Record<GroupsId, ChromeNavGroup>>);
