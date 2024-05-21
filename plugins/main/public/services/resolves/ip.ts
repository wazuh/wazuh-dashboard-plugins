import { getIp } from './get-ip';

export function ip(params) {
  // assignPreviousLocation($rootScope, $location);
  return getIp(params);
}
