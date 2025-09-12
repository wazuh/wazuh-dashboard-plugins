import React from 'react';
import { WAZUH_AGENTS_OS_TYPE } from '../../../../common/constants';
import { getAgentOSType } from '../../../react-services';
import { Agent } from '../../endpoints-summary/types';
import WzIconSVG from '../icons/wz-icon-svg';

export const getPlatformIcon = (agent?: Agent): React.JSX.Element => {
  const osType = getAgentOSType(agent);
  return (
    <WzIconSVG
      type={osType}
      style={{ width: 20, height: 20 }}
      className='AgentsTable__soBadge'
    />
  );
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
