import { CoreStart, ToastsStart } from 'opensearch-dashboards/public';
import { createGetterSetter } from '../../../src/plugins/opensearch_dashboards_utils/common';
import { WazuhCorePluginStart } from '../../wazuh-core/public';
import { AppPluginStartDependencies } from './types';
import { AppSetup } from './application/types';

export const [getPlugins, setPlugins] =
  createGetterSetter<AppPluginStartDependencies>('Plugins');
export const [getCore, setCore] = createGetterSetter<CoreStart>('Core');
export const [getWazuhCore, setWazuhCore] =
  createGetterSetter<WazuhCorePluginStart>('WazuhCore');
export const [getAgentManagement, setAgentManagement] =
  createGetterSetter('AgentManagement');
export const [getToasts, setToasts] = createGetterSetter<ToastsStart>('Toasts');
export const [getEnrollAgentManagement, setEnrollAgentManagement] =
  createGetterSetter<AppSetup['enrollmentAgentManagement']>(
    'fleetManagementEnrollmentAgentManagement',
  );
