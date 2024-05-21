import { getSavedSearch } from './get-saved-search';

export function savedSearch(params) {
  const healthCheckStatus = sessionStorage.getItem('healthCheck');
  if (!healthCheckStatus) return;
  // TODO: assignPreviousLocation($rootScope, $location);
  return getSavedSearch(params);
}
