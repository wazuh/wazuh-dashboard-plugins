/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema, TypeOf } from '@osd/config-schema';

const OsdServerSchema = schema.object({
  hostname: schema.maybe(
    schema.string({
      validate(value) {
        if (value === '0') {
          return 'must not be "0" for the headless browser to correctly resolve the host';
        }
      },
      hostname: true,
    })
  ),
  port: schema.maybe(schema.number()),
  protocol: schema.maybe(
    schema.string({
      validate(value) {
        if (!/^https?$/.test(value)) {
          return 'must be "http" or "https"';
        }
      },
    })
  ),
}); // default values are all dynamic in createConfig$

export const ConfigSchema = schema.object({
  osd_server: OsdServerSchema,
});

export type ReportingConfigType = TypeOf<typeof ConfigSchema>;
