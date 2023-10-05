import { CoreStart, HttpStart, IUiSettingsClient } from 'opensearch-dashboards/public';
import { createGetterSetter } from '../../../src/plugins/opensearch_dashboards_utils/common';

export const [getCore, setCore] = createGetterSetter<CoreStart>('Core');
export const [getUiSettings, setUiSettings] = createGetterSetter<IUiSettingsClient>('UiSettings');
export const [getHttp, setHttp] = createGetterSetter<HttpStart>('Http');
