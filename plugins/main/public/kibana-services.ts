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
export const [getCapabilities, setCapabilities] =
  createGetterSetter<CoreStart['application']['capabilities']>('Capabilities');

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

export type WazuhBuildInfo = {
  version: string;
  revision: string;
  stage: string;
  isProduction: boolean;
};

const defaultWazuhBuildInfo: WazuhBuildInfo = {
  version: '',
  revision: '01',
  stage: '',
  isProduction: false,
};

let _wazuhBuildInfo: WazuhBuildInfo = { ...defaultWazuhBuildInfo };

type WazuhInjectedMetadata = {
  getWazuhBuildInfo?: () => WazuhBuildInfo;
};

/** Stores Wazuh build metadata injected from the dashboard. */
export function setWazuhBuildInfo(buildInfo: WazuhBuildInfo) {
  _wazuhBuildInfo = buildInfo;
}

/** Reads Wazuh build info from core.injectedMetadata. */
export function initWazuhBuildInfoFromCore(
  injectedMetadata: WazuhInjectedMetadata,
): void {
  if (typeof injectedMetadata.getWazuhBuildInfo !== 'function') {
    return;
  }

  setWazuhBuildInfo(injectedMetadata.getWazuhBuildInfo());
}

/** Returns the Wazuh build metadata from the running dashboard. */
export function getWazuhBuildInfo(): WazuhBuildInfo {
  return _wazuhBuildInfo;
}

/** Returns the Wazuh release stage (e.g. "beta2", "" for production). */
export function getWazuhStage(): string {
  return _wazuhBuildInfo.stage;
}

/** Returns true when the dashboard build uses production package nomenclature. */
export function isWazuhProductionBuild(): boolean {
  return _wazuhBuildInfo.isProduction;
}

/**
 * Returns true when the build is a pre-release (uses staging package repository).
 *
 * Detection rule: the stage field starts with "alpha" or "beta" (case-insensitive).
 * - alpha, alpha1, beta, beta2, etc. → true  (staging repository)
 * - rc, rc1, "" (empty), "stable", or any unknown value → false (production repository)
 */
export function isWazuhPreRelease(): boolean {
  return /^(alpha|beta)/i.test(_wazuhBuildInfo.stage);
}
