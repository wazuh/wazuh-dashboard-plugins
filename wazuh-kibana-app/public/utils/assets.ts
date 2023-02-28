import { ASSETS_BASE_URL_PREFIX } from '../../common/constants';
import { getUiSettings } from '../kibana-services';

export const getAssetURL = (assetURL: string) => `${ASSETS_BASE_URL_PREFIX}${assetURL}`;

export const getThemeAssetURL = (asset: string, theme?: string) => {
  theme = theme || (getUiSettings()?.get('theme:darkMode') ? 'dark' : 'light');
  return getAssetURL(getThemeAsset(asset, theme));
};

export const getThemeAsset = (asset: string, theme: string) => {
  return `images/themes/${theme}/${asset}`;
};
