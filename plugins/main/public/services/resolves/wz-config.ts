import { WazuhConfig } from '../../react-services';
import { getWzConfig } from './get-config';

export function wzConfig({ location }) {
  return getWzConfig(new WazuhConfig());
}
