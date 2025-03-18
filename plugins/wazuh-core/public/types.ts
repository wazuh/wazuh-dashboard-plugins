import React from 'react';
import {
  DataPublicPluginSetup,
  DataPublicPluginStart,
} from 'src/plugins/data/public';
import { API_USER_STATUS_RUN_AS } from '../common/api-user-status-run-as';
import { Configuration } from '../common/services/configuration';
import { State, StateSetupReturn } from './services/state';
import { ServerSecurity, ServerSecuritySetupReturn } from './services';
import { TableDataProps } from './components';
import { UseStateStorageHook } from './hooks';
import { UseDockedSideNav } from './hooks/use-docked-side-nav';
import { HTTPClient } from './services/http/types';
import { ServerDataProps } from './services/http/ui/components/types';
import {
  DashboardSecurityService,
  DashboardSecurityServiceSetupReturn,
} from './services/dashboard-security';
import { ApplicationService } from './services/application/application';
import { IQueryManagerFactory } from './services/query-manager/types';

export interface AppPluginSetupDependencies {
  data: DataPublicPluginSetup;
}

export interface AppPluginStartDependencies {
  data: DataPublicPluginStart;
}

export interface WazuhCorePluginSetup {
  _internal: any;
  utils: { formatUIDate: (date: Date) => string };
  applicationService: ApplicationService;
  API_USER_STATUS_RUN_AS: typeof API_USER_STATUS_RUN_AS;
  configuration: Configuration;
  dashboardSecurity: DashboardSecurityService;
  state: State;
  http: HTTPClient;
  serverSecurity: ServerSecurity;
  hooks: {
    useDockedSideNav: () => boolean;
  } & DashboardSecurityServiceSetupReturn['hooks'] &
    ServerSecuritySetupReturn['hooks'] &
    StateSetupReturn['hooks'];
  hocs: {} & DashboardSecurityServiceSetupReturn['hocs'] &
    ServerSecuritySetupReturn['hocs'] &
    StateSetupReturn['hocs'];
  ui: {
    TableData: <T>(
      prop: TableDataProps<T>,
    ) => React.ComponentType<TableDataProps<T>>;
    SearchBar: (prop: any) => React.ComponentType<any>;
    ServerTable: <T>(
      prop: ServerDataProps<T>,
    ) => React.ComponentType<ServerDataProps<T>>;
  } & ServerSecuritySetupReturn['ui'];
}

export interface WazuhCorePluginStart {
  queryManagerFactory: IQueryManagerFactory;
  utils: { formatUIDate: (date: Date) => string };
  applicationService: ApplicationService;
  API_USER_STATUS_RUN_AS: typeof API_USER_STATUS_RUN_AS;
  configuration: Configuration;
  dashboardSecurity: DashboardSecurityService;
  state: State;
  http: HTTPClient;
  serverSecurity: ServerSecurity;
  hooks: {
    useDockedSideNav: UseDockedSideNav;
    useStateStorage: UseStateStorageHook; // TODO: enhance
  } & DashboardSecurityServiceSetupReturn['hooks'] &
    ServerSecuritySetupReturn['hooks'] &
    StateSetupReturn['hooks'];
  hocs: {} & DashboardSecurityServiceSetupReturn['hocs'] &
    ServerSecuritySetupReturn['hocs'] &
    StateSetupReturn['hocs'];
  ui: {
    TableData: <T>(
      prop: TableDataProps<T>,
    ) => React.ComponentType<TableDataProps<T>>;
    SearchBar: (prop: any) => React.ComponentType<any>;
    ServerTable: <T>(
      prop: ServerDataProps<T>,
    ) => React.ComponentType<ServerDataProps<T>>;
  } & ServerSecuritySetupReturn['ui'];
}
