import { WzMisc } from '../../factories/misc';
import { WazuhConfig } from '../../react-services';
import { getWzConfig } from './get-config';
import { settingsWizard } from './settings-wizard';

export function nestedResolve(params) {
  const wzMisc = new WzMisc();
  const healthCheckStatus = sessionStorage.getItem('healthCheck');
  if (!healthCheckStatus) return;
  const wazuhConfig = new WazuhConfig();
  return getWzConfig(wazuhConfig).then(() =>
    settingsWizard(
      params,
      wzMisc,
      params.location && params.location.pathname.includes('/health-check'),
    ),
  );
}
