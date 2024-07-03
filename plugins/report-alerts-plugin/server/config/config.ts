/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CoreSetup,
  Logger,
  PluginInitializerContext,
} from '../../../../src/core/server';
import { ReportingConfigType } from './schema';
import { get } from 'lodash';
import { first, map } from 'rxjs/operators';
import { createConfig$ } from './createConfig';

interface Config<BaseType> {
  get<Key1 extends keyof BaseType>(key1: Key1): BaseType[Key1];
  get<Key1 extends keyof BaseType, Key2 extends keyof BaseType[Key1]>(
    key1: Key1,
    key2: Key2
  ): BaseType[Key1][Key2];
}

interface OsdServerConfigType {
  server: {
    basePath: string;
    host: string;
    name: string;
    port: number;
    protocol: string;
  };
}

export interface ReportingConfig extends Config<ReportingConfigType> {
  osdConfig: Config<OsdServerConfigType>;
}

export const buildConfig = async (
  initContext: PluginInitializerContext<ReportingConfigType>,
  core: CoreSetup,
  logger: Logger
): Promise<ReportingConfig> => {
  const config$ = initContext.config.create<ReportingConfigType>();
  const serverInfo = core.http.getServerInfo();
  const osdConfig = {
    server: {
      basePath: core.http.basePath.serverBasePath,
      host: serverInfo.hostname,
      name: serverInfo.name,
      port: serverInfo.port,
      protocol: serverInfo.protocol,
    },
  };

  const reportingConfig$ = createConfig$(core, config$, logger);
  const reportingConfig = await reportingConfig$.pipe(first()).toPromise();
  return {
    get: (...keys: string[]) => get(reportingConfig, keys.join('.'), null),
    osdConfig: {
      get: (...keys: string[]) => get(osdConfig, keys.join('.'), null),
    },
  };
};
