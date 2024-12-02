import { API_USER_STATUS_RUN_AS } from '../common/api-user-status-run-as';
import { Configuration } from '../common/services/configuration';
import { ServerSecurity } from './services';
import { DashboardSecurity } from './utils/dashboard-security';

export interface WazuhCorePluginSetup {
  // hooks: { useDockedSideNav: () => boolean };
  utils: { formatUIDate: (date: Date) => string };
  API_USER_STATUS_RUN_AS: API_USER_STATUS_RUN_AS;
  configuration: Configuration;
  dashboardSecurity: DashboardSecurity;
  serverSecurity: ServerSecurity;
  hooks: {
    useDockedSideNav: () => boolean;
    // TODO: missing serverSecurity hooks
  };
  hocs: {
    // TODO: missing serverSecurity hocs
  };
  ui: {
    // TODO: missing serverSecurity UI
  };
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginStart {
  utils: { formatUIDate: (date: Date) => string };
  API_USER_STATUS_RUN_AS: API_USER_STATUS_RUN_AS;
  configuration: Configuration;
  dashboardSecurity: DashboardSecurity;
  serverSecurity: ServerSecurity;
  hooks: {
    useDockedSideNav: () => boolean;
    // TODO: missing serverSecurity hooks
  };
  hocs: {
    // TODO: missing serverSecurity hocs
  };
  ui: {
    // TODO: missing serverSecurity UI
  };
}

export interface AppPluginStartDependencies {}
