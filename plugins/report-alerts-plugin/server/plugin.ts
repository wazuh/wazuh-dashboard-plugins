import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from '../../../src/core/server';

import { ReportAlertsPluginPluginSetup, ReportAlertsPluginPluginStart } from './types';
import { defineRoutes } from './routes';

export class ReportAlertsPluginPlugin
  implements Plugin<ReportAlertsPluginPluginSetup, ReportAlertsPluginPluginStart> {
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('reportAlertsPlugin: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start(core: CoreStart) {
    this.logger.debug('reportAlertsPlugin: Started');
    return {};
  }

  public stop() {}
}
