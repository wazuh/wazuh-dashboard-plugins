import {
  ChromeStart,
  CoreStart,
  HttpStart,
  IUiSettingsClient,
  OverlayStart,
  SavedObjectsStart,
  ScopedHistory,
  ToastsStart,
  AppMountParameters,
} from '../../../src/core/public';
import { createGetterSetter } from '../../../src/plugins/opensearch_dashboards_utils/common';
import { DataPublicPluginStart } from '../../../src/plugins/data/public';
import { VisualizationsStart } from '../../../src/plugins/visualizations/public';
import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';
import { AppPluginStartDependencies } from './types';
import { WazuhCheckUpdatesPluginStart } from '../../wazuh-check-updates/public';

let angularModule: any = null;
let discoverModule: any = null;

export const [getCore, setCore] = createGetterSetter<CoreStart>('Core');
export const [getPlugins, setPlugins] =
  createGetterSetter<AppPluginStartDependencies>('Plugins');
export const [getToasts, setToasts] = createGetterSetter<ToastsStart>('Toasts');
export const [getHttp, setHttp] = createGetterSetter<HttpStart>('Http');
export const [getUiSettings, setUiSettings] =
  createGetterSetter<IUiSettingsClient>('UiSettings');
export const [getChrome, setChrome] = createGetterSetter<ChromeStart>('Chrome');
export const [getScopedHistory, setScopedHistory] =
  createGetterSetter<ScopedHistory>('ScopedHistory');
export const [getOverlays, setOverlays] =
  createGetterSetter<OverlayStart>('Overlays');
export const [getSavedObjects, setSavedObjects] =
  createGetterSetter<SavedObjectsStart>('SavedObjects');
export const [getDataPlugin, setDataPlugin] =
  createGetterSetter<DataPublicPluginStart>('DataPlugin');
export const [getVisualizationsPlugin, setVisualizationsPlugin] =
  createGetterSetter<VisualizationsStart>('VisualizationsPlugin');
export const [getNavigationPlugin, setNavigationPlugin] =
  createGetterSetter<NavigationPublicPluginStart>('NavigationPlugin');
export const [getWzMainParams, setWzMainParams] =
  createGetterSetter<NavigationPublicPluginStart>('WzMainParams');
export const [getWzCurrentAppID, setWzCurrentAppID] =
  createGetterSetter<NavigationPublicPluginStart>('WzCurrentAppID');
export const [getWazuhCheckUpdatesPlugin, setWazuhCheckUpdatesPlugin] =
  createGetterSetter<WazuhCheckUpdatesPluginStart>('WazuhCheckUpdatesPlugin');
export const [getWazuhCorePlugin, setWazuhCorePlugin] =
  createGetterSetter<WazuhCheckUpdatesPluginStart>('WazuhCorePlugin');
export const [getHeaderActionMenuMounter, setHeaderActionMenuMounter] =
  createGetterSetter<AppMountParameters['setHeaderActionMenu']>(
    'headerActionMenuMounter',
  );

/**
 * set bootstrapped inner angular module
 */
export function setAngularModule(module: any) {
  angularModule = module;
}

/**
 * get boostrapped inner angular module
 */
export function getAngularModule() {
  return angularModule;
}

/**
 * set bootstrapped inner dicover module
 */
export function setDiscoverModule(module: any) {
  discoverModule = module;
}

/**
 * get boostrapped inner dicover module
 */
export function getDiscoverModule() {
  return discoverModule;
}

export const [getCookies, setCookies] = createGetterSetter<any>('Cookies');

let _wazuhStage = '';
let _wazuhRevision = '01';
let _wazuhIsProduction = false;

type WazuhInjectedMetadata = {
  getWazuhStage?: () => string;
  getWazuhRevision?: () => string;
  getWazuhIsProduction?: () => boolean;
};

/** Stores the Wazuh release stage injected from the dashboard (e.g. "beta2", "" for production). */
export function setWazuhBuildInfo(
  stage: string,
  revision: string,
  isProduction = false,
) {
  _wazuhStage = stage;
  _wazuhRevision = revision;
  _wazuhIsProduction = isProduction;
}

/** Reads Wazuh build info from core.injectedMetadata (requires wazuh-dashboard plugin_context support). */
export function initWazuhBuildInfoFromCore(
  injectedMetadata: WazuhInjectedMetadata,
): void {
  if (
    typeof injectedMetadata.getWazuhStage !== 'function' ||
    typeof injectedMetadata.getWazuhRevision !== 'function'
  ) {
    return;
  }

  const isProduction =
    typeof injectedMetadata.getWazuhIsProduction === 'function'
      ? injectedMetadata.getWazuhIsProduction()
      : false;

  setWazuhBuildInfo(
    injectedMetadata.getWazuhStage(),
    injectedMetadata.getWazuhRevision(),
    isProduction,
  );
}

/** Returns the Wazuh release stage (e.g. "beta2", "" for production). */
export function getWazuhStage(): string {
  return _wazuhStage;
}

/** Returns the Wazuh package release revision (e.g. "01", "02"). */
export function getWazuhRevision(): string {
  return _wazuhRevision;
}

/** Returns true when the dashboard build uses production package nomenclature. */
export function isWazuhProductionBuild(): boolean {
  return _wazuhIsProduction;
}

/** Returns true when the build is a pre-release (uses staging package repository). */
export function isWazuhPreRelease(): boolean {
  return !_wazuhIsProduction;
}
