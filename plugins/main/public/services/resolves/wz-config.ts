import { WazuhConfig } from '../../react-services';
import { getWzConfig } from './get-config';

export function wzConfig({ location }) {
  // TODO: assignPreviousLocation($rootScope, $location);
  return getWzConfig(new WazuhConfig());
}
