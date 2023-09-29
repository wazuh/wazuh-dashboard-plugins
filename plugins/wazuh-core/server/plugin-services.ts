import { CoreStart } from 'opensearch-dashboards/server';
import { createGetterSetter } from '../../../src/plugins/opensearch_dashboards_utils/common';

export const [getCore, setCore] = createGetterSetter<CoreStart>('Core');
