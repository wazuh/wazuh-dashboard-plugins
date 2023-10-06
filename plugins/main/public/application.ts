import angular from 'angular';
import { removeDisplayNoneBreadcrumb } from './utils/wz-logo-menu';

/**
 * Here's where Discover's inner angular is mounted and rendered
 */
export async function renderApp(moduleName: string, element: HTMLElement) {
  await import('./app');
  const $injector = mountWazuhApp(moduleName, element);
  return () => {
    // This is done because when not using the breadcrumb that opensearch offers
    // we add a display: "none" so that it is seen as we want the breadcrumb
    // and for the other applications we have to remove it.
    removeDisplayNoneBreadcrumb();
    return $injector.get('$rootScope').$destroy();
  };
}

function mountWazuhApp(moduleName: string, element: HTMLElement) {
  const mountpoint = document.createElement('div');
  const appWrapper = document.createElement('div');
  mountpoint.appendChild(appWrapper);
  // bootstrap angular into detached element and attach it later to
  // make angular-within-angular possible
  const $injector = angular.bootstrap(mountpoint, [moduleName]);
  element.appendChild(mountpoint);
  return $injector;
}
