import { CoreStart } from 'opensearch-dashboards/public';
import { createGetterSetter } from '../../../src/plugins/opensearch_dashboards_utils/common';
import { WazuhCorePluginStart } from '../../wazuh-core/public';

export const [getCore, setCore] = createGetterSetter<CoreStart>('Core');
export const [getWazuhCore, setWazuhCore] =
  createGetterSetter<WazuhCorePluginStart>('WazuhCore');
