import { API_USER_STATUS_RUN_AS } from '../common/api-user-status-run-as';
import { Configuration } from '../common/services/configuration';
import { TableDataProps } from './components';
import { UseStateStorageHook } from './hooks';
import { UseDockedSideNav } from './hooks/use-docked-side-nav';
import { HTTPClient } from './services/http/types';
import { ServerDataProps } from './services/http/ui/components/types';
import { DashboardSecurity } from './utils/dashboard-security';

export interface WazuhCorePluginSetup {
  utils: { formatUIDate: (date: Date) => string };
  API_USER_STATUS_RUN_AS: API_USER_STATUS_RUN_AS;
  configuration: Configuration;
  dashboardSecurity: DashboardSecurity;
  http: HTTPClient;
  ui: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TableData: <T>(
      prop: TableDataProps<T>,
    ) => React.ComponentType<TableDataProps<T>>;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    SearchBar: (prop: any) => React.ComponentType<any>;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ServerTable: <T>(
      prop: ServerDataProps<T>,
    ) => React.ComponentType<ServerDataProps<T>>;
  };
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginStart {
  hooks: {
    useDockedSideNav: UseDockedSideNav;
    useStateStorage: UseStateStorageHook; // TODO: enhance
  };
  utils: { formatUIDate: (date: Date) => string };
  API_USER_STATUS_RUN_AS: API_USER_STATUS_RUN_AS;
  configuration: Configuration;
  dashboardSecurity: DashboardSecurity;
  http: HTTPClient;
  ui: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    TableData: <T>(
      prop: TableDataProps<T>,
    ) => React.ComponentType<TableDataProps<T>>;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    SearchBar: (prop: any) => React.ComponentType<any>;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ServerTable: <T>(
      prop: ServerDataProps<T>,
    ) => React.ComponentType<ServerDataProps<T>>;
  };
}

export type AppPluginStartDependencies = object;
