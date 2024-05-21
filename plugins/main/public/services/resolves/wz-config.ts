import { WazuhConfig } from '../../react-services';
import { getWzConfig } from './get-config';

export function wzConfig({ location }) {
  // assignPreviousLocation($rootScope, $location);
  return getWzConfig(new WazuhConfig());
}
