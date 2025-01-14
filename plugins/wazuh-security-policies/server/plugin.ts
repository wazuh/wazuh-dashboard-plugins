import {
  PluginInitializerContext,
  CoreSetup,
  Plugin,
  Logger,
} from '../../../src/core/server';
import {
  WazuhSecurityPoliciesPluginSetup,
  WazuhSecurityPoliciesPluginStart,
} from './types';
import { defineRoutes } from './routes';

export class WazuhSecurityPoliciesPlugin
  implements
    Plugin<WazuhSecurityPoliciesPluginSetup, WazuhSecurityPoliciesPluginStart>
{
  private readonly logger: Logger;

  constructor(initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get();
  }

  public setup(core: CoreSetup) {
    this.logger.debug('wazuhSecurityPolicies: Setup');

    const router = core.http.createRouter();

    // Register server side APIs
    defineRoutes(router);

    return {};
  }

  public start() {
    this.logger.debug('wazuhSecurityPolicies: Started');

    return {};
  }

  public stop() {}
}
