import { ChromeStart, HttpStart, IUiSettingsClient, ToastsStart } from 'kibana/public';
import { createGetterSetter } from '../../../src/plugins/kibana_utils/common';
import { DataPublicPluginStart, IndexPatternsContract } from '../../../src/plugins/data/public';
import {  } from '../../../src/plugins/data/public';
import { create } from 'src/plugins/data/common/search/aggs/metrics/lib/get_response_agg_config_class';

export const [getToasts, setToasts] = createGetterSetter<ToastsStart>('Toasts');
export const [getHttp, setHttp] = createGetterSetter<HttpStart>('Http');
export const [getUiSettings, setUiSettings] = createGetterSetter<IUiSettingsClient>('UiSettings');
export const [getChrome, setChrome] = createGetterSetter<ChromeStart>('Chrome');
export const [getDataPlugin, setDataPlugin] = createGetterSetter<DataPublicPluginStart>(
  'DataPlugin'
);
export const [getIndexPattern, setIndexPattern] = createGetterSetter<IndexPatternsContract>(
  'IndexPattern'
);
