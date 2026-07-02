/*
 * Copyright Wazuh Inc.
 */

import { schema, TypeOf } from '@osd/config-schema';
import { WAZUH_DISABLED_SETTING_INDEX_RAW_EVENTS } from '../common/constants';

export const DISABLED_SETTING_IDS = [
  WAZUH_DISABLED_SETTING_INDEX_RAW_EVENTS,
] as const;

export type DisabledSettingId = (typeof DISABLED_SETTING_IDS)[number];

const disabledSettingIdsSet = new Set<string>(DISABLED_SETTING_IDS);

const disabledSettingSchema = schema.string({
  validate: (value: string) => {
    if (disabledSettingIdsSet.has(value)) {
      return;
    }
    return `invalid disabled setting '${value}', expected one of: ${DISABLED_SETTING_IDS.join(
      ', ',
    )}`;
  },
});

export const configSchema = schema.object({
  disabledSettings: schema.arrayOf(disabledSettingSchema, { defaultValue: [] }),
});

export type WazuhPluginConfigType = TypeOf<typeof configSchema>;
