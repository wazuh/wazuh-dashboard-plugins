import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../src/core/server';

import { WazuhCheckUpdatesPluginSetup, WazuhCheckUpdatesPluginStart } from './types';
import { defineRoutes } from './routes';
import {
  availableUpdatesObject,
  settingsObject,
  userPreferencesObject,
} from './services/savedObject/types';
import { setCore, setInternalSavedObjectsClient } from './plugin-services';
import { jobSchedulerRun } from './services/cronjob';

export class WazuhCheckUpdatesPlugin
  implements Plugin<WazuhCheckUpdatesPluginSetup, WazuhCheckUpdatesPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('wazuh_check_updates: Setup');
    const router = core.http.createRouter();

    // Register saved objects types
    core.savedObjects.registerType(availableUpdatesObject);
    core.savedObjects.registerType(settingsObject);
    core.savedObjects.registerType(userPreferencesObject);

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart): WazuhCheckUpdatesPluginStart {
    this.logger.debug('wazuhCheckUpdates: Started');

    const internalSavedObjectsClient = core.savedObjects.createInternalRepository();
    setCore(core);
    setInternalSavedObjectsClient(internalSavedObjectsClient);

    // Scheduler
    jobSchedulerRun();

    return {};
  }

  public stop() {}
}
