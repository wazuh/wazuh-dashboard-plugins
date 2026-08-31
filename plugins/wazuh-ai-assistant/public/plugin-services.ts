import { createGetterSetter } from '../../../src/plugins/opensearch_dashboards_utils/common';
import { WazuhCorePluginStart } from '../../wazuh-core/public';

export const [getWazuhCore, setWazuhCore] =
  createGetterSetter<WazuhCorePluginStart>('WazuhCore');
