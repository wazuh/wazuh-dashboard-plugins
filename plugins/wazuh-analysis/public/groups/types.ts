import {
  App,
  AppUpdater,
  ChromeNavGroup,
  ChromeRegistrationNavLink,
  CoreSetup,
} from 'opensearch-dashboards/public';
import { Subject } from 'rxjs';
import { SECURITY_OPERATIONS_ID } from './security-operations/security-operations';
import { THREAT_INTELLIGENCE_ID } from './threat-intelligence/threat-intelligence';
import { ENDPOINT_SECURITY_ID } from './endpoint-security';
import { CLOUD_SECURITY_ID } from './cloud-security';

export type GroupsId =
  | typeof ENDPOINT_SECURITY_ID
  | typeof THREAT_INTELLIGENCE_ID
  | typeof SECURITY_OPERATIONS_ID
  | typeof CLOUD_SECURITY_ID;

export interface Group {
  getId: () => string;
  getTitle: () => string;
  getDescription: () => string;

  /**
   * This method is used to retrieve the navigation group to which the group
   * belongs. The `ChromeNavGroup` object represents a group of navigation links
   * within the OpenSearch Dashboards application. By calling `getNavGroup`, you
   * can get the specific navigation group associated with the group, which can
   * be used for organizing and displaying navigation links related to that
   * group within the application's user interface.
   */
  getNavGroup: () => ChromeNavGroup;

  /**
   * This method is used to retrieve the specific OpenSearch Dashboards
   * application associated with the group. The `App` object represents an
   * application within the OpenSearch Dashboards framework and contains
   * information about the application, such as its title, description, and
   * configuration.
   */
  getAppGroup: () => App;

  /**
   * This method is used to retrieve a specific navigation link associated with
   * the group. The `ChromeRegistrationNavLink` object represents a single
   * navigation link within the OpenSearch Dashboards application. By calling
   * this method, you can get the specific navigation link that is related to
   * the group, which can be used for navigating to a specific section or
   * feature within the application's user interface that is associated with
   * that group.
   */
  getGroupNavLink: () => ChromeRegistrationNavLink;

  /**
   * Returns an array of `ChromeRegistrationNavLink` objects. These objects
   * represent navigation links for sub-applications within the OpenSearch
   * Dashboards application that are associated with the specific group.
   */
  getAppsNavLinks: () => ChromeRegistrationNavLink[];

  /**
   * This method is used to retrieve the list of applications associated with
   * the specific group. The `updater$` parameter is a subject that can be used
   * to update or notify subscribers about changes to the list of applications.
   * By calling this method, you can get the array of `App` objects that belong
   * to the group, allowing you to access information about each application,
   * such as its title, description, and configuration within the OpenSearch
   * Dashboards framework.
   */
  getApps: (updater$: Subject<AppUpdater>) => App[];

  /**
   * This method is used to add navigation links related to the specific group
   * within the OpenSearch Dashboards application.
   */
  addNavLinks: (core: CoreSetup) => void;
}
