import { WazuhConfig } from '../../react-services';
import { getWzConfig } from './get-config';

export function wzConfig() {
  return getWzConfig(new WazuhConfig());
}
