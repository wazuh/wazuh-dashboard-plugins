import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from 'opensearch-dashboards/server';

import {
  PluginSetup,
  WazuhEndpointsPluginSetup,
  WazuhEndpointsPluginStart,
  AppPluginStartDependencies,
} from './types';
import { ISecurityFactory } from '../../wazuh-core/server/services/security-factory';

export class WazuhEndpointsPlugin
  implements Plugin<WazuhEndpointsPluginSetup, WazuhEndpointsPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup, plugins: PluginSetup) {
    this.logger.debug('wazuh_endpoints: Setup');

    return {};
  }

  public start(core: CoreStart, plugins: AppPluginStartDependencies): WazuhEndpointsPluginStart {
    this.logger.debug('wazuh_endpoints: Started');

    return {};
  }

  public stop() {}
}
