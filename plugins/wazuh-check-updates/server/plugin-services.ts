import { CoreStart, ISavedObjectsRepository } from 'opensearch-dashboards/server';
import { createGetterSetter } from '../../../src/plugins/opensearch_dashboards_utils/common';

export const [getInternalSavedObjectsClient, setInternalSavedObjectsClient] = createGetterSetter<
  ISavedObjectsRepository
>('SavedObjectsRepository');
export const [getCore, setCore] = createGetterSetter<CoreStart>('Core');
export const [getPlugins, setPlugins] = createGetterSetter<CoreStart>('Core');
