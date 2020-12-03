import { HttpStart, IUiSettingsClient, ToastsStart } from 'kibana/public';
import { createGetterSetter } from '../../../src/plugins/kibana_utils/common';
import { DataPublicPluginStart } from '../../../src/plugins/data/public';

export const [getToasts, setToasts] = createGetterSetter<ToastsStart>('Toasts');
export const [getHttp, setHttp] = createGetterSetter<HttpStart>('Http');
export const [getUiSettings, setUiSettings] = createGetterSetter<IUiSettingsClient>('UiSettings');
export const [getDataPlugin, setDataPlugin] = createGetterSetter<DataPublicPluginStart>(
  'DataPlugin'
);
