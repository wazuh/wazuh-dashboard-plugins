import { CoreStart } from 'opensearch-dashboards/public';
import type { FieldFormatsStart } from '../../../src/plugins/data/public';
import { createGetterSetter } from '../../../src/plugins/opensearch_dashboards_utils/common';
import { WazuhCorePluginStart } from '../../wazuh-core/public';

export const [getCore, setCore] = createGetterSetter<CoreStart>('Core');
export const [getWazuhCore, setWazuhCore] =
  createGetterSetter<WazuhCorePluginStart>('WazuhCore');
export const [
  getCtiRegistrationStatusPollIntervalSec,
  setCtiRegistrationStatusPollIntervalSec,
] = createGetterSetter<number>('CtiRegistrationStatusPollIntervalSec');
/** Field formats of the `data` plugin: numbers formatted as the advanced settings say. */
export const [getFieldFormats, setFieldFormats] =
  createGetterSetter<FieldFormatsStart>('FieldFormats');
