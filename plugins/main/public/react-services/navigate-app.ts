import { getHttp } from '../kibana-services';

/**
 * Generate the app URL
 * @param url
 * @returns
 */
export const getNavigationAppURL = (url: string) =>
  getHttp().basePath.prepend(url);

/**
 * Navigate to app
 * @param url
 */
export const navigateAppURL = url => {
  const appURL = getNavigationAppURL(url);
  window.location.href = appURL;
};
