import {
  CoreStart,
  ISavedObjectsRepository,
  Logger,
} from 'opensearch-dashboards/server';
import { createGetterSetter } from '../../../src/plugins/opensearch_dashboards_utils/common';
import { WazuhCorePluginStart } from '../../wazuh-core/server';

export const [getInternalSavedObjectsClient, setInternalSavedObjectsClient] =
  createGetterSetter<ISavedObjectsRepository>('SavedObjectsRepository');
export const [getCore, setCore] = createGetterSetter<CoreStart>('Core');
export const [getWazuhCore, setWazuhCore] =
  createGetterSetter<WazuhCorePluginStart>('WazuhCore');
export const [getWazuhCheckUpdatesServices, setWazuhCheckUpdatesServices] =
  createGetterSetter<{ logger: Logger }>('WazuhCheckUpdatesServices');
