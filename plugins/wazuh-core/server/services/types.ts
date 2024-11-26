import { IConfigurationEnhanced } from './enhance-configuration';
import { IInitializationService } from './initialization';
import { ManageHosts } from './manage-hosts';
import { ISecurityFactory } from './security-factory';
import { ServerAPIClient } from './server-api-client';

export interface LifecycleService<
  SetupDeps = any,
  SetupReturn = any,
  StartDeps = any,
  StartReturn = any,
  StopDeps = any,
  StopReturn = any,
> {
  setup: (deps: SetupDeps) => SetupReturn;
  start: (deps: StartDeps) => StartReturn;
  stop: (deps: StopDeps) => StopReturn;
}

export interface WazuhCoreServices {
  dashboardSecurity: ISecurityFactory;
  configuration: IConfigurationEnhanced;
  manageHosts: ManageHosts;
  serverAPIClient: ServerAPIClient;
  initialization: IInitializationService;
}
