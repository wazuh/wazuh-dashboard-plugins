import { WazuhConfig } from '../../react-services';
import { getWzConfig } from './get-config';

export function nestedResolve() {
  const wazuhConfig = new WazuhConfig();
  return getWzConfig(wazuhConfig);
}
