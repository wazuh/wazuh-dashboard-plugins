import React from 'react';
import { WAZUH_AGENTS_OS_TYPE } from '../../../../common/constants';
import { getAgentOSType } from '../../../react-services';
import { Agent } from '../../endpoints-summary/types';

export const getPlatformIcon = (agent?: Agent): React.JSX.Element => {
  let icon = '';
  const osType = getAgentOSType(agent);
  if (osType === WAZUH_AGENTS_OS_TYPE.DARWIN) {
    icon = 'apple';
  } else if (
    [WAZUH_AGENTS_OS_TYPE.WINDOWS, WAZUH_AGENTS_OS_TYPE.LINUX].includes(osType)
  ) {
    icon = osType;
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
