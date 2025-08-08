import { WzMisc } from '../../factories/misc';
import { WazuhConfig } from '../../react-services';
import { getWzConfig } from './get-config';
import { settingsWizard } from './settings-wizard';

export function nestedResolve(params) {
  const wzMisc = new WzMisc();
  const wazuhConfig = new WazuhConfig();
  return getWzConfig(wazuhConfig).then(() => settingsWizard(params, wzMisc));
}
