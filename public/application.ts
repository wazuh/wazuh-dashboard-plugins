import angular from 'angular';

/**
 * Here's where Discover's inner angular is mounted and rendered
 */
export async function renderApp(moduleName: string, element: HTMLElement) {
  await import('./app');
  const $injector = mountWazuhApp(moduleName, element);
  return () => $injector.get('$rootScope').$destroy();
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
