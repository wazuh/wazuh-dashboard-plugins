import {
  App,
  AppUpdater,
  ChromeNavGroup,
  ChromeRegistrationNavLink,
  CoreSetup,
} from 'opensearch-dashboards/public';
import { Subject } from 'rxjs';
import { CLOUD_SECURITY_ID } from './cloud-security/cloud-security';
import { SECURITY_OPERATIONS_ID } from './security-operations/security-operations';
import { THREAT_INTELLIGENCE_ID } from './threat-intelligence/threat-intelligence';
import { ENDPOINT_SECURITY_ID } from './endpoint-security';

export type GroupsId =
  | typeof ENDPOINT_SECURITY_ID
  | typeof THREAT_INTELLIGENCE_ID
  | typeof SECURITY_OPERATIONS_ID
  | typeof CLOUD_SECURITY_ID;

export interface Group {
  getId: () => string;
  getTitle: () => string;
  getDescription: () => string;
  getNavGroup: () => ChromeNavGroup;
  getAppGroup: () => App;
  getGroupNavLink: () => ChromeRegistrationNavLink;
  getAppsNavLinks: () => ChromeRegistrationNavLink[];
  getApps: (updater$: Subject<AppUpdater>) => App[];
  addNavLinks: (core: CoreSetup) => void;
}
