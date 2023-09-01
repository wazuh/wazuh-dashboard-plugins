import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../src/core/server';

import { WazuhCheckUpdatesPluginSetup, WazuhCheckUpdatesPluginStart } from './types';
import { defineRoutes } from './routes';
import { getUpdate, getUpdateList } from './services';

export class WazuhCheckUpdatesPlugin
  implements Plugin<WazuhCheckUpdatesPluginSetup, WazuhCheckUpdatesPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('wazuh_check_updates: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart): WazuhCheckUpdatesPluginStart {
    this.logger.debug('wazuhCheckUpdates: Started');
    return {
      getUpdate,
      getUpdateList
    };
  }

  public stop() { }
}
