import React from 'react';
import { WAZUH_AGENTS_OS_TYPE } from '../../../../common/constants';
import { getAgentOSType } from '../../../react-services';
import { Agent } from '../../endpoints-summary/types';
import { getUiSettings } from '../../../kibana-services';
import WindowsIconDark from '../../../assets/images/themes/dark/windows-icon.svg';
import WindowsIconLight from '../../../assets/images/themes/light/windows-icon.svg';

export const getPlatformIcon = (agent?: Agent): React.JSX.Element => {
  const isDarkMode = getUiSettings()?.get('theme:darkMode');

  let icon = '';
  const osType = getAgentOSType(agent);
  if (osType === WAZUH_AGENTS_OS_TYPE.DARWIN) {
    icon = 'apple';
  } else if (
    [WAZUH_AGENTS_OS_TYPE.WINDOWS, WAZUH_AGENTS_OS_TYPE.LINUX].includes(osType)
  ) {
    icon = osType;
  }

  if (osType === WAZUH_AGENTS_OS_TYPE.WINDOWS) {
    return (
      <img
        src={isDarkMode ? WindowsIconDark : WindowsIconLight}
        alt='Windows'
        style={{ width: 20, height: 20 }}
        className='AgentsTable__soBadge'
        aria-hidden='true'
      />
    );
  }

  if (icon) {
    return (
      <i
        className={`fa fa-${icon} AgentsTable__soBadge AgentsTable__soBadge--${osType}`}
        aria-hidden='true'
      ></i>
    );
  }
  return <></>;
};

export const getOsName = (agent?: Agent) => {
  const { name, version } = agent?.os || {};

  if (!name && !version) {
    return '-';
  }

  if (!version) {
    return name;
  }

  if (!name) {
    return version;
  }

  return `${name} ${version}`;
};
