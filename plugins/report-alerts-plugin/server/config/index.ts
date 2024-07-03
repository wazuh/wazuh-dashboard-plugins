/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PluginConfigDescriptor } from '../../../../src/core/server';
import { ConfigSchema, ReportingConfigType } from './schema';
export { buildConfig } from './config';
export { ConfigSchema, ReportingConfigType };

export const config: PluginConfigDescriptor<ReportingConfigType> = {
  schema: ConfigSchema,
};
