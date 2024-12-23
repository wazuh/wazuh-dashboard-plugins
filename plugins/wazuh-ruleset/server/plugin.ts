import {
  PluginInitializerContext,
  CoreSetup,
  Plugin,
  Logger,
} from '../../../src/core/server';
import { WazuhRulesetPluginSetup, WazuhRulesetPluginStart } from './types';
import { defineRoutes } from './routes';

export class WazuhRulesetPlugin
  implements Plugin<WazuhRulesetPluginSetup, WazuhRulesetPluginStart>
{
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('wazuh-ruleset: Setup');
    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start() {
    this.logger.debug('wazuh-ruleset: Started');

    return {};
  }

  public stop() {}
}
