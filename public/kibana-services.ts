import {
  ChromeStart,
  HttpStart,
  IUiSettingsClient,
  ToastsStart,
  SavedObjectsStart,
  OverlayStart,
  ScopedHistory,
} from 'kibana/public';
import { createGetterSetter } from '../../../src/plugins/kibana_utils/common';
import { DataPublicPluginStart, IndexPatternsContract } from '../../../src/plugins/data/public';
import {  } from '../../../src/plugins/data/public';
import { create } from 'src/plugins/data/common/search/aggs/metrics/lib/get_response_agg_config_class';
import { VisualizationsStart } from '../../../src/plugins/visualizations/public';
import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';

export const [getToasts, setToasts] = createGetterSetter<ToastsStart>('Toasts');
export const [getHttp, setHttp] = createGetterSetter<HttpStart>('Http');
export const [getUiSettings, setUiSettings] = createGetterSetter<IUiSettingsClient>('UiSettings');
export const [getChrome, setChrome] = createGetterSetter<ChromeStart>('Chrome');
export const [getScopedHistory, setScopedHistory] = createGetterSetter<ScopedHistory>('ScopedHistory');
export const [getOverlays, setOverlays] = createGetterSetter<OverlayStart>('Overlays');
export const [getSavedObjects, setSavedObjects] = createGetterSetter<SavedObjectsStart>(
  'SavedObjects'
);
export const [getDataPlugin, setDataPlugin] = createGetterSetter<DataPublicPluginStart>(
  'DataPlugin'
);
export const [getIndexPattern, setIndexPattern] = createGetterSetter<IndexPatternsContract>(
  'IndexPattern'
);

export const [getVisualizationsPlugin, setVisualizationsPlugin] = createGetterSetter<
  VisualizationsStart
>('VisualizationsPlugin');
export const [getNavigationPlugin, setNavigationPlugin] = createGetterSetter<
  NavigationPublicPluginStart
>('NavigationPlugin');
