import { getSavedSearch } from './get-saved-search';

export function savedSearch(params) {
  const healthCheckStatus = sessionStorage.getItem('healthCheck');
  if (!healthCheckStatus) return;
  return getSavedSearch(params);
}
