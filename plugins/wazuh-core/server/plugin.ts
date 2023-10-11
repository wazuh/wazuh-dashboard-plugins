import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
  Logger,
} from 'opensearch-dashboards/server';

import {
  PluginSetup,
  WazuhCorePluginSetup,
  WazuhCorePluginStart,
} from './types';
import { setCore } from './plugin-services';
import * as controllers from './controllers';
import * as services from './services';

export class WazuhCorePlugin
  implements Plugin<WazuhCorePluginSetup, WazuhCorePluginStart>
{
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public async setup(core: CoreSetup, plugins: PluginSetup) {
    this.logger.debug('wazuh_core: Setup');

    return {};
  }

  public start(core: CoreStart): WazuhCorePluginStart {
    this.logger.debug('wazuhCore: Started');

    setCore(core);

    return {
      controllers,
      services
    };
  }

  public stop() {}
}