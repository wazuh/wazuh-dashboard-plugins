import { API_USER_STATUS_RUN_AS } from '../common/api-user-status-run-as';
import { Configuration } from '../common/services/configuration';
import { State } from './services/state';
import { DashboardSecurity } from './utils/dashboard-security';

export interface WazuhCorePluginSetup {
  utils: { formatUIDate: (date: Date) => string };
  API_USER_STATUS_RUN_AS: API_USER_STATUS_RUN_AS;
  configuration: Configuration;
  dashboardSecurity: DashboardSecurity;
  state: State;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginStart {
  hooks: { useDockedSideNav: () => boolean };
  utils: { formatUIDate: (date: Date) => string };
  API_USER_STATUS_RUN_AS: API_USER_STATUS_RUN_AS;
  configuration: Configuration;
  dashboardSecurity: DashboardSecurity;
  state: State;
}

export interface AppPluginStartDependencies {}
