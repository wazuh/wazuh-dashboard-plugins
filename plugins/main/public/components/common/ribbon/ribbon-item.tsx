import { EuiFlexItem, EuiLoadingSpinner } from '@elastic/eui';
import React from 'react';
import { WAZUH_AGENTS_OS_TYPE } from '../../../../common/constants';
import { AgentStatus } from '../../agents/agent-status';
import { Agent } from '../../endpoints-summary/types';
import { WzStat } from '../../wz-stat';
import { GroupTruncate } from '../util/agent-group-truncate';
import WzTextWithTooltipIfTruncated from '../wz-text-with-tooltip-if-truncated';

const FONT_SIZE = 12;

export enum RibbonItemLabel {
  GROUPS = 'Groups',
  OPERATING_SYSTEM = 'Operating system',
  STATUS = 'Status',
}

export type IRibbonItem<LABEL extends string = string, VALUE = any> = {
  label: LABEL;
  value: VALUE;
  style?: React.CSSProperties;
  isLoading?: boolean;
  icon?: React.ReactNode;
};

const isGroups = (
  item: IRibbonItem,
): item is IRibbonItem<RibbonItemLabel.GROUPS, string[]> => {
  return item.label === RibbonItemLabel.GROUPS;
};

const isOperatingSystem = (
  item: IRibbonItem,
): item is IRibbonItem<RibbonItemLabel.OPERATING_SYSTEM, Agent> => {
  return item.label === RibbonItemLabel.OPERATING_SYSTEM;
};

const isStatus = (
  item: IRibbonItem,
): item is IRibbonItem<RibbonItemLabel.STATUS, Agent> => {
  return item.label === RibbonItemLabel.STATUS;
};

interface RibbonItemProps {
  item: IRibbonItem;
}

const WzRibbonItem = (props: RibbonItemProps) => {
  const { item } = props;

  const elementStyle = { ...(item.style || {}), fontSize: FONT_SIZE };
  const wzWidth100 = { anchorClassName: 'wz-width-100' };
  const tooltipProps = item.label === 'Cluster node' ? wzWidth100 : {};

  const getPlatformIcon = (agent?: Agent) => {
    let icon = '';
    const { uname, platform } = agent?.os || {};

    if (
      uname?.toLowerCase().includes(WAZUH_AGENTS_OS_TYPE.LINUX) ||
      platform?.toLowerCase().includes('ubuntu')
    ) {
      icon = WAZUH_AGENTS_OS_TYPE.LINUX;
    } else if (platform === WAZUH_AGENTS_OS_TYPE.WINDOWS) {
      icon = WAZUH_AGENTS_OS_TYPE.WINDOWS;
    } else if (platform === WAZUH_AGENTS_OS_TYPE.DARWIN) {
      icon = 'apple';
    }

    return (
      <i
        className={`fa fa-${icon} AgentsTable__soBadge AgentsTable__soBadge--${icon}`}
        aria-hidden='true'
      ></i>
    );
  };

  const getOsName = (agent?: Agent) => {
    const { name, version } = agent?.os || {};

    if (!name && !version) return '-';

    if (!version) return name;

    if (!name) return version;

    return `${name} ${version}`;
  };

  const renderField = function <T>(field?: T): T | string {
    return field !== undefined || field ? field : '-';
  };

  const renderValue = () => {
    return item.isLoading ? (
      <EuiLoadingSpinner size='s' />
    ) : isGroups(item) && item.value?.length ? (
      <GroupTruncate
        groups={item.value}
        length={40}
        label={'more'}
        action={'redirect'}
      />
    ) : isOperatingSystem(item) ? (
      <WzTextWithTooltipIfTruncated
        position='bottom'
        tooltipProps={wzWidth100}
        elementStyle={{
          ...elementStyle,
          maxWidth: item.style?.maxWidth || 150,
        }}
      >
        {getPlatformIcon(item.value)} {getOsName(item.value)}
      </WzTextWithTooltipIfTruncated>
    ) : isStatus(item) ? (
      <AgentStatus
        status={item.value?.status}
        agent={item.value}
        style={elementStyle}
      />
    ) : (
      <WzTextWithTooltipIfTruncated
        position='bottom'
        tooltipProps={tooltipProps}
        elementStyle={elementStyle}
      >
        {item.icon} {renderField(item.value)}
      </WzTextWithTooltipIfTruncated>
    );
  };

  return (
    <EuiFlexItem
      className='wz-ribbon-item'
      key={item.label}
      style={item.style || null}
    >
      <WzStat title={renderValue()} description={item.label} titleSize='xs' />
    </EuiFlexItem>
  );
};

export default WzRibbonItem;
